import { ImageResponse } from "next/og";
import { SITE_URL } from "@/src/lib/site";

export const ogSize = { width: 1200, height: 630 };

// Social preview card in the site's dark palette: a kicker, a headline and the address.
export function ogCard({ kicker, title, footer }: { kicker: string; title: string; footer: string }) {
  const size = title.length > 70 ? 56 : title.length > 40 ? 68 : 84;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(90% 100% at 80% 0%, rgba(224,118,58,0.28), transparent 62%), linear-gradient(135deg, #1d1a16, #0e0d0c)",
          color: "#ece6dc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#e0763a" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#e0763a" }} />
          {kicker}
        </div>
        <div style={{ display: "flex", fontSize: size, lineHeight: 1.12, letterSpacing: -1, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#9a9286" }}>
          <span>{footer}</span>
          <span>{new URL(SITE_URL).host}</span>
        </div>
      </div>
    ),
    ogSize,
  );
}
