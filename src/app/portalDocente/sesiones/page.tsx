"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import "../../../styles/portalDocente.css";

interface Sesion {
    id_sesion: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    id_grupo: number;
    numero_grupo: string;
    aula: string;
    nombre_materia: string;
    total_asistencias: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    permisos: number;
}

export default function SesionesDocente() {

    const { usuario, cerrarSesion } = useAuth();
    const router = useRouter();

    const [sesiones, setSesiones] = useState<Sesion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // OBTENER SESIONES
    // =====================================================

    useEffect(() => {

        const obtenerSesiones = async () => {

            try {

                setCargando(true);
                setError("");

                console.log("=================================");
                console.log("USUARIO LOGUEADO:", usuario);
                console.log("=================================");

                // Obtener ID del profesor
                const idProfesor =
                    usuario?.id_profesor ||
                    usuario?.id ||
                    usuario?.id_usuario;

                console.log("ID DEL PROFESOR:", idProfesor);

                if (!idProfesor) {

                    setError(
                        "No se encontró el ID del profesor. Cierra sesión e inicia nuevamente."
                    );

                    setCargando(false);

                    return;
                }

                // =====================================================
                // CONSULTAR API
                // =====================================================

                const url =
                    `http://localhost:3001/api/docente/dashboard/${idProfesor}`;

                console.log("CONSULTANDO:", url);

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    cache: "no-store"
                });

                console.log(
                    "STATUS RESPUESTA:",
                    response.status
                );

                const data = await response.json();

                console.log(
                    "RESPUESTA COMPLETA:",
                    data
                );

                // =====================================================
                // VALIDAR RESPUESTA
                // =====================================================

                if (!response.ok) {

                    throw new Error(
                        data?.error ||
                        `Error del servidor: ${response.status}`
                    );
                }

                // =====================================================
                // CARGAR SESIONES
                // =====================================================

                if (Array.isArray(data.sesiones)) {

                    console.log(
                        "SESIONES ENCONTRADAS:",
                        data.sesiones.length
                    );

                    setSesiones(data.sesiones);

                } else {

                    console.log(
                        "La respuesta no contiene un arreglo sesiones"
                    );

                    setSesiones([]);
                }

            } catch (error: any) {

                console.error(
                    "================================="
                );

                console.error(
                    "ERROR AL CARGAR SESIONES:",
                    error
                );

                console.error(
                    "================================="
                );

                setError(
                    error?.message ||
                    "No se pudieron cargar las sesiones."
                );

                setSesiones([]);

            } finally {

                setCargando(false);

            }

        };

        if (usuario) {
            obtenerSesiones();
        }

    }, [usuario]);


    // =====================================================
    // CERRAR SESIÓN
    // =====================================================

    const handleLogout = () => {

        cerrarSesion();

        router.push("/");

    };


    // =====================================================
    // FORMATEAR FECHA
    // =====================================================

    const formatearFecha = (fecha: string) => {

        if (!fecha) {
            return "";
        }

        const partes = fecha
            .substring(0, 10)
            .split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const año = Number(partes[0]);
        const mes = Number(partes[1]) - 1;
        const dia = Number(partes[2]);

        const fechaLocal = new Date(
            año,
            mes,
            dia
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


    // =====================================================
    // FORMATEAR HORA
    // =====================================================

    const formatearHora = (hora: string) => {

        if (!hora) {
            return "";
        }

        return hora.substring(0, 5);

    };


    // =====================================================
    // CLASE DEL ESTADO
    // =====================================================

    const obtenerClaseEstado = (
        estado: string
    ) => {

        if (estado === "Finalizada") {
            return "estado-finalizada";
        }

        if (estado === "Programada") {
            return "estado-programada";
        }

        if (
            estado === "En curso" ||
            estado === "En Curso"
        ) {
            return "estado-en-curso";
        }

        return "estado-programada";

    };


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (

        <div className="docente-container">

            {/* =================================================
                SIDEBAR
            ================================================= */}

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
                        className="menu-item active"
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
                        className="menu-item"
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


                {/* =================================================
                    USUARIO
                ================================================= */}

                <div className="sidebar-user">

                    <div className="user-circle">

                        {usuario?.nombres
                            ? usuario.nombres
                                .charAt(0)
                                .toUpperCase()
                            : "P"}

                    </div>


                    <div>

                        <strong>

                            {usuario?.nombres ||
                                "Profesor"}{" "}

                            {usuario?.apellidos ||
                                ""}

                        </strong>

                        <p>
                            Profesor
                        </p>

                    </div>

                </div>

            </aside>


            {/* =================================================
                CONTENIDO PRINCIPAL
            ================================================= */}

            <main className="docente-main">

                {/* HEADER */}

                <header className="docente-header">

                    <h1>

                        Portal Docente /{" "}

                        <span>
                            Sesiones
                        </span>

                    </h1>

                </header>


                {/* =================================================
                    TITULO
                ================================================= */}

                <section className="docente-bienvenida">

                    <h1>
                        Sesiones
                    </h1>

                    <p>
                        Consulta las sesiones de tus
                        materias y el registro de asistencia.
                    </p>

                </section>


                {/* =================================================
                    SESIONES
                ================================================= */}

                <section className="docente-section">

                    <div className="section-title">

                        <div>

                            <h2>
                                Sesiones registradas
                            </h2>

                            <p>
                                Historial de sesiones de tus grupos
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        CARGANDO
                    ================================================= */}

                    {cargando && (

                        <div className="tabla-container">

                            <p
                                style={{
                                    padding: "30px",
                                    textAlign: "center"
                                }}
                            >
                                Cargando sesiones...
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {!cargando && error && (

                        <div className="tabla-container">

                            <p
                                style={{
                                    padding: "30px",
                                    textAlign: "center",
                                    color: "red"
                                }}
                            >
                                {error}
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        SIN SESIONES
                    ================================================= */}

                    {!cargando &&
                        !error &&
                        sesiones.length === 0 && (

                            <div className="tabla-container">

                                <p
                                    style={{
                                        padding: "30px",
                                        textAlign: "center"
                                    }}
                                >
                                    No hay sesiones registradas.
                                </p>

                            </div>

                        )}


                    {/* =================================================
                        TABLA
                    ================================================= */}

                    {!cargando &&
                        !error &&
                        sesiones.length > 0 && (

                            <div className="tabla-container">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>
                                                Fecha
                                            </th>

                                            <th>
                                                Materia
                                            </th>

                                            <th>
                                                Grupo
                                            </th>

                                            <th>
                                                Horario
                                            </th>

                                            <th>
                                                Aula
                                            </th>

                                            <th>
                                                Estado
                                            </th>

                                            <th>
                                                Asistencias
                                            </th>

                                            <th>
                                                Acción
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {sesiones.map(
                                            (sesion) => (

                                                <tr
                                                    key={
                                                        sesion.id_sesion
                                                    }
                                                >

                                                    {/* FECHA */}

                                                    <td>

                                                        {formatearFecha(
                                                            sesion.fecha
                                                        )}

                                                    </td>


                                                    {/* MATERIA */}

                                                    <td>

                                                        <strong>

                                                            {
                                                                sesion.nombre_materia
                                                            }

                                                        </strong>

                                                    </td>


                                                    {/* GRUPO */}

                                                    <td>

                                                        {
                                                            sesion.numero_grupo
                                                        }

                                                    </td>


                                                    {/* HORARIO */}

                                                    <td>

                                                        {
                                                            formatearHora(
                                                                sesion.hora_inicio
                                                            )
                                                        }

                                                        {" - "}

                                                        {
                                                            formatearHora(
                                                                sesion.hora_fin
                                                            )
                                                        }

                                                    </td>


                                                    {/* AULA */}

                                                    <td>

                                                        {
                                                            sesion.aula
                                                        }

                                                    </td>


                                                    {/* ESTADO */}

                                                    <td>

                                                        <span
                                                            className={
                                                                obtenerClaseEstado(
                                                                    sesion.estado
                                                                )
                                                            }
                                                        >

                                                            {
                                                                sesion.estado
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* ASISTENCIAS */}

                                                    <td>

                                                        <strong>

                                                            {
                                                                Number(
                                                                    sesion.total_asistencias ||
                                                                    0
                                                                )
                                                            }

                                                        </strong>

                                                        <br />

                                                        <small>

                                                            Presentes:{" "}

                                                            {
                                                                Number(
                                                                    sesion.presentes ||
                                                                    0
                                                                )
                                                            }

                                                        </small>

                                                    </td>


                                                    {/* ACCIÓN */}

                                                    <td>

                                                        <button
                                                            className="btn-ver"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/portalDocente/asistencias?sesion=${sesion.id_sesion}`
                                                                )
                                                            }
                                                        >
                                                            Ver asistencia
                                                        </button>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                </section>


                {/* =================================================
                    RESUMEN
                ================================================= */}

                {!cargando &&
                    !error &&
                    sesiones.length > 0 && (

                        <section className="docente-resumen">

                            {/* TOTAL */}

                            <div className="docente-card">

                                <h3>
                                    Total de sesiones
                                </h3>

                                <strong>
                                    {sesiones.length}
                                </strong>

                                <p>
                                    Sesiones registradas
                                </p>

                            </div>


                            {/* FINALIZADAS */}

                            <div className="docente-card">

                                <h3>
                                    Finalizadas
                                </h3>

                                <strong>

                                    {
                                        sesiones.filter(
                                            (s) =>
                                                s.estado ===
                                                "Finalizada"
                                        ).length
                                    }

                                </strong>

                                <p>
                                    Sesiones completadas
                                </p>

                            </div>


                            {/* PROGRAMADAS */}

                            <div className="docente-card">

                                <h3>
                                    Programadas
                                </h3>

                                <strong>

                                    {
                                        sesiones.filter(
                                            (s) =>
                                                s.estado ===
                                                "Programada"
                                        ).length
                                    }

                                </strong>

                                <p>
                                    Sesiones pendientes
                                </p>

                            </div>


                            {/* ASISTENCIAS */}

                            <div className="docente-card">

                                <h3>
                                    Registros de asistencia
                                </h3>

                                <strong>

                                    {
                                        sesiones.reduce(
                                            (
                                                total,
                                                sesion
                                            ) =>
                                                total +
                                                Number(
                                                    sesion.total_asistencias ||
                                                    0
                                                ),
                                            0
                                        )
                                    }

                                </strong>

                                <p>
                                    Asistencias registradas
                                </p>

                            </div>

                        </section>

                    )}


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="docente-footer">

                    <p>
                        Copyright reservado © 2026
                    </p>

                </footer>

            </main>

        </div>

    );

}