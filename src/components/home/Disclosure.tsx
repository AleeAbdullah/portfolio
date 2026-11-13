"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

// A row whose whole surface toggles its details in place (field notes, projects).
export default function Disclosure({ lead, title, sub, tag, defaultOpen = false, id, level = 3, children }: {
  lead?: ReactNode; title: ReactNode; sub?: ReactNode; tag?: ReactNode; defaultOpen?: boolean; id?: string; level?: 2 | 3; children: ReactNode;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const [open, setOpen] = useState(defaultOpen);
  const panel = useId();
  // A link to #id (from a blog post, say) opens the row it lands on.
  useEffect(() => {
    if (!id) return;
    const openIfTarget = () => { if (decodeURIComponent(location.hash.slice(1)) === id) setOpen(true); };
    openIfTarget();
    addEventListener("hashchange", openIfTarget);
    return () => removeEventListener("hashchange", openIfTarget);
  }, [id]);
  return (
    <div className="hm-row" data-open={open || undefined} id={id}>
      <Heading className="hm-row-h"><button type="button" className="hm-row-btn" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
        <span className="hm-row-lead">{lead}</span>
        <span className="hm-row-title">{title}{sub && <span className="hm-row-sub">{sub}</span>}</span>
        {tag ?? <span />}
        <Plus className="hm-plus" aria-hidden />
      </button></Heading>
      <div className="hm-row-panel" id={panel} role="region">
        <div className="hm-row-inner">
          <div className="hm-row-content" inert={!open}>{children}</div>
        </div>
      </div>
    </div>
  );
}
