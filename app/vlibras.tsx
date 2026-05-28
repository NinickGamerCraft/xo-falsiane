"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function VLibras() {
  const [carregado, setCarregado] = useState(false);

  function iniciarVLibras() {
    if ((window as any).VLibras && !(window as any).vlibrasIniciado) {
      new (window as any).VLibras.Widget("https://vlibras.gov.br/app");
      (window as any).vlibrasIniciado = true;
    }
  }

  useEffect(() => {
    (window as any).abrirVLibras = () => {
      iniciarVLibras();

      setTimeout(() => {
        const botao = document.querySelector("[vw-access-button]") as HTMLElement | null;

        if (botao) {
          botao.click();
        } else {
          alert("VLibras ainda não carregou. Recarregue a página e tente novamente.");
        }
      }, 500);
    };
  }, []);

  return (
    <>
      <div {...{ vw: "true" }} className="enabled vlibras-container">
        <div {...{ "vw-access-button": "true" }} className="active"></div>
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>

      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => {
          setCarregado(true);
          iniciarVLibras();
        }}
      />
    </>
  );
}