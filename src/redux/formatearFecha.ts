export const formatearFecha = (fecha: string) => {
  const partes = new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date(fecha));

  const weekday = partes.find(p => p.type === "weekday")?.value;
  const day = partes.find(p => p.type === "day")?.value;
  const month = partes.find(p => p.type === "month")?.value;
  const year = partes.find(p => p.type === "year")?.value;

  return `${weekday?.charAt(0).toUpperCase()}${weekday?.slice(1)} ${day} ${month}, ${year}`;
};

export const formatearHora = (fecha: string) => {
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(fecha));
};

export const ordenarHora = (hora: string) => {
    const [horas, minutos] = hora.split(":");
    const horaNumero = Number(horas);
    const periodo = horaNumero >= 12 ? "PM" : "AM";
    const hora12 = horaNumero % 12 || 12;
    return `${hora12}:${minutos} ${periodo}`;
};