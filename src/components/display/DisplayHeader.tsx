import { BarChart3, LogOut, Maximize2, Minimize2, Settings } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DisplayHeaderProps {
  subjectTitle: string;
  teacherName: string;
  dateLabel: string;
  wallMode: boolean;
  onToggleWallMode: () => void;
}

export function DisplayHeader({
  subjectTitle,
  teacherName,
  dateLabel,
  wallMode,
  onToggleWallMode,
}: DisplayHeaderProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="text-navy">
        <div
          className="text-xl leading-tight tracking-tight md:text-2xl"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
        >
          Next Specials Class
          <span className="align-super text-xs">®</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          <span className="h-px w-10 bg-gold" />
          <svg width="14" height="14" viewBox="-16 -16 32 32" className="fill-navy">
            <path d="M0,4 C-6,-4 -14,-4 -14,4 C-14,10 -6,14 0,20 C6,14 14,10 14,4 C14,-4 6,-4 0,4 Z" />
          </svg>
          <span className="h-px w-10 bg-gold" />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 sm:text-right">
        <div className="min-w-0">
          <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-black uppercase leading-none tracking-tight text-navy">
            {subjectTitle}
          </h1>
          <div className="mt-1 text-[clamp(1.05rem,1.3vw,1.25rem)] font-bold text-navy/70">
            {teacherName}
          </div>
          <div className="mt-0.5 text-sm text-navy/50 md:text-sm">{dateLabel}</div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleWallMode}
            aria-label={wallMode ? "Exit wall mode" : "Wall mode (fullscreen)"}
            title={wallMode ? "Exit wall mode" : "Wall mode (fullscreen)"}
            className="hidden shrink-0 place-items-center rounded-full text-navy/60 transition-colors hover:bg-muted hover:text-navy md:grid md:h-9 md:w-9"
          >
            {wallMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          {/* Admin controls stay out of wall mode so the board reads clean. */}
          {!wallMode ? (
            <>
              <Link
                to="/reports"
                search={{ range: "week" as const }}
                aria-label="Behavior reports"
                title="Behavior reports"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-navy/60 transition-colors hover:bg-muted hover:text-navy md:h-9 md:w-9"
              >
                <BarChart3 className="h-5 w-5" />
              </Link>
              <Link
                to="/settings"
                aria-label="Settings"
                title="Settings"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-navy/60 transition-colors hover:bg-muted hover:text-navy md:h-9 md:w-9"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-navy/60 transition-colors hover:bg-muted hover:text-navy md:h-9 md:w-9"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
