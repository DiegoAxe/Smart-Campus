// Modulo que contendra el resumen academico de las asistencias y el historial reciente del Estudiante
"use client"; 

import { Cell, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend} from "recharts";
import { estudianteAsistencias } from "../types/estudianteAsistencias";
import { estudianteResumen } from "../types/estudianteResumen";
import { materiasResumen } from "../types/materiasResumen";
import "../styles/estuDashboard.css";
import { getAsistenciasporCarnet, getEstudianteResumen, getMateriasResumen } from "../services/api";
import { formatearFecha, formatearHora, ordenarHora } from "../redux/formatearFecha";
import { useState, useEffect } from "react";

export default function estudianteDashboard() {

    const userCarnet = "ML222767";
    const userName = "Diego Martinez";

    //Fecha Actual
    const fechaActual = new Date();

    //Setters de los objetos obtenidos de la api
    const [asistencias, setAsistencias] = useState<estudianteAsistencias[]>([]);
    const [resumen, setResumen] = useState<estudianteResumen | null>(null);
    const [materias, setMaterias] = useState<materiasResumen[]>([]);

    //Datos para la grafica de pastel
    const datosPastel = [
        {
            nombre: "Presentes", cantidad: resumen?.presentes ?? 0
        },
        {
            nombre: "Permisos", cantidad: resumen?.permisos ?? 0
        },
        {
            nombre: "Tardanzas", cantidad: resumen?.tardanzas ?? 0
        },
        {
            nombre: "Ausencias", cantidad: resumen?.ausentes ?? 0
        }
    ];
    //Funcion para el label del grafico pastel muestre un %
    const renderLabel = ({
        name,
        percent
    }: {
        name?: string;
        percent?: number;
    }) => {
        return `${name} ${((percent ?? 0) * 100).toFixed(0)}%`;
    };

    //Cargar el resumen de las asistencias
    useEffect(() => {
        const cargarResumen = async () => {
            try {
                const resumenA = await getEstudianteResumen(userCarnet);

                setResumen(resumenA);
                
            } catch (error) {
                console.error(error);
            }
        };
        cargarResumen();
    }, []);

    //Cargar las asistencias para la tabla del historial
    useEffect(() => {
        const cargarAsistencias = async () => {
            try {
                const asistencias = await getAsistenciasporCarnet(userCarnet);

                setAsistencias(asistencias);
                
            } catch (error) {
                console.error(error);
            }
        };
        cargarAsistencias();
    }, []);

    //Cargar las asistencias para los apartados de materias
    useEffect(() => {
        const cargarMaterias = async () => {
            try {
                const materiasA = await getMateriasResumen(userCarnet);

                setMaterias(materiasA);
                
            } catch (error) {
                console.error(error);
            }
        };
        cargarMaterias();
    }, []);


    return (
        <div className="container">
            <div className="estudiante-dashboard">
                <div className="dashboard-header"> 
                    <h1> Portal Estudiante / <span>Dashboard</span></h1>
                </div>

                {/* Esta tambien necesita api + detectar horario local */}
                <div className="bienvenida">
                    <h1> ¡Hola, {userName}!</h1>
                    <h3> {formatearFecha(fechaActual)} • Resumen academico de asistencia</h3>
                </div>

                <div className="resumen-content">
                    <div className="resumen-card">
                        <div className="asistencias-card">
                            <div className="dashboard-card clases-card">
                                <h3> Clases Totales </h3>
                                {/*Info de cada clase, asistida o no */}
                                <h1> {resumen?.asistencias_totales}</h1>
                                <p> Registradas en el ciclo</p>
                            </div>
                            <div className="dashboard-card asistenciasGlobal-card">
                                <h3> Asistencia Global</h3>
                                {/* % de las asistencias totales */}
                                <h1>{((resumen?.asistencias_totales -  resumen?.ausentes)/resumen?.asistencias_totales) * 100}%</h1>
                                <p>Porcentaje de asistencia total</p>
                            </div>
                        </div>
                        <div className="dashboard-card inasistencias-card">
                            <h3> Permisos concedidos </h3>
                            {/* Info de las inasistencias, y el estado debe variar, segun la api */}
                            <div className="estado-inasistencia">
                              <h1> {resumen?.permisos}   </h1>       
                              <h2 className="estado Permiso">Permisos Usados</h2>
                            </div>
                            <p> Recuerda que solo se aceptan por motivos de salud o fuerza mayor.</p>
                        </div>
                    </div>
                    <div className="dashboard-card grafico-card">
                        <h3> Distribución Global</h3>
                        
                        <ResponsiveContainer width="100%" height={210}>
                            <PieChart>
                                <Pie data={datosPastel} dataKey="cantidad" nameKey="nombre"
                                    cx="50%" cy="50%" innerRadius={25} outerRadius={65} 
                                    label={renderLabel}>
                                    <Cell fill="#10b981" />
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#f59e0b" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>

                    </div>
                </div>

                <div className="historial-content">
                    <h1> Historial Reciente</h1>
                    <div className="historial-div">

                        {asistencias.length === 0 ? (
                            <p className="sinRegistros">No hay asistencias registradas.</p>
                        ) : (
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
                                {asistencias.map((asistencia) => (        
                                <tr key={asistencia.id_asistencia}>
                                    <td>{formatearFecha(asistencia.fecha)}</td>
                                    <td>{formatearHora(asistencia.hora_marca)}</td>
                                    <td>{asistencia.nombre_materia}</td>
                                    <td>{asistencia.aula}</td>
                                    <td className={asistencia.estado_asistencia}>{asistencia.estado_asistencia}</td>
                                </tr>
                                ))}
                            </tbody>
                            
                        </table>
                            )}
                    </div>
                </div>

                        <div className="materias-content">
                            <h1> Mis Materias</h1>
                            <div className="materias-grid">
                                 {materias.length === 0 ? (
                                    <p className="sinRegistros">No hay materias inscritas.</p>
                                ) : materias.map((materia) => {


                            const porcentajeBarra = materia.total_sesiones > 0 ? Math.round(((materia.total_sesiones - 
                                                    materia.cantidad_inasistencias)/materia.total_sesiones)*100) : 0;
                            
                                let estadoBarra = "";
                            if(porcentajeBarra >= 75){
                                estadoBarra = "barraVerde";
                            } else if (porcentajeBarra >= 50){
                                estadoBarra = "barraAmarillo"
                            }else{
                                estadoBarra = "barraRojo"
                            }

                            return (
                                <div key={materia.materia} className="materias-card">
                                    <h1> {materia.materia}</h1>
                                    <h3> {materia.dias_semana} {ordenarHora(materia.hora_inicio)} 
                                        &nbsp;&nbsp;  •  &nbsp; Aula {materia.aula}</h3>

                                    <div className="barra-progreso">

                                        <div className="barra-progreso-fondo">
                                        <div
                                            className={`barra-progreso-relleno ${estadoBarra}`}
                                            style={{ width: `${porcentajeBarra}%` }}/>
                                    </div>
                                    <span className={`porcentaje ${estadoBarra}`}>
                                            {porcentajeBarra}%
                                        </span>
                                </div>
                                <p className= "texto_barra_porcentaje"> {materia.total_sesiones - 
                                    materia.cantidad_inasistencias} de {materia.total_sesiones}
                                    </p>
                                </div>
                            );
                        })}



                
                    </div>
                </div>

                <div className="dashboard-footer">
                    <h1> Copyright reservado © 2026</h1>
                </div>

            </div>
        </div>
    );
}