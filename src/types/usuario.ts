export interface Usuario {
    id: string;
    nombre: string,
    apellidos: string,
    correo_institucional: string,
    departamento_facultad: string,
    rol: string | null,
}

export interface LoginResponse {
  success: boolean;
  usuario?: Usuario | null;
}