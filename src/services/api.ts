const API_URL = "http://localhost:3001/api";

import type { LoginResponse } from "../types/usuario";

// ==========================================
// ASISTENCIAS DEL ESTUDIANTE
// ==========================================

export async function getAsistenciasporCarnet(
    id_estudiante: string
) {
    const response = await fetch(
        `${API_URL}/asistencias/estudiante/${id_estudiante}`
    );

    if (!response.ok) {
        throw new Error(
            "Error al obtener las asistencias"
        );
    }

    return response.json();
}


// ==========================================
// RESUMEN DEL ESTUDIANTE
// ==========================================

export async function getEstudianteResumen(
    id_estudiante: string
) {
    const response = await fetch(
        `${API_URL}/asistencias/estudiante/${id_estudiante}/resumen`
    );

    if (!response.ok) {
        throw new Error(
            "Error al obtener el resumen"
        );
    }

    return response.json();
}


// ==========================================
// MATERIAS DEL ESTUDIANTE
// ==========================================

export async function getMateriasResumen(
    id_estudiante: string
) {
    const response = await fetch(
        `${API_URL}/asistencias/estudiante/${id_estudiante}/materias`
    );

    if (!response.ok) {
        throw new Error(
            "Error al obtener las materias"
        );
    }

    return response.json();
}


// ==========================================
// LOGIN
// ==========================================

export async function postLogin(
    texto_correo: string,
    contrasena: string
): Promise<LoginResponse> {

    const response = await fetch(
        `${API_URL}/auth/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                usuario: texto_correo,
                contraseña: contrasena
            })
        }
    );

    const data = await response.json();

    if (response.status === 401) {
        return data;
    }

    if (!response.ok) {
        throw new Error(
            data.error || "Error del servidor"
        );
    }

    return data;
}


// ==========================================
// DASHBOARD DEL DOCENTE
// ==========================================

export async function getDashboardDocente(
    id_profesor: string
) {

    const response = await fetch(
        `${API_URL}/docente/dashboard/${id_profesor}`
    );

    if (!response.ok) {

        const data = await response
            .json()
            .catch(() => null);

        throw new Error(
            data?.error ||
            "Error al obtener el dashboard del docente"
        );
    }

    return response.json();
}


// ==========================================
// ASISTENCIAS DE UNA SESIÓN
// ==========================================

export async function getAsistenciasPorSesion(
    id_sesion: number
) {

    const response = await fetch(
        `${API_URL}/asistencias/sesion/${id_sesion}`
    );

    if (!response.ok) {

        const data = await response
            .json()
            .catch(() => null);

        throw new Error(
            data?.error ||
            "Error al obtener las asistencias de la sesión"
        );
    }

    return response.json();
}