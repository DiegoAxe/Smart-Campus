"use client";

import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import "../../../styles/portalDocente.css";
import { cancelarSesion, finalizarSesion, crearSesion } from "../../../services/api";

interface Sesion {
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
}

interface Grupo {
    id_grupo: string;
    numero_grupo: string;
    ciclo_academico: string;
    aula: string;
    nombre_materia: string;
    estudiantes: number;
}

export default function SesionesDocente() {

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

            // Actualizamos solamente la sesión modificada
            setSesiones((sesionesActuales) =>
                sesionesActuales.map((sesion) =>
                    sesion.id_sesion === id_sesion ? { ...sesion, estado: "Finalizada" } : sesion
                )
            );

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

            // Actualizamos solamente la sesión modificada
            setSesiones((sesionesActuales) =>
                sesionesActuales.map((sesion) =>
                    sesion.id_sesion === id_sesion ? { ...sesion, estado: "Cancelada" } : sesion
                )
            );

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


    const { usuario, cerrarSesion } = useAuth();
    const router = useRouter();

    const [sesiones, setSesiones] = useState<Sesion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    // =====================================================
    // CREAR NUEVA SESIÓN
    // =====================================================

    const handleCrearSesion = async () => {

        // ==========================================
        // OBTENER ID DEL PROFESOR
        // ==========================================

        const idProfesor =
            usuario?.id_profesor ||
            usuario?.id ||
            usuario?.id_usuario;

        if (!idProfesor) {

            await Swal.fire({
                title: "Error",
                text: "No se encontró el ID del profesor.",
                icon: "error"
            });

            return;
        }


        // ==========================================
        // VALIDAR CAMPOS
        // ==========================================

        if (
            !fechaNuevaSesion ||
            !horaInicioNuevaSesion ||
            !horaFinNuevaSesion ||
            !grupoNuevaSesion
        ) {

            await Swal.fire({
                title: "Campos incompletos",
                text: "Debe completar todos los campos para crear la sesión.",
                icon: "warning"
            });

            return;
        }


        // ==========================================
        // VALIDAR HORARIO
        // ==========================================

        if (horaInicioNuevaSesion >= horaFinNuevaSesion) {

            await Swal.fire({
                title: "Horario inválido",
                text: "La hora de inicio debe ser anterior a la hora de finalización.",
                icon: "warning"
            });
            return;
        }

        try {

            setCreandoSesion(true);


            // ==========================================
            // LLAMAR A LA API
            // ==========================================

            const respuesta = await crearSesion({
                id_profesor: String(idProfesor),
                id_grupo: grupoNuevaSesion,
                fecha: fechaNuevaSesion,
                hora_inicio: horaInicioNuevaSesion,
                hora_fin: horaFinNuevaSesion
            });


            // ==========================================
            // AGREGAR SESIÓN A LA TABLA
            // ==========================================

            setSesiones((sesionesActuales) => [
                {
                    ...respuesta.sesion,
                    total_asistencias: 0,
                    presentes: 0,
                    ausentes: 0,
                    tardanzas: 0,
                    permisos: 0
                },
                ...sesionesActuales
            ]);


            // ==========================================
            // LIMPIAR FORMULARIO
            // ==========================================

            setFechaNuevaSesion("");
            setHoraInicioNuevaSesion("");
            setHoraFinNuevaSesion("");
            setGrupoNuevaSesion("");


            // ==========================================
            // MENSAJE DE ÉXITO
            // ==========================================

            await Swal.fire({
                title: "Sesión creada",
                text: "La sesión ha sido programada correctamente.",
                icon: "success",
                confirmButtonColor: "#3085d6"
            });


        } catch (error) {

            console.error(
                "Error al crear sesión:",
                error
            );

            await Swal.fire({
                title: "Error",
                text:
                    error instanceof Error
                        ? error.message
                        : "No se pudo crear la sesión.",
                icon: "error"
            });

        } finally {

            setCreandoSesion(false);

        }
    };

    // =====================================================
    // CREAR SESIÓN
    // =====================================================

    const [grupos, setGrupos] = useState<Grupo[]>([]);

    const [fechaNuevaSesion, setFechaNuevaSesion] = useState("");
    const [horaInicioNuevaSesion, setHoraInicioNuevaSesion] = useState("");
    const [horaFinNuevaSesion, setHoraFinNuevaSesion] = useState("");
    const [grupoNuevaSesion, setGrupoNuevaSesion] = useState("");

    const [creandoSesion, setCreandoSesion] = useState(false);

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

                // =====================================================
                // CARGAR GRUPOS DEL PROFESOR
                // =====================================================

                if (Array.isArray(data.grupos)) {
                    console.log(
                        "GRUPOS ENCONTRADOS:",
                        data.grupos.length
                    );
                    setGrupos(data.grupos);

                } else {
                    console.log(
                        "La respuesta no contiene un arreglo grupos"
                    );
                    setGrupos([]);
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
                        CREAR NUEVA SESIÓN
                    ================================================= */}

                    <section className="docente-section">

                        <div className="section-title">

                            <div>

                                <h2>
                                    Crear nueva sesión
                                </h2>

                                <p>
                                    Programa una nueva sesión para uno de tus grupos.
                                </p>

                            </div>

                        </div>


                        <div
                            style={{
                                background: "#ffffff",
                                borderRadius: "12px",
                                padding: "25px",
                                marginBottom: "30px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                            }}
                        >

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                    gap: "20px"
                                }}
                            >

                                {/* FECHA */}

                                <div>

                                    <label
                                        style={{
                                            display: "block",
                                            fontWeight: "600",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        Fecha
                                    </label>

                                    <input
                                        type="date"
                                        value={fechaNuevaSesion}
                                        onChange={(e) =>
                                            setFechaNuevaSesion(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ccc",
                                            borderRadius: "6px"
                                        }}
                                    />

                                </div>


                                {/* GRUPO */}

                                <div>

                                    <label
                                        style={{
                                            display: "block",
                                            fontWeight: "600",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        Grupo
                                    </label>

                                    <select
                                        value={grupoNuevaSesion}
                                        onChange={(e) =>
                                            setGrupoNuevaSesion(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ccc",
                                            borderRadius: "6px"
                                        }}
                                    >

                                        <option value="">
                                            Seleccione un grupo
                                        </option>

                                        {grupos.map((grupo) => (

                                            <option
                                                key={grupo.id_grupo}
                                                value={grupo.id_grupo}
                                            >

                                                {grupo.nombre_materia}
                                                {" - Grupo "}
                                                {grupo.numero_grupo}
                                                {" - Aula "}
                                                {grupo.aula}

                                            </option>

                                        ))}

                                    </select>

                                </div>


                                {/* HORA INICIO */}

                                <div>

                                    <label
                                        style={{
                                            display: "block",
                                            fontWeight: "600",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        Hora de inicio
                                    </label>

                                    <input
                                        type="time"
                                        value={horaInicioNuevaSesion}
                                        onChange={(e) =>
                                            setHoraInicioNuevaSesion(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ccc",
                                            borderRadius: "6px"
                                        }}
                                    />

                                </div>


                                {/* HORA FIN */}

                                <div>

                                    <label
                                        style={{
                                            display: "block",
                                            fontWeight: "600",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        Hora de finalización
                                    </label>

                                    <input
                                        type="time"
                                        value={horaFinNuevaSesion}
                                        onChange={(e) =>
                                            setHoraFinNuevaSesion(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ccc",
                                            borderRadius: "6px"
                                        }}
                                    />

                                </div>

                            </div>


                            {/* INFORMACIÓN DEL GRUPO */}

                            {grupoNuevaSesion && (

                                <div
                                    style={{
                                        marginTop: "20px",
                                        padding: "15px",
                                        background: "#f5f7fa",
                                        borderRadius: "8px"
                                    }}
                                >

                                    {(() => {

                                        const grupoSeleccionado =
                                            grupos.find(
                                                (grupo) =>
                                                    grupo.id_grupo ===
                                                    grupoNuevaSesion
                                            );

                                        if (!grupoSeleccionado) {
                                            return null;
                                        }

                                        return (

                                            <>

                                                <strong>
                                                    {grupoSeleccionado.nombre_materia}
                                                </strong>

                                                <p
                                                    style={{
                                                        margin: "5px 0 0"
                                                    }}
                                                >
                                                    Grupo:{" "}
                                                    {grupoSeleccionado.numero_grupo}
                                                    {" | "}
                                                    Aula:{" "}
                                                    {grupoSeleccionado.aula}
                                                    {" | "}
                                                    ID:{" "}
                                                    {grupoSeleccionado.id_grupo}
                                                </p>

                                            </>

                                        );

                                    })()}

                                </div>

                            )}


                            {/* BOTÓN */}

                            <div
                                style={{
                                    marginTop: "20px",
                                    display: "flex",
                                    justifyContent: "flex-end"
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={handleCrearSesion}
                                    disabled={
                                        creandoSesion ||
                                        grupos.length === 0
                                    }
                                    style={{
                                        padding: "11px 22px",
                                        border: "none",
                                        borderRadius: "7px",
                                        background: "#3085d6",
                                        color: "#ffffff",
                                        fontWeight: "600",
                                        cursor:
                                            creandoSesion ||
                                            grupos.length === 0
                                                ? "not-allowed"
                                                : "pointer",
                                        opacity:
                                            creandoSesion ||
                                            grupos.length === 0
                                                ? 0.6
                                                : 1
                                    }}
                                >

                                    {creandoSesion
                                        ? "Creando sesión..."
                                        : "Crear sesión"}

                                </button>

                            </div>


                            {/* SIN GRUPOS */}

                            {grupos.length === 0 && !cargando && (

                                <p
                                    style={{
                                        marginTop: "15px",
                                        color: "#666"
                                    }}
                                >
                                    No tienes grupos disponibles para crear una sesión.
                                </p>

                            )}

                        </div>

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