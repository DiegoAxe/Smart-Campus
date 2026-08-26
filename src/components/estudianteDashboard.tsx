// Modulo que contendra el resumen academico de las asistencias y el historial reciente del Estudiante
"use client"; 

import "../styles/estuDashboard.css";

export default function estudianteDashboard() {
    return (
        <div className="container">
            <div className="estudiante-dashboard">
                <div className="dashboard-header"> 
                    <h1> Portal Estudiante / <span>Dashboard</span></h1>
                </div>

                {/* Esta tambien necesita api + detectar horario local */}
                <div className="bienvenida">
                    <h1> ¡Hola, [Nombre User]!</h1>
                    <h3> [Fecha Actual] • Resumen academico de asistencia</h3>
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
                                <tr>
                                    <td>Lunes 24 Agosto, 2026</td>
                                    <td>9:05 AM</td>
                                    <td>Cálculo Integral</td>
                                    <td>Aula A-201</td>
                                    {/*Esta deberia de tener una clase que haga facil el darle el color, con la api */}
                                    <td className="estado presente"> Presente</td>
                                </tr>
                                <tr>
                                    <td>Martes 25 Agosto, 2026</td>
                                    <td>5:20 PM</td>
                                    <td>Analisis de Circuitos</td>
                                    <td>Aula C-321</td>
                                    {/*Esta deberia de tener una clase que haga facil el darle el color, con la api */}
                                    <td className="estado tardanza"> Tardanza</td>
                                </tr>
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