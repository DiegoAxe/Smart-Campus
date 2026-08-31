// Modulo dedicado para el inicio de sesión de los usuarios,
// junto al redireccionamiento si Docente o Estudiante

"use client";

import { postLogin } from "../services/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

import "../styles/variables.css";
import "../styles/iniciaSesion.css";

export default function IniciaSesion() {

    const [texto_correo, setTexto_Correo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    const { iniciarSesion } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setErrorMensaje(null);
        setCargando(true);

        try {

            // Enviar usuario/correo y contraseña a la API
            const dataLogin = await postLogin(
                texto_correo,
                contrasena
            );

            // Login incorrecto
            if (dataLogin.success === false || dataLogin.error) {
                setErrorMensaje(
                    dataLogin.mensaje ||
                    dataLogin.error ||
                    "Carnet/correo o contraseña incorrectos"
                );

                return;
            }

            // Login correcto
if (dataLogin.usuario) {

    // Guardar los datos del usuario en el contexto
    iniciarSesion(dataLogin.usuario);

    // ==========================================
    // ESTUDIANTE
    // ==========================================
    if (dataLogin.usuario.rol === "estudiante") {

        // Guardamos el ID del estudiante
        localStorage.setItem(
            "id_estudiante",
            dataLogin.usuario.id_usuario
        );

        // Ir al portal del estudiante
        router.push("/portalEstudiante");

    }

    // ==========================================
    // PROFESOR
    // ==========================================
    else if (dataLogin.usuario.rol === "profesor") {

        // Guardamos el ID del profesor
        localStorage.setItem(
            "id_profesor",
            dataLogin.usuario.id_usuario
        );

        // Ir al portal del profesor
        router.push("/portalDocente");

    }

    // ==========================================
    // ROL DESCONOCIDO
    // ==========================================
    else {

        setErrorMensaje(
            "El usuario tiene un rol no reconocido."
        );

    }
}

        } catch (error: unknown) {

            console.error(error);

            const mensaje =
                error instanceof Error
                    ? error.message
                    : "No se pudo conectar con el servidor";

            setErrorMensaje(mensaje);

        } finally {

            setCargando(false);

        }
    };


    // Mostrar / ocultar contraseña
    const verContra = (): void => {

        const tipo =
            document.getElementById("password") as HTMLInputElement | null;

        if (tipo) {

            tipo.type =
                tipo.type === "password"
                    ? "text"
                    : "password";

        }
    };


    return (

        <div className="containerA">

            <div className="divSesion">

                <form onSubmit={handleLogin}>

                    <link
                        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                        rel="stylesheet"
                    />

                    {/* =====================================
                        ENCABEZADO
                    ====================================== */}

                    <div className="headerUDB">

                        <img
                            src="UDB logo.png"
                            alt="Logo UDB"
                            className="logoUDB"
                        />

                        <h1>
                            Smart Campus UDB
                        </h1>

                        <h3>
                            Sistema de Control de Asistencias e IA
                        </h3>

                    </div>


                    {/* =====================================
                        FORMULARIO
                    ====================================== */}

                    <div className="formSesion">

                        {/* Usuario / correo */}

                        <p className="inputLabel">
                            Carnet / Correo Institucional:
                        </p>

                        <div className="inputContainer">

                            <span className="material-symbols-outlined icon">
                                person
                            </span>

                            <input
                                className="form-input"
                                type="text"
                                placeholder="ej. RG210145"
                                value={texto_correo}
                                onChange={(e) => {

                                    setTexto_Correo(e.target.value);

                                    if (errorMensaje) {
                                        setErrorMensaje(null);
                                    }

                                }}
                                required
                            />

                        </div>


                        {/* Contraseña */}

                        <p className="inputLabel">
                            Contraseña:
                        </p>

                        <div className="inputContainer">

                            <span className="material-symbols-outlined icon">
                                lock
                            </span>

                            <input
                                className="form-input password-input"
                                id="password"
                                type="password"
                                value={contrasena}
                                placeholder="••••••••••••"
                                onChange={(e) => {

                                    setContrasena(e.target.value);

                                    if (errorMensaje) {
                                        setErrorMensaje(null);
                                    }

                                }}
                                required
                            />

                            <div className="password-toggle-container">

                                <button
                                    className="password-toggle"
                                    type="button"
                                    onClick={verContra}
                                >

                                    <span className="material-symbols-outlined">
                                        visibility
                                    </span>

                                </button>

                            </div>

                        </div>

                    </div>


                    {/* =====================================
                        OPCIONES
                    ====================================== */}

                    <div className="checkboxContainer">

                        <div className="divRememberMe">

                            <input
                                type="checkbox"
                                id="rememberMe"
                            />

                            <label htmlFor="rememberMe">
                                Recordarme
                            </label>

                        </div>


                        <div className="divForgotPassword">

                            <a href="#">
                                ¿Olvidaste tu contraseña?
                            </a>

                        </div>

                    </div>


                    {/* =====================================
                        BOTÓN LOGIN
                    ====================================== */}

                    <button
                        className="btnSesion"
                        type="submit"
                        disabled={cargando}
                    >

                        {cargando
                            ? "Iniciando sesión..."
                            : "Iniciar Sesión"
                        }

                    </button>


                    {/* =====================================
                        MENSAJE DE ERROR
                    ====================================== */}

                    {errorMensaje && (

                        <div className="mensajeErrorLogin">

                            <span className="material-symbols-outlined errorIcon">
                                error
                            </span>

                            <p>
                                {errorMensaje}
                            </p>

                        </div>

                    )}

                </form>

            </div>

        </div>

    );
}