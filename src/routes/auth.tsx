import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Next Specials Timer" },
      { name: "description", content: "Sign in to your classroom timer and behavior scoring dashboard." },
      { property: "og:title", content: "Sign in — Next Specials Timer" },
      { property: "og:description", content: "Sign in to your classroom timer and behavior scoring dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        // If email confirmation is disabled, user is signed in immediately.
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          navigate({ to: "/", replace: true });
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl p-1.5 bg-gold">
        <div className="rounded-3xl border-2 border-navy bg-white p-8">
          <div className="text-center">
            <div className="text-xs font-bold tracking-[0.25em] text-navy/60">
              NEXT SPECIALS TIMER
            </div>
            <h1 className="mt-2 text-2xl font-black text-navy">
              {mode === "signin" ? "Sign in" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-navy/60">
              {mode === "signin"
                ? "Access your schedule and behavior reports."
                : "Save your schedule and scores across every classroom device."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-navy outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-2 border-navy/15 bg-white px-3 py-2 text-sm text-navy focus:border-navy outline-none"
              />
            </div>

            {error && (
              <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-lg border-2 border-navy/15 bg-gold-soft px-3 py-2 text-xs text-navy">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-navy text-white py-2.5 text-sm font-bold hover:bg-navy/90 disabled:opacity-60"
            >
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="mt-4 w-full text-xs font-bold text-navy/70 hover:text-navy underline"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
