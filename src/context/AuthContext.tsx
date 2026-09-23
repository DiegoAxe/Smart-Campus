import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

import type { Usuario } from "../types/usuario";

type AuthContextType = {
    usuario: Usuario | null;
    token: string | null;
    iniciarSesion: (usuario: Usuario, token?: string) => void;
    cerrarSesion: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const usuarioGuardado = sessionStorage.getItem("usuario");
        const tokenGuardado = sessionStorage.getItem("token");

        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }

        if (tokenGuardado) {
            setToken(tokenGuardado);
        }

        setCargando(false);
    }, []);

    const iniciarSesion = (usuario: Usuario, nuevoToken?: string) => {
        const usuarioNormalizado: Usuario = {
            ...usuario,
            id: usuario.id ?? usuario.id_usuario ?? usuario.id_profesor ?? "",
            id_usuario: usuario.id_usuario ?? usuario.id ?? usuario.id_profesor ?? "",
            id_profesor: usuario.id_profesor ?? usuario.id ?? usuario.id_usuario ?? "",
            nombre: usuario.nombre ?? usuario.nombres ?? "",
            nombres: usuario.nombres ?? usuario.nombre ?? "",
        };

        setUsuario(usuarioNormalizado);

        const tokenFinal = nuevoToken ?? token;

        if (tokenFinal) {
            setToken(tokenFinal);
            sessionStorage.setItem("token", tokenFinal);
        }

        sessionStorage.setItem(
            "usuario",
            JSON.stringify(usuarioNormalizado)
        );
    };

    const cerrarSesion = () => {
        setUsuario(null);
        setToken(null);
        sessionStorage.removeItem("usuario");
        sessionStorage.removeItem("token");
    };

    if (cargando) {
        return null;
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
                token,
                iniciarSesion,
                cerrarSesion
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() { 
    const context = useContext(AuthContext); 
    if (!context) { 
        throw new Error( "useAuth debe utilizarse dentro de AuthProvider" ); 
    } return context; 
}