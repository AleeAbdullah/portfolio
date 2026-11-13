"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Feedback sits on the button itself; the button keeps its width in both states.
export default function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const flash = (next: "copied" | "failed") => { setState(next); window.setTimeout(() => setState("idle"), 1800); };
  return (
    <button
      type="button"
      className="hm-btn hm-copy"
      onClick={async (event) => {
        const button = event.currentTarget; // read before awaiting; React clears currentTarget afterwards
        try { await navigator.clipboard.writeText(email); flash("copied"); }
        catch {
          // Select the address beside the button, so copying by hand is one keystroke away.
          const link = button.closest(".hm-mail-row")?.querySelector(".hm-mail");
          if (link) { const range = document.createRange(); range.selectNodeContents(link); getSelection()?.removeAllRanges(); getSelection()?.addRange(range); }
          flash("failed");
        }
      }}
    >
      {state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Selected" : "Copy"}</span>
    </button>
  );
}
