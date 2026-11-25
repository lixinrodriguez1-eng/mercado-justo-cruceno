// =============================================================
// QR de pago REFERENCIAL (solo servidor).
// Genera un código QR en SVG con los datos del pago directo al productor.
// Es una demostración: no es un QR bancario. En producción cada emprendedor
// subiría el QR interoperable de su banco o billetera móvil y el dinero
// llegaría directo a su cuenta, sin pasar por la plataforma.
// Se entrega como imagen data: (permitida por la CSP: img-src data:),
// sin JavaScript en el navegador.
// =============================================================
import QRCode from "qrcode";

export async function qrPagoReferencial(datos: {
  emprendimiento: string;
  pedido: string;
  monto: number;
  comision: number;
}): Promise<string> {
  const texto = [
    "PAGO REFERENCIAL - MERCADO JUSTO CRUCENO (demostracion, no es un QR bancario)",
    `Productor: ${datos.emprendimiento}`,
    `Pedido: #${datos.pedido}`,
    `Monto: Bs ${datos.monto.toFixed(2)}`,
    `Comision de la plataforma: Bs ${datos.comision.toFixed(2)}`,
  ].join("\n");
  const svg = await QRCode.toString(texto, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#2b1a12", light: "#ffffff" },
  });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
