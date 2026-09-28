"use client";

import "../../styles/portalDocente.css";

import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardDocente, preguntarAsistente, cancelarSesion, finalizarSesion } from "../../services/api";


type Grupo = {
    id_grupo: string;
    numero_grupo: string;
    ciclo_academico: string;
    aula: string;
    id_materia: string;
    nombre_materia: string;
    estudiantes: number;
};

type Sesion = {
    id_sesion: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    id_grupo: string;
    numero_grupo: string;
    aula: string;
    nombre_materia: string;
    total_asistencias: number;
    presentes: number;
    ausentes: number;
    tardanzas: number;
    permisos: number;
};

type Dashboard = {
    profesor: {
        id_profesor: string;
        nombres: string;
        apellidos: string;
        correo_institucional: string;
        departamento_facultad: string | null;
    };

    resumen: {
        grupos: number;
        materias: number;
        estudiantes: number;
        sesiones: number;
    };

    estadisticas: {
        total: number;
        presentes: number;
        ausentes: number;
        tardanzas: number;
        permisos: number;
    };

    grupos: Grupo[];
    sesiones: Sesion[];
};

export default function PortalDocente() {

    //// Para que funcione el boton de hacerle una pregunta al asistente IA
    const handlePreguntaAsistente = async () => {
        const preguntaLimpia = pregunta.trim();

        if (!preguntaLimpia) {
            return;
        }

        if (preguntaLimpia.length > 500) {
            Swal.fire({
                title: "Pregunta demasiado larga",
                text: "La pregunta no puede superar los 500 caracteres.",
                icon: "warning",
                confirmButtonColor: "#3085d6"
            });
            return;
        }

        try {
            setCargandoAsistente(true);
            setMostrarRespuesta(false);
            setRespuestaAsistente("");
            const data = await preguntarAsistente(preguntaLimpia);
            setRespuestaAsistente(data.respuesta);
            setMostrarRespuesta(true);

        } catch (error) {
            console.error(
                "Error al consultar asistente:",
                error
            );

            Swal.fire({
                title: "Error",
                text:
                    error instanceof Error
                        ? error.message
                        : "No se pudo obtener una respuesta del asistente.",
                icon: "error",
                confirmButtonColor: "#3085d6"
            });

        } finally {
            setCargandoAsistente(false);
        }
    };

    //// Para que funcione el boton de finalizar una sesion, y marcar inasistencias
    const handleFinalizarSesion = async (id_sesion: number) => {

        const result = await Swal.fire({
            title: "¿Seguro que desea finalizar esta sesión?",
            text: "Esto hara dara por cerrada la sesion, y marcara las inasistencias de los estudiantes faltantes.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, quiero finalizarla.",
            cancelButtonText: "No"
        });

        // El usuario presionó "No"
        if (!result.isConfirmed) {
            return;
        }

        try {
            // El usuario presiono "Si"
            // La api procesa el put
            await finalizarSesion(id_sesion);

            setDashboard((dashboardActual) => {
                if (!dashboardActual) return dashboardActual;

                return {
                    ...dashboardActual,
                    sesiones: dashboardActual.sesiones.map((sesion) =>
                        sesion.id_sesion === id_sesion ? { ...sesion, estado: "Finalizada" } : sesion
                    ),
                };
            });

            // Muestra mensaje de éxito despues de la api
            await Swal.fire({
                title: "Sesión finalizada",
                text: "La sesión ha sido finalizada correctamente.",
                icon: "success",
                confirmButtonColor: "#3085d6"
            });

        } catch (error) {
            Swal.fire({
                title: "Error",
                text:
                    error instanceof Error ? error.message : "Error al finalizar la sesión",
                icon: "error"
            });

        }
    };

    //// Para que funcione el boton de cancelar una sesion
    const handleCancelarSesion = async (id_sesion: number) => {

        const result = await Swal.fire({
            title: "¿Seguro que desea cancelar esta sesión?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, quiero cancelarla.",
            cancelButtonText: "No"
        });

        // El usuario presionó "No"
        if (!result.isConfirmed) {
            return;
        }

        try {

            // El usuario presiono "Si"
            // La api procesa el put
            await cancelarSesion(id_sesion);

            setDashboard((dashboardActual) => {
                if (!dashboardActual) return dashboardActual;

                return {
                    ...dashboardActual,
                    sesiones: dashboardActual.sesiones.map((sesion) =>
                        sesion.id_sesion === id_sesion ? { ...sesion, estado: "Cancelada" } : sesion
                    ),
                };
            });

            // Muestra mensaje de éxito despues de la api
            await Swal.fire({
                title: "Sesión cancelada",
                text: "La sesión ha sido cancelada correctamente.",
                icon: "success",
                confirmButtonColor: "#3085d6"
            });

        } catch (error) {
            Swal.fire({
                title: "Error",
                text:
                    error instanceof Error ? error.message : "Error al cancelar la sesión",
                icon: "error"
            });

        }
    };

    // ==========================================
    // SESIÓN
    // ==========================================

    const { usuario, cerrarSesion } = useAuth();
    const router = useRouter();        

    // ==========================================
    // DASHBOARD
    // ==========================================

    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    //Para el asistente de IA
    const [pregunta, setPregunta] = useState("");
    const [respuestaAsistente, setRespuestaAsistente] = useState("");
    const [cargandoAsistente, setCargandoAsistente] = useState(false);
    const [mostrarRespuesta, setMostrarRespuesta] = useState(false);


    // ==========================================
    // CARGAR DASHBOARD
    // ==========================================

    useEffect(() => {

        if (!usuario) {
            setCargando(false);
            return;
        }

        const idProfesor = usuario.id_usuario ?? usuario.id ?? usuario.id_profesor ?? "";

        if (!idProfesor) {
            setError("No se pudo identificar al docente.");
            setCargando(false);
            return;
        }

        getDashboardDocente(idProfesor)
            .then((data) => {

                console.log("Dashboard docente:", data);

                setDashboard(data);

            })
            .catch((error) => {

                console.error(
                    "Error al cargar dashboard:",
                    error
                );

                setError(
                    "No se pudo cargar la información del docente."
                );

            })
            .finally(() => {

                setCargando(false);

            });

    }, [usuario]);

    // ==========================================
    // FORMATEAR FECHA
    // ==========================================

    const formatearFecha = (fecha: string) => {

        if (!fecha) {
            return "Sin fecha";
        }

        const partes = fecha.split("T")[0].split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const [anio, mes, dia] = partes;

        const fechaLocal = new Date(
            Number(anio),
            Number(mes) - 1,
            Number(dia)
        );

        return fechaLocal.toLocaleDateString("es-SV", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    const handleLogout = () => {

        cerrarSesion();

        localStorage.removeItem("id_profesor");

        router.push("/");

    };

    // ==========================================
    // SIN USUARIO
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
                        Cargando información...
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
                        onClick={() => window.location.reload()}
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

                {/* LOGO */}

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

                {/* MENÚ */}

                <nav className="sidebar-menu">

                    {/* DASHBOARD */}

                    <button
                        type="button"
                        className="menu-item active"
                        onClick={() => router.push("/portalDocente")}
                    >
                        <span>▦</span>
                        Dashboard
                    </button>

                    {/* MATERIAS */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/materias")
                        }
                    >
                        <span>📚</span>
                        Mis Materias
                    </button>

                    {/* ASISTENCIAS */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/asistencias")
                        }
                    >
                        <span>👥</span>
                        Asistencias
                    </button>

                    {/* SESIONES */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/sesiones")
                        }
                    >
                        <span>📅</span>
                        Sesiones
                    </button>

                    {/* REPORTES */}

                    <button
                        type="button"
                        className="menu-item"
                        onClick={() =>
                            router.push("/portalDocente/reportes")
                        }
                    >
                        <span>📊</span>
                        Reportes
                    </button>

                    <div className="link-separador"></div>

                    {/* CERRAR SESIÓN */}

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

                        {(usuario.nombres ?? usuario.nombre ?? "D").charAt(0)}

                    </div>

                    <div>

                        <strong>
                            {(usuario.nombres ?? usuario.nombre ?? "Docente")} {usuario.apellidos}
                        </strong>

                        <p>
                            Profesor
                        </p>

                    </div>

                </div>

            </aside>


            {/* ==========================================
                CONTENIDO PRINCIPAL
            ========================================== */}

            <main className="docente-main">

                {/* HEADER */}

                <header className="docente-header">

                    <h1>
                        Portal Docente /
                        <span> Dashboard</span>
                    </h1>

                </header>


                {/* ==========================================
                    BIENVENIDA
                ========================================== */}

                <section className="docente-bienvenida">

                    <h1>

                        ¡Hola,{" "}

                        {dashboard?.profesor.nombres}{" "}

                        {dashboard?.profesor.apellidos}!

                    </h1>

                    <p>

                        {dashboard?.profesor.correo_institucional}

                        {" • "}

                        {dashboard?.profesor.id_profesor}

                        {" • "}

                        {dashboard?.profesor.departamento_facultad ||
                            "Sin departamento"}

                    </p>

                    <p>
                        Resumen académico de tus clases y asistencias
                    </p>

                </section>

                {/* ==========================================
                    ASISTENTE IA
                ========================================== */}

                <section className="asistente-docente">
                    <div className="asistente-header">

                        <div>
                            <h2>
                                Pregúntale a tu asistente IA
                            </h2>

                            <p>
                                Consulta información sobre tus grupos,
                                estudiantes, sesiones y asistencias.
                            </p>
                        </div>

                        <span className="asistente-icono">
                            ✨
                        </span>
                    </div>

                    <div className="asistente-input-container">
                        <textarea
                            value={pregunta}
                            onChange={(e) => setPregunta(e.target.value)}
                            placeholder="Ejemplo: ¿Cuáles son mis grupos?"
                            maxLength={500}
                            disabled={cargandoAsistente}
                            rows={3}
                        />

                        <div className="asistente-input-footer">
                            <span className="contador-pregunta">
                                {pregunta.length}/500
                            </span>

                            <button
                                type="button"
                                onClick={handlePreguntaAsistente}
                                disabled={
                                    cargandoAsistente ||
                                    pregunta.trim().length === 0
                                }
                            >
                                {cargandoAsistente
                                    ? "Consultando..."
                                    : "Preguntar"}
                            </button>
                        </div>
                    </div>

                    {/* RESPUESTA */}
                    {mostrarRespuesta && (

                        <div className="asistente-respuesta">
                            <div className="respuesta-header">
                                <h3>
                                    Respuesta del asistente
                                </h3>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarRespuesta(false)
                                    }
                                >
                                    Ocultar
                                </button>
                            </div>

                            <p>
                                {respuestaAsistente}
                            </p>
                        </div>
                    )}
                </section>

                
                {/* ==========================================
                    TARJETAS RESUMEN
                ========================================== */}

                <section className="docente-resumen">

                    {/* MATERIAS */}

                    <div className="docente-card">

                        <h3>
                            Materias Asignadas
                        </h3>

                        <strong>
                            {dashboard?.resumen.materias ?? 0}
                        </strong>

                        <p>
                            Materias en el ciclo actual
                        </p>

                    </div>


                    {/* GRUPOS */}

                    <div className="docente-card">

                        <h3>
                            Grupos Activos
                        </h3>

                        <strong>
                            {dashboard?.resumen.grupos ?? 0}
                        </strong>

                        <p>
                            Grupos asignados
                        </p>

                    </div>


                    {/* SESIONES */}

                    <div className="docente-card">

                        <h3>
                            Sesiones Realizadas
                        </h3>

                        <strong>
                            {dashboard?.resumen.sesiones ?? 0}
                        </strong>

                        <p>
                            Sesiones registradas
                        </p>

                    </div>


                    {/* ESTUDIANTES */}

                    <div className="docente-card">

                        <h3>
                            Estudiantes
                        </h3>

                        <strong>
                            {dashboard?.resumen.estudiantes ?? 0}
                        </strong>

                        <p>
                            Estudiantes registrados
                        </p>

                    </div>

                </section>


                {/* ==========================================
                    MIS MATERIAS
                ========================================== */}

                <section className="docente-section">

                    <div className="section-title">

                        <h2>
                            Mis Materias
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/portalDocente/materias")
                            }
                        >
                            Ver todas
                        </button>

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
                                            📍 Aula {grupo.aula}
                                        </p>

                                        <p>
                                            👨‍🎓 {grupo.estudiantes} estudiantes
                                        </p>

                                        <p>
                                            📅 Ciclo {grupo.ciclo_academico}
                                        </p>

                                    </div>


                                    <div className="materia-footer">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push(
                                                    "/portalDocente/asistencias"
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


                {/* ==========================================
                    SESIONES RECIENTES
                ========================================== */}

                <section className="docente-section">

                    <div className="section-title">

                        <h2>
                            Sesiones Recientes
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                router.push("/portalDocente/sesiones")
                            }
                        >
                            Ver historial
                        </button>

                    </div>


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
                                        Aula
                                    </th>

                                    <th>
                                        Estado
                                    </th>

                                    <th>
                                        Acción
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {dashboard?.sesiones.length === 0 ? (

                                    <tr>

                                        <td colSpan={6}>
                                            No hay sesiones registradas.
                                        </td>

                                    </tr>

                                ) : (

                                    dashboard?.sesiones.map((sesion) => (

                                        <tr
                                            key={sesion.id_sesion}
                                        >

                                            <td>
                                                {formatearFecha(
                                                    sesion.fecha
                                                )}
                                            </td>

                                            <td>
                                                {sesion.nombre_materia}
                                            </td>

                                            <td>
                                                {sesion.numero_grupo}
                                            </td>

                                            <td>
                                                {sesion.aula}
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        sesion.estado ===
                                                            "Finalizada"
                                                            ? "estado-finalizada"
                                                            : sesion.estado ===
                                                                "Cancelada"
                                                                ? "estado-cancelada"
                                                                : "estado-programada"
                                                    }
                                                >

                                                    {sesion.estado}

                                                </span>

                                            </td>

                                                    {/* ACCIÓN */}

                                                    <td className="acciones-sesion">
                                                        {/* Boton para finalizar una sesion programada */
                                                        sesion.estado == "Programada" ? (
                                                            <button
                                                                className="btn-finalizar"
                                                                onClick={() => handleFinalizarSesion(sesion.id_sesion)}
                                                            >
                                                                Finalizar sesión
                                                            </button>
                                                        ) : null }


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

                                                        {/* Boton para cancelar una sesion programada */
                                                        sesion.estado == "Programada" ? (
                                                            <button
                                                                className="btn-cancelar"
                                                                onClick={() => handleCancelarSesion(sesion.id_sesion)}
                                                            >
                                                                Cancelar sesión
                                                            </button>
                                                        ) : null }

                                                    </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


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