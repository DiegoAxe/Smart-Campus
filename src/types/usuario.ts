export interface Usuario {
    id?: string;
    id_usuario?: string;
    id_profesor?: string;
    nombre?: string;
    nombres?: string;
    apellidos: string;
    correo_institucional: string;
    departamento_facultad: string | null;
    rol: string | null;
}

export interface LoginResponse {
    success?: boolean;
    token?: string;
    usuario?: Usuario | null;
    mensaje?: string;
    error?: string;
}