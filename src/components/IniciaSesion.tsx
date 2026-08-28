//Modulo dedicado para el inicio de sesión de los usuarios, junto al redireccionamiento si Docente o Estudiante
"use client";

import "../styles/variables.css";
import "../styles/iniciaSesion.css";
import { FormEvent, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function IniciaSesion() {
    const [usuario, setUsuario] = useState("");
    const [contraseña, setContraseña] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const iniciarSesion = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCargando(true);
        setError("");
        try {
            const respuesta = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, contraseña })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error ?? "No se pudo iniciar sesión.");
            window.localStorage.setItem("usuario", JSON.stringify(datos.usuario));
            if (datos.usuario.rol === "estudiante") {
                window.localStorage.setItem("id_estudiante", datos.usuario.id_usuario);
                window.location.href = "/portalEstudiante";
            } else {
                setError(`Sesión iniciada como ${datos.usuario.rol}. El portal correspondiente aún no está disponible.`);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
        } finally {
            setCargando(false);
        }
    };

    const verContra = ():void => {
        const tipo = document.getElementById("password") as HTMLInputElement | null;
        if (!tipo) return;
        if(tipo.type == "password"){
            tipo.type = "text";
        }else{
            tipo.type = "password";
        }
    }

    return (
        <div className="container">
            <div className="divSesion">
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
                <div className="headerUDB">
                    <img src="UDB logo.png" alt="Logo UDB" className="logoUDB" />                   
                    <h1>Smart Campus UDB</h1>
                    <h3>Sistema de Control de Asistencias e IA</h3>
                </div>
                <form id="login-form" className="formSesion" onSubmit={iniciarSesion}>
                    {/*Puede que luego aca necesite volverlo en un form real, luego de tener la api comprobar y corregir*/ }
                    <p className="inputLabel">Usuario / Correo Institucional:</p>
                    <div className="inputContainer">
                        <span className="material-symbols-outlined icon"> person </span>
                        <input className="form-input" type="text" placeholder="ej. RG210145" value={usuario} onChange={(event) => setUsuario(event.target.value)} required />
                    </div>
                    <p className="inputLabel">Contraseña:</p>
                    <div className="inputContainer">
                        <span className="material-symbols-outlined icon"> lock </span>
                        <input className="form-input password-input" id="password" type="password" placeholder="••••••••••••" value={contraseña} onChange={(event) => setContraseña(event.target.value)} required />
                        <div className="password-toggle-container">
                            <button className="password-toggle" type="button" onClick={verContra}>
                                <span className="material-symbols-outlined"> visibility </span>
                            </button>
                        </div>
                    </div>
                </form>
                <div className="checkboxContainer">
                    <div className="divRememberMe">
                        <input type="checkbox" id="rememberMe" />
                        <label htmlFor="rememberMe">Recordarme</label>
                    </div>
                    <div className="divForgotPassword">
                        <a href="#">¿Olvidaste tu contraseña?</a>
                    </div>
                </div>
                
                {error && <p role="alert">{error}</p>}
                <button className="btnSesion" type="submit" form="login-form" disabled={cargando}>{cargando ? "Ingresando..." : "Iniciar Sesión"}</button>
            </div>  
        </div>
    );
}