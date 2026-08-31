export interface Usuario {

    id_usuario: string;

    nombres: string;

    apellidos: string;

    correo_institucional: string;

    departamento_facultad: string | null;

    rol: string | null;

}

export interface LoginResponse {

    success?: boolean;

    usuario?: Usuario | null;

    mensaje?: string;

    error?: string;

}