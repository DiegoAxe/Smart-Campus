"use client";

import "../../../styles/portalDocente.css";

import { useAuth } from "../../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    getDashboardDocente,
    getAsistenciasPorSesion
} from "../../../services/api";


type Asistencia = {
    id_asistencia: number;
    id_estudiante: string;
    nombres: string;
    apellidos: string;
    estado_asistencia: string;
    hora_marca: string | null;
    metodo_registro: string | null;
};


type Sesion = {
    id_sesion: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    nombre_materia: string;
    numero_grupo: string;
    aula: string;
};


type Dashboard = {
    sesiones: Sesion[];
};


export default function AsistenciasDocente() {

    // ==========================================
    // SESIÓN
    // ==========================================

    const { usuario, cerrarSesion } = useAuth();

    const router = useRouter();

    const searchParams = useSearchParams();


    // ==========================================
    // SESIÓN SELECCIONADA
    // ==========================================

    const sesionParam =
        searchParams.get("sesion");


    // ==========================================
    // ESTADOS
    // ==========================================

    const [dashboard, setDashboard] =
        useState<Dashboard | null>(null);

    const [asistencias, setAsistencias] =
        useState<Asistencia[]>([]);

    const [cargando, setCargando] =
        useState(true);

    const [cargandoAsistencias, setCargandoAsistencias] =
        useState(false);

    const [error, setError] =
        useState("");

    const [errorAsistencias, setErrorAsistencias] =
        useState("");


    // ==========================================
    // CARGAR DASHBOARD
    // ==========================================

    useEffect(() => {

        if (!usuario) {
            setCargando(false);
            return;
        }

        getDashboardDocente(
            usuario.id_usuario
        )
            .then((data) => {

                console.log(
                    "Dashboard docente:",
                    data
                );

                setDashboard(data);

            })
            .catch((err) => {

                console.error(err);

                setError(
                    "No se pudo cargar la información."
                );

            })
            .finally(() => {

                setCargando(false);

            });

    }, [usuario]);


    // ==========================================
    // CARGAR ASISTENCIAS
    // ==========================================

    useEffect(() => {

        if (!sesionParam) {
            setAsistencias([]);
            return;
        }

        const idSesion =
            Number(sesionParam);

        if (Number.isNaN(idSesion)) {
            return;
        }

        setCargandoAsistencias(true);

        setErrorAsistencias("");

        getAsistenciasPorSesion(
            idSesion
        )
            .then((data) => {

                console.log(
                    "Asistencias de sesión:",
                    data
                );

                setAsistencias(data);

            })
            .catch((err) => {

                console.error(err);

                setErrorAsistencias(
                    "No se pudieron cargar las asistencias."
                );

            })
            .finally(() => {

                setCargandoAsistencias(false);

            });

    }, [sesionParam]);


    // ==========================================
    // FORMATEAR FECHA
    // ==========================================

    const formatearFecha = (
        fecha: string
    ) => {

        if (!fecha) {
            return "Sin fecha";
        }

        const partes =
            fecha
                .split("T")[0]
                .split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const [anio, mes, dia] =
            partes;

        const fechaLocal =
            new Date(
                Number(anio),
                Number(mes) - 1,
                Number(dia)
            );

        return fechaLocal.toLocaleDateString(
            "es-SV",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    };


    // ==========================================
    // FORMATEAR HORA
    // ==========================================

    const formatearHora = (
    hora: string | null
) => {

    if (!hora) {
        return "—";
    }

    // Si viene como DATETIME:
    // 2026-08-18 11:25:30
    if (hora.includes(" ")) {
        return hora.split(" ")[1].substring(0, 5);
    }

    // Si viene como ISO:
    // 2026-08-18T11:25:30
    if (hora.includes("T")) {
        return hora.split("T")[1].substring(0, 5);
    }

    // Si ya viene como HH:MM:SS
    return hora.substring(0, 5);
};


    // ==========================================
    // OBTENER SESIÓN SELECCIONADA
    // ==========================================

    const sesionSeleccionada =
        dashboard?.sesiones.find(
            (sesion) =>
                sesion.id_sesion ===
                Number(sesionParam)
        );


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    const handleLogout = () => {

        cerrarSesion();

        localStorage.removeItem(
            "id_profesor"
        );

        router.push("/");
    };


    // ==========================================
    // ESTADO DE ASISTENCIA
    // ==========================================

    const claseEstado = (
        estado: string
    ) => {

        switch (estado) {

            case "Presente":
                return "estado-finalizada";

            case "Ausente":
                return "estado-cancelada";

            case "Tardanza":
            case "Llegada Tarde":
                return "estado-programada";

            case "Permiso":
                return "estado-programada";

            default:
                return "";
        }
    };


    // ==========================================
    // SI NO HAY USUARIO
    // ==========================================

    if (!usuario) {
        return null;
    }


    // ==========================================
    // CARGANDO
    // ==========================================

    if (cargando) {

        return (
            <div className="docente-container">

                <main className="docente-main">

                    <h2>
                        Cargando asistencias...
                    </h2>

                </main>

            </div>
        );
    }


    // ==========================================
    // ERROR
    // ==========================================

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


    // ==========================================
    // PORTAL
    // ==========================================

    return (

        <div className="docente-container">


            {/* ==========================================
                SIDEBAR
            ========================================== */}

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


                    {/* DASHBOARD */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente"
                            )
                        }
                    >
                        <span>
                            ▦
                        </span>

                        Dashboard

                    </button>


                    {/* MATERIAS */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente/materias"
                            )
                        }
                    >
                        <span>
                            📚
                        </span>

                        Mis Materias

                    </button>


                    {/* ASISTENCIAS */}

                    <button
                        type="button"
                        className="menu-item active"
                        onClick={() =>
                            router.push(
                                "/portalDocente/asistencias"
                            )
                        }
                    >
                        <span>
                            👥
                        </span>

                        Asistencias

                    </button>


                    {/* SESIONES */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente/sesiones"
                            )
                        }
                    >
                        <span>
                            📅
                        </span>

                        Sesiones

                    </button>


                    {/* REPORTES */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push(
                                "/portalDocente/reportes"
                            )
                        }
                    >
                        <span>
                            📊
                        </span>

                        Reportes

                    </button>


                    <div className="link-separador"></div>


                    {/* LOGOUT */}

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


                {/* USUARIO */}

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


            {/* ==========================================
                CONTENIDO
            ========================================== */}

            <main className="docente-main">


                {/* HEADER */}

                <header className="docente-header">

                    <h1>

                        Portal Docente /

                        <span>
                            {" "}Asistencias
                        </span>

                    </h1>

                </header>


                {/* ==========================================
                    TÍTULO
                ========================================== */}

                <section className="docente-bienvenida">

                    <h1>
                        Control de Asistencias
                    </h1>

                    <p>
                        Consulta la asistencia de
                        tus estudiantes por sesión
                    </p>

                </section>


                {/* ==========================================
                    SELECTOR DE SESIÓN
                ========================================== */}

                <section className="docente-section">

                    <div className="section-title">

                        <h2>
                            Seleccionar Sesión
                        </h2>

                    </div>


                    <select
                        value={
                            sesionParam || ""
                        }
                        onChange={(e) => {

                            const id =
                                e.target.value;

                            if (!id) {

                                router.push(
                                    "/portalDocente/asistencias"
                                );

                                return;
                            }

                            router.push(
                                `/portalDocente/asistencias?sesion=${id}`
                            );

                        }}
                        style={{
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            width: "100%",
                            maxWidth: "600px",
                            marginBottom: "20px"
                        }}
                    >

                        <option value="">
                            Selecciona una sesión
                        </option>

                        {dashboard?.sesiones.map(
                            (sesion) => (

                                <option
                                    key={
                                        sesion.id_sesion
                                    }
                                    value={
                                        sesion.id_sesion
                                    }
                                >

                                    {formatearFecha(
                                        sesion.fecha
                                    )}

                                    {" - "}

                                    {sesion.nombre_materia}

                                    {" - Grupo "}

                                    {sesion.numero_grupo}

                                </option>

                            )
                        )}

                    </select>


                    {/* ==========================================
                        INFORMACIÓN DE SESIÓN
                    ========================================== */}

                    {sesionSeleccionada && (

                        <div className="materia-docente-card">

                            <div className="materia-header">

                                <div>

                                    <h2>
                                        {
                                            sesionSeleccionada
                                                .nombre_materia
                                        }
                                    </h2>

                                    <p>
                                        Grupo{" "}
                                        {
                                            sesionSeleccionada
                                                .numero_grupo
                                        }
                                    </p>

                                </div>


                                <span className="estado-activo">

                                    {
                                        sesionSeleccionada
                                            .estado
                                    }

                                </span>

                            </div>


                            <div className="materia-info">

                                <p>
                                    📅{" "}
                                    {
                                        formatearFecha(
                                            sesionSeleccionada
                                                .fecha
                                        )
                                    }
                                </p>

                                <p>
                                    🕐{" "}
                                    {
                                        formatearHora(
                                            sesionSeleccionada
                                                .hora_inicio
                                        )
                                    }

                                    {" - "}

                                    {
                                        formatearHora(
                                            sesionSeleccionada
                                                .hora_fin
                                        )
                                    }
                                </p>

                                <p>
                                    📍 Aula{" "}
                                    {
                                        sesionSeleccionada
                                            .aula
                                    }
                                </p>

                            </div>

                        </div>

                    )}

                </section>


                {/* ==========================================
                    ASISTENCIAS
                ========================================== */}

                {sesionParam && (

                    <section className="docente-section">

                        <div className="section-title">

                            <h2>
                                Estudiantes
                            </h2>

                            <span>
                                {
                                    asistencias.length
                                } registros
                            </span>

                        </div>


                        {cargandoAsistencias ? (

                            <p>
                                Cargando estudiantes...
                            </p>

                        ) : errorAsistencias ? (

                            <div>

                                <p>
                                    {errorAsistencias}
                                </p>

                                <button
                                    onClick={() =>
                                        window.location.reload()
                                    }
                                >
                                    Reintentar
                                </button>

                            </div>

                        ) : asistencias.length === 0 ? (

                            <div className="tabla-container">

                                <p
                                    style={{
                                        padding: "20px"
                                    }}
                                >
                                    No hay registros de
                                    asistencia para esta
                                    sesión.
                                </p>

                            </div>

                        ) : (

                            <div className="tabla-container">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Carnet
                                            </th>

                                            <th>
                                                Estudiante
                                            </th>

                                            <th>
                                                Estado
                                            </th>

                                            <th>
                                                Hora
                                            </th>

                                            <th>
                                                Método
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {asistencias.map(
                                            (asistencia) => (

                                                <tr
                                                    key={
                                                        asistencia
                                                            .id_asistencia
                                                    }
                                                >

                                                    <td>
                                                        {
                                                            asistencia
                                                                .id_estudiante
                                                        }
                                                    </td>

                                                    <td>

                                                        {
                                                            asistencia
                                                                .nombres
                                                        }{" "}

                                                        {
                                                            asistencia
                                                                .apellidos
                                                        }

                                                    </td>

                                                    <td>

                                                        <span
                                                            className={
                                                                claseEstado(
                                                                    asistencia
                                                                        .estado_asistencia
                                                                )
                                                            }
                                                        >

                                                            {
                                                                asistencia
                                                                    .estado_asistencia
                                                            }

                                                        </span>

                                                    </td>

                                                    <td>

                                                        {
                                                            formatearHora(
                                                                asistencia
                                                                    .hora_marca
                                                            )
                                                        }

                                                    </td>

                                                    <td>

                                                        {
                                                            asistencia
                                                                .metodo_registro ||
                                                            "—"
                                                        }

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </section>

                )}


                {/* ==========================================
                    FOOTER
                ========================================== */}

                <footer className="docente-footer">

                    <p>
                        Copyright reservado © 2026
                    </p>

                </footer>

            </main>

        </div>
    );
}