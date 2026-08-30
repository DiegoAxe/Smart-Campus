"use client";

import "../../styles/portalDocente.css";

import { useAuth } from "../../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function PortalDocente() {
    //Variables utilizadas para navegar entre paginas y las variables de sesion
    const { usuario } = useAuth();
    const router = useRouter();
    const { cerrarSesion } = useAuth();

    const handleLogout = () => {
        cerrarSesion();
        router.push("/");
    };

    return (
        <div className="docente-container">

            {/* SIDEBAR */}
            <aside className="docente-sidebar">

                <div className="sidebar-logo">
                    <div className="logo-placeholder">
                        UDB
                    </div>

                    <h2>Smart Campus</h2>
                    <p>ASISTENCIA & IA</p>
                </div>

                <nav className="sidebar-menu">

                    <button className="menu-item active">
                        <span>▦</span>
                        Dashboard
                    </button>

                    <button className="menu-item">
                        <span>📚</span>
                        Mis Materias
                    </button>

                    <button className="menu-item">
                        <span>👥</span>
                        Asistencias
                    </button>

                    <button className="menu-item">
                        <span>📅</span>
                        Sesiones
                    </button>

                    <button className="menu-item">
                        <span>📊</span>
                        Reportes
                    </button>
                    <div className="link-separador"></div>
                    <button type="button" className="sidebar-logout" onClick={handleLogout}>
                        <span className="material-symbols-outlined"> logout </span>
                        <p>Cerrar sesión</p>
                    </button>

                </nav>

                <div className="sidebar-user">
                    <div className="user-circle">
                        E
                    </div>

                    <div>
                        <strong>Erick Campos</strong>
                        <p>Profesor</p>
                    </div>
                </div>

            </aside>


            {/* CONTENIDO PRINCIPAL */}
            <main className="docente-main">

                {/* HEADER */}
                <header className="docente-header">
                    <h1>
                        Portal Docente / <span>Dashboard</span>
                    </h1>
                </header>


                {/* BIENVENIDA */}
                <section className="docente-bienvenida">

                    <h1>
                        ¡Hola, Erick Campos!
                    </h1>

                    <p>
                        erick_campos@gmail.com • P00001 • Idiomas
                    </p>

                    <p>
                        Resumen académico de tus clases y asistencias
                    </p>

                </section>


                {/* TARJETAS RESUMEN */}
                <section className="docente-resumen">

                    <div className="docente-card">
                        <h3>Materias Asignadas</h3>
                        <strong>1</strong>
                        <p>Materias en el ciclo actual</p>
                    </div>

                    <div className="docente-card">
                        <h3>Grupos Activos</h3>
                        <strong>1</strong>
                        <p>Grupos asignados</p>
                    </div>

                    <div className="docente-card">
                        <h3>Sesiones Realizadas</h3>
                        <strong>3</strong>
                        <p>Sesiones registradas</p>
                    </div>

                    <div className="docente-card">
                        <h3>Estudiantes</h3>
                        <strong>2</strong>
                        <p>Estudiantes registrados</p>
                    </div>

                </section>


                {/* MIS MATERIAS */}
                <section className="docente-section">

                    <div className="section-title">
                        <h2>Mis Materias</h2>
                        <button>Ver todas</button>
                    </div>

                    <div className="materias-docente">

                        <div className="materia-docente-card">

                            <div className="materia-header">
                                <div>
                                    <h2>Cálculo de Varias Variables</h2>
                                    <p>Grupo 01T</p>
                                </div>

                                <span className="estado-activo">
                                    Activo
                                </span>
                            </div>

                            <div className="materia-info">
                                <p>📍 Aula A-102</p>
                                <p>👨‍🎓 2 estudiantes</p>
                                <p>📅 Lunes - Miércoles</p>
                            </div>

                            <div className="materia-footer">
                                <button>
                                    Ver asistencia
                                </button>
                            </div>

                        </div>

                    </div>

                </section>


                {/* SESIONES RECIENTES */}
                <section className="docente-section">

                    <div className="section-title">
                        <h2>Sesiones Recientes</h2>
                        <button>Ver historial</button>
                    </div>

                    <div className="tabla-container">

                        <table>

                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Materia</th>
                                    <th>Grupo</th>
                                    <th>Aula</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>

                            <tbody>

                                <tr>
                                    <td>27 Agosto 2026</td>
                                    <td>Cálculo de Varias Variables</td>
                                    <td>01T</td>
                                    <td>A-102</td>
                                    <td>
                                        <span className="estado-finalizada">
                                            Finalizada
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-ver">
                                            Ver asistencia
                                        </button>
                                    </td>
                                </tr>

                                <tr>
                                    <td>24 Agosto 2026</td>
                                    <td>Cálculo de Varias Variables</td>
                                    <td>01T</td>
                                    <td>A-102</td>
                                    <td>
                                        <span className="estado-finalizada">
                                            Finalizada
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-ver">
                                            Ver asistencia
                                        </button>
                                    </td>
                                </tr>

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* FOOTER */}
                <footer className="docente-footer">
                    <p>Copyright reservado © 2026</p>
                </footer>

            </main>

        </div>
    );
}