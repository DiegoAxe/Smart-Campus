// Modulo que contendra el resumen academico de las asistencias y el historial reciente del Estudiante
"use client"; 

import { useEffect, useState } from "react";
import "../styles/estuDashboard.css";

type Asistencia = {
    id_asistencia: number;
    fecha: string;
    hora_marca: string;
    nombre_materia: string;
    nombre_aula: string | null;
    estado_asistencia: "Presente" | "Ausente" | "Llegada Tarde" | "Permiso";
};

type Usuario = {
    id_usuario: string;
    nombres: string;
    apellidos: string;
    correo_institucional: string;
    rol: "estudiante" | "profesor";
    departamento_facultad: string | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const claseEstado = (estado: Asistencia["estado_asistencia"]) => {
    if (estado === "Llegada Tarde") return "tardanza";
    if (estado === "Presente") return "presente";
    return "critico";
};

export default function EstudianteDashboard() {
    const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(true);
    const [errorHistorial, setErrorHistorial] = useState("");
    const [usuario] = useState<Usuario | null>(() => {
        if (typeof window === "undefined") return null;
        const usuarioGuardado = window.localStorage.getItem("usuario");
        if (!usuarioGuardado) return null;
        try {
            return JSON.parse(usuarioGuardado) as Usuario;
        } catch {
            window.localStorage.removeItem("usuario");
            return null;
        }
    });

    useEffect(() => {
        const idEstudiante = window.localStorage.getItem("id_estudiante");
        if (!idEstudiante) {
            window.setTimeout(() => {
                setErrorHistorial("No hay un estudiante autenticado.");
                setCargandoHistorial(false);
            }, 0);
            return;
        }

        fetch(`${apiUrl}/api/asistencias/estudiante/${encodeURIComponent(idEstudiante)}`)
            .then(async (respuesta) => {
                if (!respuesta.ok) throw new Error("No se pudo cargar el historial.");
                return respuesta.json() as Promise<Asistencia[]>;
            })
            .then(setAsistencias)
            .catch((error: Error) => setErrorHistorial(error.message))
            .finally(() => setCargandoHistorial(false));
    }, []);

    return (
        <div className="container">
            <div className="estudiante-dashboard">
                <div className="dashboard-header"> 
                    <h1> Portal Estudiante / <span>Dashboard</span></h1>
                </div>

                {/* Esta tambien necesita api + detectar horario local */}
                <div className="bienvenida">
                    <h1> ¡Hola, {usuario ? `${usuario.nombres} ${usuario.apellidos}` : "estudiante"}!</h1>
                    <h3>
                        {usuario?.correo_institucional ?? ""} • {usuario?.id_usuario ?? ""} • {usuario?.rol ?? "estudiante"}
                        <br />Resumen academico de asistencia
                    </h3>
                </div>

                <div className="resumen-content">
                    <div className="resumen-card">
                        <div className="asistencias-card">
                            <div className="dashboard-card clases-card">
                                <h3> Clases Totales</h3>
                                {/*Info de cada clase, asistida o no */}
                                <h1> 64</h1>
                                <p> Registradas en el ciclo</p>
                            </div>
                            <div className="dashboard-card asistenciasGlobal-card">
                                <h3> Asistencia Global</h3>
                                {/* % de las asistencias totales */}
                                <h1>85%</h1>
                                <p>Porcentaje de asistencia total</p>
                            </div>
                        </div>
                        <div className="dashboard-card inasistencias-card">
                            <h3> Inasistencias Permitidas</h3>
                            {/* Info de las inasistencias, y el estado debe variar, segun la api */}
                            <div className="estado-inasistencia">
                              <h1> 3   </h1>       
                              <h2 className="estado critico">Limite Critico</h2>
                            </div>
                            <p> Antes de incurrir en desercion automatica</p>
                        </div>
                    </div>
                    <div className="dashboard-card grafico-card">
                        <h3> Distribución Global</h3>
                        {/* Aqui va el grafico y su legado*/}
                        FALTA LA GRAFICA DE PASTEL
                    </div>
                </div>

                <div className="historial-content">
                    <h1> Historial Reciente</h1>
                    <div className="historial-div">
                        {/* Aqui va el historial de las ultimas 5 clases, de nuevo, con la api, 
                        aunque si hay menos, debe de validar, lo mejor es hacer que escriba todos los registros que recibe,
                        pero limitar los registros enviados, gracias a la peticion sql (por ejemplo, usando top 5) */}
                        <table className="historial-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Materia</th>
                                    <th>Aula</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargandoHistorial && <tr><td colSpan={5}>Cargando historial...</td></tr>}
                                {errorHistorial && <tr><td colSpan={5}>{errorHistorial}</td></tr>}
                                {!cargandoHistorial && !errorHistorial && asistencias.length === 0 && (
                                    <tr><td colSpan={5}>No hay asistencias registradas.</td></tr>
                                )}
                                {asistencias.map((asistencia) => (
                                    <tr key={asistencia.id_asistencia}>
                                        <td>{new Date(`${asistencia.fecha}T00:00:00`).toLocaleDateString("es-SV", {
                                            weekday: "long", day: "numeric", month: "long", year: "numeric"
                                        })}</td>
                                        <td>{new Date(asistencia.hora_marca).toLocaleTimeString("es-SV", {
                                            hour: "numeric", minute: "2-digit"
                                        })}</td>
                                        <td>{asistencia.nombre_materia}</td>
                                        <td>{asistencia.nombre_aula ?? "Sin aula"}</td>
                                        <td className={`estado ${claseEstado(asistencia.estado_asistencia)}`}>
                                            {asistencia.estado_asistencia}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            
                        </table>
                    </div>
                </div>

                <div className="materias-content">
                    <h1> Mis Materias</h1>
                    <div className="materias-grid">
                        {/**Esto deberia de tener algo que segun la cantidad de materias detecte, cree X cards, eso    
                        * sim mencionar claro, la informacion que debe de contener, en parejas*/}
                        <div className="materias-card">
                            <h1> [Nombre Materia]</h1>
                            <h3> [Horario de Clase] • [Aula Asignada]</h3>
                            FALTAN LAS BARRAS
                            {/**Grafico de barra de asistencias, de 3 colores, con porcentajes y " x de y faltas" */}
                        </div>
                        <div className="materias-card">
                            <h1> Calculo</h1>
                            <h3> Mar-Jue 11:00 AM • Aula A-301</h3>
                            {/**Grafico de barra de asistencias, de 3 colores, con porcentajes y " x de y faltas" */}
                        </div>
                        <div className="materias-card">
                            <h1> Fisica</h1>
                            <h3> Lunes 9:00 AM • Aula B-321</h3>
                            {/**Grafico de barra de asistencias, de 3 colores, con porcentajes y " x de y faltas" */}
                        </div>
                    </div>
                </div>

                <div className="dashboard-footer">
                    <h1> Copyright reservado © 2026</h1>
                </div>

            </div>
        </div>
    );
}