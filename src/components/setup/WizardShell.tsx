import type { ReactNode } from "react";

interface WizardShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  backLabel?: string;
}

export function WizardShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  backLabel = "Back",
}: WizardShellProps) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl p-1.5 bg-gold">
          <div className="rounded-3xl p-1 bg-background">
            <div className="rounded-3xl border-2 border-navy bg-white p-6 md:p-10">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold tracking-[0.25em] text-navy/60">
                  SETUP · STEP {step} OF {totalSteps}
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-6 rounded-full ${
                        i < step ? "bg-gold" : "bg-navy/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-navy">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm text-navy/60 max-w-xl">{subtitle}</p>
              ) : null}

              <div className="mt-6 border-t-2 border-gold" />

              <div className="mt-6">{children}</div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={!onBack}
                  className="rounded-full px-5 py-2 text-sm font-bold text-navy/70 hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← {backLabel}
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled || !onNext}
                  className="rounded-full px-6 py-2.5 text-sm font-bold bg-navy text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {nextLabel} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
