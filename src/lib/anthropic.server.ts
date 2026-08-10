// Server-only Anthropic client, used for AI-powered schedule file import.
// SECURITY: never import this at the top level of a route or *.functions.ts
// file — both ship to the client bundle. Load it inside a server handler:
// const { anthropicClient } = await import("@/lib/anthropic.server");
// (mirrors the supabaseAdmin pattern in integrations/supabase/client.server.ts)
import Anthropic from "@anthropic-ai/sdk";

function createAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "AI import isn't configured — add ANTHROPIC_API_KEY to the server environment.",
    );
  }
  // Anthropic() also reads ANTHROPIC_API_KEY itself; the check above exists
  // only to throw an app-specific message instead of the SDK's generic one.
  return new Anthropic();
}

let _anthropic: Anthropic | undefined;

export const anthropicClient = new Proxy({} as Anthropic, {
  get(_, prop, receiver) {
    if (!_anthropic) _anthropic = createAnthropicClient();
    return Reflect.get(_anthropic, prop, receiver);
  },
});
