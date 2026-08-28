"use client";

import { useEffect, useState } from "react";

type Usuario = {
    id_usuario: string;
    nombres: string;
    apellidos: string;
    correo_institucional: string;
    rol: "estudiante" | "profesor";
    departamento_facultad: string | null;
};

export default function PortalDocente() {
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuario");

        if (usuarioGuardado) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
            } catch {
                localStorage.removeItem("usuario");
            }
        }
    }, []);

    return (
        <main>
            <h1>Portal Docente</h1>

            <h2>
                ¡Hola,{" "}
                {usuario
                    ? `${usuario.nombres} ${usuario.apellidos}`
                    : "docente"}!
            </h2>

            <p>
                {usuario?.correo_institucional ?? ""}
            </p>

            <p>
                ID: {usuario?.id_usuario ?? ""}
            </p>

            <p>
                Rol: {usuario?.rol ?? ""}
            </p>
        </main>
    );
}