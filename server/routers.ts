import { createHash, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  getSession,
  createAnonymousSession,
  startSearching,
  getState,
  sendChatMessage,
  nextChat,
  endChat,
  blockAndLeave,
  activePartnerId,
  assertSearchLimit,
  assertReportLimit,
  getOnlineStats,
  INTERESTS,
  LANGUAGES,
  REPORT_REASONS,
} from "./chat/service";
import { reportMedia } from "./chat/media";
import {
  insertSafetyReport,
  upsertUser,
  getUserByOpenId,
  deleteUserByOpenId,
  getInternalUserId,
} from "./db";
import { assertAgeAssuranceEligible } from "./ageAssurance";
import { config } from "./config";
import { verifyGoogleIdToken, assertGoogleAuthRateLimit } from "./googleAuth";
import { syncUserRegistration, syncUserDeletion } from "./googleSheets";
import {
  createAuthSessionToken,
  setAuthCookie,
  clearAuthCookie,
} from "./authSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import type { InsertUser } from "../drizzle/schema";

const anonymousChatProcedure = publicProcedure.use(({ ctx, next }) => {
  const token =
    typeof ctx.req.headers["x-meetly-session"] === "string"
      ? ctx.req.headers["x-meetly-session"]
      : undefined;
  const chatSession = getSession(token);
  if (!chatSession)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your temporary chat session has expired. Start a new session.",
    });
  return next({ ctx: { ...ctx, chatSession } });
});

const reasonMap: Record<
  (typeof REPORT_REASONS)[number],
  | "csam_child_exploitation"
  | "non_consensual_sexual_content"
  | "harassment"
  | "sexual_content"
  | "suspected_minor"
  | "threats"
  | "spam"
  | "hate"
  | "privacy_violation"
  | "impersonation"
  | "other"
> = {
  "Child exploitation or CSAM": "csam_child_exploitation",
  "Non-consensual sexual content": "non_consensual_sexual_content",
  "Harassment or bullying": "harassment",
  "Sexual or explicit content": "sexual_content",
  "Suspected minor": "suspected_minor",
  "Threats or violent behavior": "threats",
  "Spam or scams": "spam",
  "Hate or abusive language": "hate",
  "Privacy violation or doxxing": "privacy_violation",
  Impersonation: "impersonation",
  "Other safety concern": "other",
};
const preferencesSchema = z.object({
  interests: z.array(z.enum(INTERESTS)).max(5),
  language: z.enum(LANGUAGES).or(z.literal("Any")),
  mediaMode: z.enum(["text", "video"]),
});

function failAsBadRequest(error: unknown): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message:
      error instanceof Error
        ? error.message
        : "The request could not be completed.",
  });
}
function failAsTooManyRequests(error: unknown): never {
  throw new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message:
      error instanceof Error
        ? error.message
        : "Too many requests. Wait a little before trying again.",
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    config: publicProcedure.query(async () => {
      return {
        googleClientId: config.googleClientId || "",
      };
    }),
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return {
        id: ctx.user.id,
        userId: getInternalUserId(ctx.user),
        name: ctx.user.name,
        email: ctx.user.email,
        role: ctx.user.role,
        lastSignedIn: ctx.user.lastSignedIn,
        createdAt: ctx.user.createdAt,
      };
    }),
    googleLogin: publicProcedure
      .input(
        z.object({
          idToken: z.string().min(1, "Google ID token is required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const clientIp = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
        try {
          assertGoogleAuthRateLimit(clientIp);
        } catch (rateErr) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: rateErr instanceof Error ? rateErr.message : "Too many requests",
          });
        }

        let verified;
        try {
          verified = await verifyGoogleIdToken(input.idToken);
        } catch (err) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err instanceof Error ? err.message : "Google authentication failed",
          });
        }

        const existing = await getUserByOpenId(verified.sub);
        const isNewUser = !existing;
        const now = new Date();

        const userValues: InsertUser = {
          openId: verified.sub,
          name: verified.name,
          email: verified.email,
          loginMethod: "google",
          role: existing?.role || "user",
          lastSignedIn: now,
          createdAt: existing?.createdAt || now,
        };

        try {
          await upsertUser(userValues);
        } catch (dbErr) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to persist user profile in database",
          });
        }

        const updatedUser = await getUserByOpenId(verified.sub);
        if (!updatedUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to load user profile after registration",
          });
        }

        const internalUserId = getInternalUserId(updatedUser);

        // Synchronize to Google Sheets administrative spreadsheet
        let sheetsSyncStatus: { synced: boolean; action: string } = {
          synced: false,
          action: "queued",
        };
        try {
          const syncRes = await syncUserRegistration({
            userId: internalUserId,
            customerName: verified.name,
            registrationDate: updatedUser.createdAt || now,
            lastLogin: now,
            status: "Active",
          });
          sheetsSyncStatus = { synced: syncRes.synced, action: syncRes.action };
        } catch (sheetsErr) {
          console.warn("[Google Sheets Sync] Sync attempt non-fatal warning:", sheetsErr);
        }

        // Generate session token and set HTTP-only cookie
        const sessionToken = createAuthSessionToken(updatedUser);
        setAuthCookie(ctx.res, ctx.req, sessionToken);

        return {
          success: true,
          isNewUser,
          sessionToken,
          sheetsSync: sheetsSyncStatus,
          user: {
            id: updatedUser.id,
            userId: internalUserId,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            lastSignedIn: updatedUser.lastSignedIn,
            createdAt: updatedUser.createdAt,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearAuthCookie(ctx.res, ctx.req);
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user;
      const internalUserId = getInternalUserId(user);

      // 1. Redact and mark as deleted in MySQL
      await deleteUserByOpenId(user.openId);

      // 2. Propagate deletion to Google Sheet
      try {
        await syncUserDeletion(internalUserId);
      } catch (sheetsErr) {
        console.warn("[Google Sheets Deletion Sync] Non-fatal deletion warning:", sheetsErr);
      }

      // 3. Clear cookie
      clearAuthCookie(ctx.res, ctx.req);

      return {
        success: true,
        message: "Account and registration data successfully deleted and synchronized.",
      };
    }),
  }),
  chat: router({
    stats: publicProcedure.query(() => getOnlineStats()),
    session: router({
      create: publicProcedure
        .input(
          z.object({
            ageConfirmed: z.literal(true),
            termsAccepted: z.literal(true),
            privacyAccepted: z.literal(true),
            preferences: preferencesSchema,
            isSynthetic: z.boolean().optional(),
          })
        )
        .mutation(({ ctx, input }) => {
          try {
            return createAnonymousSession(
              input,
              ctx.req.ip || ctx.req.socket.remoteAddress || "unknown"
            );
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.startsWith("Too many requests")
            )
              return failAsTooManyRequests(error);
            return failAsBadRequest(error);
          }
        }),
    }),
    state: anonymousChatProcedure.query(({ ctx }) => getState(ctx.chatSession)),
    search: anonymousChatProcedure
      .input(z.object({ preferences: preferencesSchema.optional() }).optional())
      .mutation(async ({ ctx, input }) => {
        try {
          await assertAgeAssuranceEligible(ctx.chatSession.id);
          assertSearchLimit(ctx.chatSession);
          return startSearching(ctx.chatSession, input?.preferences);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.startsWith("Too many requests")
          )
            return failAsTooManyRequests(error);
          return failAsBadRequest(error);
        }
      }),
    send: anonymousChatProcedure
      .input(
        z
          .object({
            text: z.string().max(500).optional().default(""),
            mediaId: z.string().optional(),
          })
          .refine(data => data.text.trim().length > 0 || Boolean(data.mediaId), {
            message: "A message must contain text or an image attachment.",
          })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await sendChatMessage(ctx.chatSession, input.text, input.mediaId);
        } catch (error) {
          return failAsBadRequest(error);
        }
      }),
    reportMedia: anonymousChatProcedure
      .input(
        z.object({
          mediaId: z.string().min(1),
          reason: z.string().max(500).default("Reported inappropriate image"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const success = await reportMedia(input.mediaId, ctx.chatSession.id, input.reason);
          return { success };
        } catch (error) {
          return failAsBadRequest(error);
        }
      }),
    next: anonymousChatProcedure.mutation(async ({ ctx }) => {
      try {
        await assertAgeAssuranceEligible(ctx.chatSession.id);
        assertSearchLimit(ctx.chatSession);
        return nextChat(ctx.chatSession);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Too many requests")
        )
          return failAsTooManyRequests(error);
        return failAsBadRequest(error);
      }
    }),
    end: anonymousChatProcedure.mutation(({ ctx }) => endChat(ctx.chatSession)),
    block: anonymousChatProcedure.mutation(({ ctx }) =>
      blockAndLeave(ctx.chatSession)
    ),
    report: anonymousChatProcedure
      .input(
        z.object({
          reason: z.enum(REPORT_REASONS),
          description: z.string().trim().max(1000).optional().default(""),
          selectedExcerpt: z.string().max(1000).optional(),
          leaveAfter: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const partnerId = activePartnerId(ctx.chatSession);
        if (!partnerId)
          throw new TRPCError({
            code: "CONFLICT",
            message: "There is no active conversation to report.",
          });
        try {
          assertReportLimit(ctx.chatSession);
        } catch (error) {
          return failAsTooManyRequests(error);
        }
        try {
          const reportId = randomUUID();
          const digest = (value: string) =>
            createHash("sha256").update(value).digest("hex");
          await insertSafetyReport({
            id: reportId,
            category: reasonMap[input.reason],
            reporterSessionHash: digest(ctx.chatSession.id),
            reportedSessionHash: digest(partnerId),
            description: input.description || null,
            selectedExcerpt: input.selectedExcerpt?.trim()
              ? input.selectedExcerpt.trim().slice(0, 1000)
              : null,
            status: "open",
          });
          if (input.leaveAfter) endChat(ctx.chatSession);
          return { reportId, left: input.leaveAfter };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message:
              error instanceof Error
                ? error.message
                : "The report could not be submitted.",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
