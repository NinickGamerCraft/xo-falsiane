import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #050914, #0b2b72)",
          borderRadius: 14,
          border: "4px solid #2f80ff",
          color: "white",
          fontSize: 38,
          fontWeight: 900,
          boxShadow: "inset 0 0 18px rgba(47,128,255,.45)",
        }}
      >
        ✓
      </div>
    ),
    size,
  );
}
