// functions/turnstile.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
if (!TURNSTILE_SECRET) {
  throw new Error("Missing TURNSTILE_SECRET_KEY env var");
}

type CfVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  [k: string]: any;
};

export const verify = action({
  args: { token: v.string() },
  handler: async (_ctx, { token }) => {
    try {
      const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
      const body = new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
      });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        return { success: false, error: `Turnstile verify HTTP ${res.status}` };
      }

      const data = (await res.json()) as CfVerifyResponse;
      return {
        success: Boolean(data.success),
        challenge_ts: data.challenge_ts,
        hostname: data.hostname,
        errorCodes: data["error-codes"] ?? undefined,
      };
    } catch (e) {
      return { success: false, error: (e as Error).message ?? "Unknown error" };
    }
  },
});