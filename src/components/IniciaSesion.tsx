//Modulo dedicado para el inicio de sesión de los usuarios, junto al redireccionamiento si Docente o Estudiante
"use client";

import "../styles/variables.css";
import "../styles/iniciaSesion.css";

export default function IniciaSesion() {

    const verContra = ():void => {
        const tipo = document.getElementById("password");
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
                <div className="formSesion">
                    {/*Puede que luego aca necesite volverlo en un form real, luego de tener la api comprobar y corregir*/ }
                    <p className="inputLabel">Carnet / Correo Institucional:</p>
                    <div className="inputContainer">
                        <span className="material-symbols-outlined icon"> person </span>
                        <input className="form-input" type="text" placeholder="ej. RG210145" />
                    </div>
                    <p className="inputLabel">Contraseña:</p>
                    <div className="inputContainer">
                        <span className="material-symbols-outlined icon"> lock </span>
                        <input className="form-input password-input" id="password" type="password" placeholder="••••••••••••" />
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
            </div>  
        </div>
    );
}