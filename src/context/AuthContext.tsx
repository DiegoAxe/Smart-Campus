import { createContext, useContext, useState, useEffect,  type ReactNode } from "react";

import {Usuario, LoginResponse} from "../types/usuario";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const usuarioGuardado = sessionStorage.getItem("usuario");

        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }

        setCargando(false);
    }, []);

    const iniciarSesion = (usuario: Usuario) => {
        setUsuario(usuario);

        sessionStorage.setItem(
            "usuario",
            JSON.stringify(usuario)
        );
    };

    const cerrarSesion = () => {
        setUsuario(null);
        sessionStorage.removeItem("usuario");
    };

    if (cargando) {
        return null;
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
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