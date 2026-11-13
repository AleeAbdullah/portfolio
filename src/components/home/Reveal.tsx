"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

// A labelled toggle that opens details in place, for cards whose surface holds other content (the flagship).
export default function Reveal({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div className="hm-reveal" data-open={open || undefined}>
      <button type="button" className="hm-reveal-btn" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
        <span>{label}</span>
        <Plus className="hm-plus" aria-hidden />
      </button>
      <div className="hm-row-panel" id={panel} role="region">
        <div className="hm-row-inner">
          <div className="hm-reveal-content" inert={!open}>{children}</div>
        </div>
      </div>
    </div>
  );
}
