export interface DocenteGrupo {
    id_grupo: string;
    numero_grupo: string;
    ciclo_academico: string;
    aula: string;
    id_materia: string;
    nombre_materia: string;
    estudiantes: number;
    sesiones?: number;
}

export interface DocenteSesion {
    id_sesion: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    id_grupo: string;
    numero_grupo: string;
    aula: string;
    nombre_materia: string;
    total_asistencias: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    permisos: number;
}

export interface DocenteDashboard {
    profesor: {
        id_profesor: string;
        nombres: string;
        apellidos: string;
        correo_institucional: string;
        departamento_facultad: string | null;
    };
    resumen: {
        grupos: number;
        materias: number;
        estudiantes: number;
        sesiones: number;
    };
    estadisticas: {
        total: number;
        presentes: number;
        ausentes: number;
        tardanzas: number;
        permisos: number;
    };
    grupos: DocenteGrupo[];
    sesiones: DocenteSesion[];
}

export interface AsistenciaSesion {
    id_asistencia: number;
    id_estudiante: string;
    nombres: string;
    apellidos: string;
    estado_asistencia: string;
    hora_marca: string | null;
    metodo_registro: string | null;
}

export interface RegistrarAsistenciaRequest {
    id_sesion: number;
    id_estudiante: string;
    estado_asistencia?: "Presente" | "Ausente" | "Tardanza" | "Permiso";
    metodo_registro?: string;
}

export interface RegistrarAsistenciaResponse {
    mensaje: string;
    datos: {
        id_sesion: number;
        id_estudiante: string;
        estado_asistencia: string;
        hora_marca: string;
    };
}
