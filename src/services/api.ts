const API_URL = "http://localhost:3001/api";

import type { LoginResponse } from "../types/usuario";
import type { EstudianteAsistencia } from "../types/estudianteAsistencias";
import type { EstudianteResumen } from "../types/estudianteResumen";
import type { MateriasResumen } from "../types/materiasResumen";
import type {
    AsistenciaSesion,
    DocenteDashboard,
    RegistrarAsistenciaRequest,
    RegistrarAsistenciaResponse
} from "../types/docenteDashboard";

async function requestJson<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.mensaje ||
            "Error al comunicarse con la API"
        );
    }

    return data as T;
}

// ==========================================
// ASISTENCIAS DEL ESTUDIANTE
// ==========================================

export async function getAsistenciasporCarnet(
    id_estudiante: string
): Promise<EstudianteAsistencia[]> {
    return requestJson<EstudianteAsistencia[]>(
        `${API_URL}/asistencias/estudiante/${encodeURIComponent(id_estudiante)}`
    );
}


// ==========================================
// RESUMEN DEL ESTUDIANTE
// ==========================================

export async function getEstudianteResumen(
    id_estudiante: string
): Promise<EstudianteResumen> {
    const resumen = await requestJson<EstudianteResumen>(
        `${API_URL}/asistencias/estudiante/${encodeURIComponent(id_estudiante)}/resumen`
    );

    return {
        asistencias_totales: Number(resumen.asistencias_totales),
        presentes: Number(resumen.presentes),
        tardanzas: Number(resumen.tardanzas),
        ausentes: Number(resumen.ausentes),
        permisos: Number(resumen.permisos)
    };
}


// ==========================================
// MATERIAS DEL ESTUDIANTE
// ==========================================

export async function getMateriasResumen(
    id_estudiante: string
): Promise<MateriasResumen[]> {
    const materias = await requestJson<MateriasResumen[]>(
        `${API_URL}/asistencias/estudiante/${encodeURIComponent(id_estudiante)}/materias`
    );

    return materias.map((materia) => ({
        ...materia,
        total_sesiones: Number(materia.total_sesiones),
        cantidad_inasistencias: Number(materia.cantidad_inasistencias)
    }));
}


// ==========================================
// LOGIN
// ==========================================

export async function postLogin(
    texto_correo: string,
    contrasena: string
): Promise<LoginResponse> {

    return requestJson<LoginResponse>(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usuario: texto_correo,
      identificador: texto_correo,
      texto_correo,
      contraseña: contrasena,
      contrasena
    })
    });
}


// ==========================================
// DASHBOARD DEL DOCENTE
// ==========================================

export async function getDashboardDocente(
    id_profesor: string
): Promise<DocenteDashboard> {
    const dashboard = await requestJson<DocenteDashboard>(
        `${API_URL}/docente/dashboard/${encodeURIComponent(id_profesor)}`
    );

    return {
        ...dashboard,
        resumen: Object.fromEntries(
            Object.entries(dashboard.resumen).map(([key, value]) => [key, Number(value)])
        ) as DocenteDashboard["resumen"],
        estadisticas: Object.fromEntries(
            Object.entries(dashboard.estadisticas).map(([key, value]) => [key, Number(value)])
        ) as DocenteDashboard["estadisticas"],
        grupos: dashboard.grupos.map((grupo) => ({
            ...grupo,
            estudiantes: Number(grupo.estudiantes),
            sesiones: grupo.sesiones === undefined ? undefined : Number(grupo.sesiones)
        })),
        sesiones: dashboard.sesiones.map((sesion) => ({
            ...sesion,
            id_sesion: Number(sesion.id_sesion),
            total_asistencias: Number(sesion.total_asistencias),
            presentes: Number(sesion.presentes),
            ausentes: Number(sesion.ausentes),
            tardanzas: Number(sesion.tardanzas),
            permisos: Number(sesion.permisos)
        }))
    };
}


// ==========================================
// ASISTENCIAS DE UNA SESIÓN
// ==========================================

export async function getAsistenciasPorSesion(
    id_sesion: number
): Promise<AsistenciaSesion[]> {
    return requestJson<AsistenciaSesion[]>(
        `${API_URL}/asistencias/sesion/${id_sesion}`
    );
}

export async function registrarAsistencia(
    payload: RegistrarAsistenciaRequest
): Promise<RegistrarAsistenciaResponse> {
    return requestJson<RegistrarAsistenciaResponse>(
        `${API_URL}/asistencias`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );
}