// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Publishable, browser-safe backend config. These are the same values the
// browser bundle ships anyway (protected by row-level security) — they are NOT
// secrets. They exist here as a build-time fallback so the published app still
// reaches the backend if the build environment has no .env file; otherwise the
// client throws "Missing Supabase environment variable(s)" and the whole app
// renders the error page. Real secrets stay in the managed secret store.
const FALLBACK_SUPABASE_URL = "https://qdxkprnvwlltzlhwzwoc.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeGtwcm52d2xsdHpsaHd6d29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjkwMTgsImV4cCI6MjEwMDI0NTAxOH0.IzaLc8rmzvl9HpgZ26G3EdqcMGni1uKaIXGNvw_xIC8";
const FALLBACK_SUPABASE_PROJECT_ID = "qdxkprnvwlltzlhwzwoc";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        process.env.VITE_SUPABASE_PROJECT_ID || FALLBACK_SUPABASE_PROJECT_ID,
      ),
    },
  },
});
