import { z } from "zod";
import { publicProcedure, router } from "./trpc";
import { config } from "../config";
import { getOnlineStats } from "../chat/service";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z
        .object({
          timestamp: z
            .number()
            .min(0, "timestamp cannot be negative")
            .optional(),
        })
        .optional()
    )
    .query(() => ({
      ok: true,
      timestamp: Date.now(),
      service: "Meetly",
    })),

  iceServers: publicProcedure.query(() => {
    return { iceServers: config.iceServers };
  }),

  stats: publicProcedure.query(() => {
    return getOnlineStats();
  }),
});
