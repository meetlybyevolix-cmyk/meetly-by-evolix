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
import { insertSafetyReport } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
  | "harassment"
  | "sexual_content"
  | "suspected_minor"
  | "threats"
  | "spam"
  | "hate"
  | "impersonation"
  | "other"
> = {
  "Harassment or bullying": "harassment",
  "Sexual or explicit content": "sexual_content",
  "Suspected minor": "suspected_minor",
  "Threats or violent behavior": "threats",
  "Spam or scams": "spam",
  "Hate or abusive language": "hate",
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
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
      .mutation(({ ctx, input }) => {
        try {
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
      .input(z.object({ text: z.string().trim().min(1).max(500) }))
      .mutation(({ ctx, input }) => {
        try {
          return sendChatMessage(ctx.chatSession, input.text);
        } catch (error) {
          return failAsBadRequest(error);
        }
      }),
    next: anonymousChatProcedure.mutation(({ ctx }) => {
      try {
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
