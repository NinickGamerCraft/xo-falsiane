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
          background: "linear-gradient(145deg, #100818, #2a0d45)",
          borderRadius: 12,
          border: "4px solid #ffe79a",
          color: "#fff0b0",
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: -2,
          textShadow: "3px 3px 0 #35123d",
        }}
      >
        SN
      </div>
    ),
    size,
  );
}
