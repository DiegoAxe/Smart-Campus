const API_URL = "http://localhost:3001/api";

export async function getAsistenciasporCarnet(
  id_estudiante: string
) {
  const response = await fetch(
    `${API_URL}/asistencias/estudiante/${id_estudiante}`
  );

  if (!response.ok) {
    throw new Error("Error al obtener las asistencias");
  }

  return response.json();
}

export async function getEstudianteResumen(
  id_estudiante: string
) {
  const response = await fetch(
    `${API_URL}/asistencias/estudiante/${id_estudiante}/resumen`
  );

  if (!response.ok) {
    throw new Error("Error al obtener las asistencias");
  }

  return response.json();
}

export async function getMateriasResumen(
  id_estudiante: string
) {
  const response = await fetch(
    `${API_URL}/asistencias/estudiante/${id_estudiante}/materias`
  );

  if (!response.ok) {
    throw new Error("Error al obtener las asistencias");
  }

  return response.json();
}