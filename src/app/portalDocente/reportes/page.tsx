"use client";

import "../../../styles/portalDocente.css";

import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardDocente } from "../../../services/api";

type Estadisticas = {
    total: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    permisos: number;
};

type Dashboard = {
    estadisticas: Estadisticas;

    resumen: {
        grupos: number;
        materias: number;
        estudiantes: number;
        sesiones: number;
    };
};

export default function ReportesDocente() {

    const { usuario, cerrarSesion } = useAuth();
    const router = useRouter();

    const [dashboard, setDashboard] =
        useState<Dashboard | null>(null);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState("");

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

                setError(
                    "No se pudieron cargar los reportes."
                );

            })
            .finally(() => {

                setCargando(false);

            });

    }, [usuario]);

    const porcentaje = (
        valor: number,
        total: number
    ) => {

        if (!total) {
            return 0;
        }

        return Math.round(
            (valor / total) * 100
        );
    };

    const handleLogout = () => {

        cerrarSesion();

        localStorage.removeItem(
            "id_profesor"
        );

        router.push("/");
    };

    if (!usuario) {
        return null;
    }

    if (cargando) {

        return (
            <div className="docente-container">

                <main className="docente-main">

                    <h2>
                        Generando reportes...
                    </h2>

                </main>

            </div>
        );
    }

    if (error) {

        return (
            <div className="docente-container">

                <main className="docente-main">

                    <h2>
                        {error}
                    </h2>

                    <button
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Reintentar
                    </button>

                </main>

            </div>
        );
    }

    const estadisticas =
        dashboard?.estadisticas;

    const resumen =
        dashboard?.resumen;

    const total =
        estadisticas?.total ?? 0;

    const presentes =
        estadisticas?.presentes ?? 0;

    const ausentes =
        estadisticas?.ausentes ?? 0;

    const tardanzas =
        estadisticas?.tardanzas ?? 0;

    const permisos =
        estadisticas?.permisos ?? 0;

    return (
        <div className="docente-container">

            {/* SIDEBAR */}

            <aside className="docente-sidebar">

                <div className="sidebar-logo">

                    <div className="logo-placeholder">
                        UDB
                    </div>

                    <h2>
                        Smart Campus
                    </h2>

                    <p>
                        ASISTENCIA & IA
                    </p>

                </div>


                <nav className="sidebar-menu">

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente"
                            )
                        }
                    >
                        <span>▦</span>
                        Dashboard
                    </button>

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente/materias"
                            )
                        }
                    >
                        <span>📚</span>
                        Mis Materias
                    </button>

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente/asistencias"
                            )
                        }
                    >
                        <span>👥</span>
                        Asistencias
                    </button>

                    <button
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente/sesiones"
                            )
                        }
                    >
                        <span>📅</span>
                        Sesiones
                    </button>

                    <button
                        className="menu-item active"
                        onClick={() =>
                            router.push(
                                "/portalDocente/reportes"
                            )
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

                        <p>
                            Cerrar sesión
                        </p>

                    </button>

                </nav>


                <div className="sidebar-user">

                    <div className="user-circle">
                        {usuario.nombres.charAt(0)}
                    </div>

                    <div>

                        <strong>
                            {usuario.nombres}{" "}
                            {usuario.apellidos}
                        </strong>

                        <p>
                            Profesor
                        </p>

                    </div>

                </div>

            </aside>


            {/* CONTENIDO */}

            <main className="docente-main">

                <header className="docente-header">

                    <h1>
                        Portal Docente /
                        <span> Reportes</span>
                    </h1>

                </header>


                <section className="docente-bienvenida">

                    <h1>
                        Reportes Académicos
                    </h1>

                    <p>
                        Resumen estadístico de tus
                        clases y asistencias
                    </p>

                </section>


                {/* RESUMEN */}

                <section className="docente-resumen">

                    <div className="docente-card">

                        <h3>
                            Materias
                        </h3>

                        <strong>
                            {resumen?.materias ?? 0}
                        </strong>

                        <p>
                            Materias asignadas
                        </p>

                    </div>


                    <div className="docente-card">

                        <h3>
                            Grupos
                        </h3>

                        <strong>
                            {resumen?.grupos ?? 0}
                        </strong>

                        <p>
                            Grupos activos
                        </p>

                    </div>


                    <div className="docente-card">

                        <h3>
                            Estudiantes
                        </h3>

                        <strong>
                            {resumen?.estudiantes ?? 0}
                        </strong>

                        <p>
                            Estudiantes registrados
                        </p>

                    </div>


                    <div className="docente-card">

                        <h3>
                            Sesiones
                        </h3>

                        <strong>
                            {resumen?.sesiones ?? 0}
                        </strong>

                        <p>
                            Sesiones registradas
                        </p>

                    </div>

                </section>


                {/* REPORTE ASISTENCIA */}

                <section className="docente-section">

                    <div className="section-title">

                        <h2>
                            Distribución de Asistencias
                        </h2>

                    </div>


                    <div className="docente-resumen">

                        <div className="docente-card">

                            <h3>
                                Presentes
                            </h3>

                            <strong>
                                {presentes}
                            </strong>

                            <p>
                                {porcentaje(
                                    presentes,
                                    total
                                )}
                                % del total
                            </p>

                        </div>


                        <div className="docente-card">

                            <h3>
                                Ausentes
                            </h3>

                            <strong>
                                {ausentes}
                            </strong>

                            <p>
                                {porcentaje(
                                    ausentes,
                                    total
                                )}
                                % del total
                            </p>

                        </div>


                        <div className="docente-card">

                            <h3>
                                Tardanzas
                            </h3>

                            <strong>
                                {tardanzas}
                            </strong>

                            <p>
                                {porcentaje(
                                    tardanzas,
                                    total
                                )}
                                % del total
                            </p>

                        </div>


                        <div className="docente-card">

                            <h3>
                                Permisos
                            </h3>

                            <strong>
                                {permisos}
                            </strong>

                            <p>
                                {porcentaje(
                                    permisos,
                                    total
                                )}
                                % del total
                            </p>

                        </div>

                    </div>

                </section>


                {/* RESUMEN GENERAL */}

                <section className="docente-section">

                    <div className="section-title">

                        <h2>
                            Resumen General
                        </h2>

                    </div>


                    <div className="tabla-container">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Indicador
                                    </th>

                                    <th>
                                        Cantidad
                                    </th>

                                    <th>
                                        Porcentaje
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                <tr>

                                    <td>
                                        Total de asistencias
                                    </td>

                                    <td>
                                        {total}
                                    </td>

                                    <td>
                                        100%
                                    </td>

                                </tr>

                                <tr>

                                    <td>
                                        Estudiantes presentes
                                    </td>

                                    <td>
                                        {presentes}
                                    </td>

                                    <td>
                                        {porcentaje(
                                            presentes,
                                            total
                                        )}%
                                    </td>

                                </tr>

                                <tr>

                                    <td>
                                        Estudiantes ausentes
                                    </td>

                                    <td>
                                        {ausentes}
                                    </td>

                                    <td>
                                        {porcentaje(
                                            ausentes,
                                            total
                                        )}%
                                    </td>

                                </tr>

                                <tr>

                                    <td>
                                        Llegadas tarde
                                    </td>

                                    <td>
                                        {tardanzas}
                                    </td>

                                    <td>
                                        {porcentaje(
                                            tardanzas,
                                            total
                                        )}%
                                    </td>

                                </tr>

                                <tr>

                                    <td>
                                        Permisos
                                    </td>

                                    <td>
                                        {permisos}
                                    </td>

                                    <td>
                                        {porcentaje(
                                            permisos,
                                            total
                                        )}%
                                    </td>

                                </tr>

                            </tbody>

                        </table>

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