const API_URL = "http://localhost:3001/api";

import type { LoginResponse } from "../types/usuario";

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

export async function postLogin(
  texto_correo: string,
  contrasena: string
): Promise<LoginResponse> {

  const response = await fetch( `${API_URL}/asistencias/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      texto_correo,
      contrasena
    })
  });
  const data = await response.json();

  // Credenciales incorrectas
  if (response.status === 401) {
    return data;
  }

  // Otros errores del servidor
  if (!response.ok) {
    throw new Error("Error del servidor");
  }

  return data;
}
