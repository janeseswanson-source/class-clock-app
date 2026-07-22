import { Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DisplayHeaderProps {
  subjectTitle: string;
  dateLabel: string;
}

export function DisplayHeader({ subjectTitle, dateLabel }: DisplayHeaderProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div className="text-navy">
          <div
            className="text-2xl leading-tight tracking-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
          >
            Next Specials Class
            <span className="align-super text-xs">®</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="h-px w-10 bg-gold" />
            <svg width="14" height="14" viewBox="-16 -16 32 32" className="fill-navy">
              <path d="M0,4 C-6,-4 -14,-4 -14,4 C-14,10 -6,14 0,20 C6,14 14,10 14,4 C14,-4 6,-4 0,4 Z" />
            </svg>
            <span className="h-px w-10 bg-gold" />
          </div>
        </div>
      </div>
      <div className="text-right flex items-start gap-3">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-navy uppercase">
            {subjectTitle}
          </h1>
          <div className="text-sm text-navy/60 mt-1">{dateLabel}</div>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="p-2 rounded-full text-navy/60 hover:text-navy hover:bg-muted transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
