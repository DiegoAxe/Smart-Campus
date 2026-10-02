const API_URL = "https://smart-campus-26.up.railway.app/api";

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
// CREAR SESIÓN
// ==========================================

export interface CrearSesionRequest {
    id_profesor: string;
    id_grupo: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
}

export interface CrearSesionResponse {
    success: boolean;
    mensaje: string;
    id_sesion: number;
    sesion: {
        id_sesion: number;
        id_grupo: string;
        numero_grupo: string;
        nombre_materia: string;
        aula: string;
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
        estado: string;
    };
}

export async function crearSesion(
    payload: CrearSesionRequest
): Promise<CrearSesionResponse> {

    return requestJson<CrearSesionResponse>(
        `${API_URL}/docente/sesiones`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );
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

    return requestJson<LoginResponse>(`${API_URL}/asistencias/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      texto_correo,
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
// CANCELAR SESIÓN
// ==========================================

export async function cancelarSesion(
    id_sesion: number
): Promise<{ success: boolean; mensaje: string }> {

    return requestJson<{ success: boolean; mensaje: string }>(
        `${API_URL}/docente/cancelar/${id_sesion}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}

// ==========================================
// FINALIZAR SESIÓN
// ==========================================

export async function finalizarSesion(
    id_sesion: number
): Promise<{ success: boolean; mensaje: string; ausencias_registradas: number }> {

    return requestJson<{ success: boolean; mensaje: string;  ausencias_registradas: number }>(
        `${API_URL}/docente/finalizar/${id_sesion}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
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

// ==========================================
// ASISTENTE IA
// ==========================================

export type PreguntarAsistenteResponse = {
    success: boolean;
    respuesta: string;
};

export async function preguntarAsistente(
    pregunta: string
): Promise<PreguntarAsistenteResponse> {

    const token = sessionStorage.getItem("token");

    if (!token) {
        throw new Error("No hay una sesión válida.");
    }

    return requestJson<PreguntarAsistenteResponse>(
        `${API_URL}/asistente`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                pregunta
            })
        }
    );
}