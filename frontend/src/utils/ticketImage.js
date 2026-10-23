import { formatDate, parseDateKey } from "./dates.js";

// Draws the ticket on a canvas and downloads it as a PNG ("Save as image").
export function downloadTicketImage(appointment) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 420;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#2442c5";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 7]);
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.fillStyle = "#52617a";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText("RTU-CCSAS · Control number", 360, 56);

  ctx.fillStyle = "#102b57";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText(appointment.controlNumber, 360, 108);

  const lines = [
    `${appointment.officeCode} · Queue ${String(appointment.queue).padStart(3, "0")} · ${appointment.service}`,
    `${appointment.student.name} · ${appointment.student.program}`,
    `${formatDate(parseDateKey(appointment.date))} · ${appointment.time}`,
  ];

  if (appointment.receiverName) {
    lines.push(`Receiver: ${appointment.receiverName} (representative)`);
  }

  ctx.font = "18px system-ui, sans-serif";
  lines.forEach((line, index) => ctx.fillText(line, 360, 170 + index * 32));

  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.fillText(`Fee: ${appointment.feeText}`, 360, 340);
  ctx.font = "15px system-ui, sans-serif";
  ctx.fillStyle = "#52617a";
  ctx.fillText("Bring your valid ID and show this ticket at the office.", 360, 372);

  const link = document.createElement("a");
  link.download = `ticket-${appointment.controlNumber}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
