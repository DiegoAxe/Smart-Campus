//Modulo dedicado para el inicio de sesión de los usuarios, junto al redireccionamiento si Docente o Estudiante
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

    const { iniciarSesion } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => { 
        e.preventDefault();
        try {
            const dataLogin = await postLogin(texto_correo, contrasena);

            // Login incorrecto 
            if (dataLogin.success === false) { 
                alert("Carnet/correo o contraseña incorrectos"); 
                return; 
            }

            // Login correcto 
            if (dataLogin.success === true) { 
                // Crear sesión 
                iniciarSesion(dataLogin.usuario); 
                // Redirigir dependiendo del rol 
                if (dataLogin.usuario.rol === "Estudiante") { 
                    router.push("/portalEstudiante"); 
                } else if (dataLogin.usuario.rol === "Docente") { 
                    router.push("/portalDocente"); 
                } 
            }
            
        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        }

    }

    const verContra = ():void => {
        const tipo = document.getElementById("password");
        if(tipo.type == "password"){
            tipo.type = "text";
        }else{
            tipo.type = "password";
        }
    }

    return (
        <div className="containerA">
            <div className="divSesion">
                <form onSubmit={handleLogin}>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
                <div className="headerUDB">
                    <img src="UDB logo.png" alt="Logo UDB" className="logoUDB" />                   
                    <h1>Smart Campus UDB</h1>
                    <h3>Sistema de Control de Asistencias e IA</h3>
                </div>
                <div className="formSesion">
                    
                    {/*Puede que luego aca necesite volverlo en un form real, luego de tener la api comprobar y corregir*/ }
                    <p className="inputLabel">Carnet / Correo Institucional:</p>
                    <div className="inputContainer">
                        <span className="material-symbols-outlined icon"> person </span>
                        <input className="form-input" type="text" placeholder="ej. RG210145" value={texto_correo} 
                        onChange={(e) => setTexto_Correo(e.target.value)} required/>
                    </div>
                    <p className="inputLabel">Contraseña:</p>
                    <div className="inputContainer">
                        <span className="material-symbols-outlined icon"> lock </span>
                        <input className="form-input password-input" id="password" type="password" value={contrasena}
                        placeholder="••••••••••••"  onChange={(e) => setContrasena(e.target.value)} required/>
                        <div className="password-toggle-container">
                            <button className="password-toggle" type="button" onClick={verContra}>
                                <span className="material-symbols-outlined"> visibility </span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="checkboxContainer">
                    <div className="divRememberMe">
                        <input type="checkbox" id="rememberMe" />
                        <label htmlFor="rememberMe">Recordarme</label>
                    </div>
                    <div className="divForgotPassword">
                        <a href="#">¿Olvidaste tu contraseña?</a>
                    </div>
                </div>
                
                <button className="btnSesion" type="submit">Iniciar Sesión</button>
                </form>
            </div>  
        </div>
    );
}