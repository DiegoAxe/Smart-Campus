"use client";

import "../../../styles/portalDocente.css";

import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardDocente } from "../../../services/api";

type Grupo = {
    id_grupo: string;
    numero_grupo: string;
    ciclo_academico: string;
    aula: string;
    id_materia: string;
    nombre_materia: string;
    estudiantes: number;
};

type Dashboard = {
    grupos: Grupo[];
};

export default function MateriasDocente() {

    const { usuario, cerrarSesion } = useAuth();
    const router = useRouter();

    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        if (!usuario) {
            setCargando(false);
            return;
        }

        getDashboardDocente(usuario.id_usuario)
            .then((data) => {
                setDashboard(data);
            })
            .catch((err) => {
                console.error(err);
                setError("No se pudieron cargar las materias.");
            })
            .finally(() => {
                setCargando(false);
            });

    }, [usuario]);

    const handleLogout = () => {

        cerrarSesion();

        localStorage.removeItem("id_profesor");

        router.push("/");
    };

    if (!usuario) {
        return null;
    }

    if (cargando) {
        return (
            <div className="docente-container">
                <main className="docente-main">
                    <h2>Cargando materias...</h2>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="docente-container">
                <main className="docente-main">
                    <h2>{error}</h2>

                    <button onClick={() => window.location.reload()}>
                        Reintentar
                    </button>
                </main>
            </div>
        );
    }

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

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente")
                        }
                    >
                        <span>▦</span>
                        Dashboard
                    </button>

                    <button
                        className="menu-item active"
                        onClick={() =>
                            router.push("/portalDocente/materias")
                        }
                    >
                        <span>📚</span>
                        Mis Materias
                    </button>

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/asistencias")
                        }
                    >
                        <span>👥</span>
                        Asistencias
                    </button>

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/sesiones")
                        }
                    >
                        <span>📅</span>
                        Sesiones
                    </button>

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/reportes")
                        }
                    >
                        <span>📊</span>
                        Reportes
                    </button>

                    <div className="link-separador"></div>

                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span className="material-symbols-outlined">
                            logout
                        </span>

                        <p>Cerrar sesión</p>
                    </button>

                </nav>

                <div className="sidebar-user">

                    <div className="user-circle">
                        {usuario.nombres.charAt(0)}
                    </div>

                    <div>

                        <strong>
                            {usuario.nombres} {usuario.apellidos}
                        </strong>

                        <p>Profesor</p>

                    </div>

                </div>

            </aside>


            {/* CONTENIDO */}

            <main className="docente-main">

                <header className="docente-header">

                    <h1>
                        Portal Docente / <span>Mis Materias</span>
                    </h1>

                </header>


                <section className="docente-bienvenida">

                    <h1>
                        Mis Materias
                    </h1>

                    <p>
                        Materias y grupos asignados actualmente
                    </p>

                </section>


                <section className="docente-section">

                    <div className="section-title">

                        <h2>
                            Materias Asignadas
                        </h2>

                    </div>


                    <div className="materias-docente">

                        {dashboard?.grupos.length === 0 ? (

                            <p>
                                No tienes materias asignadas.
                            </p>

                        ) : (

                            dashboard?.grupos.map((grupo) => (

                                <div
                                    className="materia-docente-card"
                                    key={grupo.id_grupo}
                                >

                                    <div className="materia-header">

                                        <div>

                                            <h2>
                                                {grupo.nombre_materia}
                                            </h2>

                                            <p>
                                                Grupo {grupo.numero_grupo}
                                            </p>

                                        </div>

                                        <span className="estado-activo">
                                            Activo
                                        </span>

                                    </div>


                                    <div className="materia-info">

                                        <p>
                                            📚 Materia: {grupo.nombre_materia}
                                        </p>

                                        <p>
                                            👥 {grupo.estudiantes} estudiantes
                                        </p>

                                        <p>
                                            📍 Aula {grupo.aula}
                                        </p>

                                        <p>
                                            📅 Ciclo {grupo.ciclo_academico}
                                        </p>

                                    </div>


                                    <div className="materia-footer">

                                        <button
                                            onClick={() =>
                                                router.push(
                                                    `/portalDocente/asistencias?grupo=${grupo.id_grupo}`
                                                )
                                            }
                                        >
                                            Ver asistencia
                                        </button>

                                    </div>

                                </div>

                            ))

                        )}

                    </div>

                </section>


                <footer className="docente-footer">

                    <p>
                        Copyright reservado © 2026
                    </p>

                </footer>

            </main>

        </div>
    );
}