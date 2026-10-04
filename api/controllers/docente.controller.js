const db = require("../db");

// ======================================================
// CREAR SESION
// ======================================================


const crearSesion = async (req, res) => {
    try {

        const {
            id_profesor,
            id_grupo,
            fecha,
            hora_inicio,
            hora_fin
        } = req.body;

        // ==========================================
        // VALIDAR DATOS
        // ==========================================

        if (
            !id_profesor ||
            !id_grupo ||
            !fecha ||
            !hora_inicio ||
            !hora_fin
        ) {
            return res.status(400).json({
                success: false,
                mensaje: "Todos los campos son obligatorios."
            });
        }

        // ==========================================
        // VALIDAR HORARIO
        // ==========================================

        if (hora_inicio >= hora_fin) {
            return res.status(400).json({
                success: false,
                mensaje: "La hora de inicio debe ser anterior a la hora de finalización."
            });
        }

        // ==========================================
        // VERIFICAR QUE EL GRUPO PERTENEZCA
        // AL PROFESOR
        // ==========================================

        const [grupos] = await db.query(
            `
            SELECT
                g.id_grupo,
                g.id_profesor,
                g.numero_grupo,
                g.aula,
                m.nombre_materia
            FROM grupos g
            INNER JOIN materias m
                ON g.id_materia = m.id_materia
            WHERE g.id_grupo = ?
              AND g.id_profesor = ?
            `,
            [id_grupo, id_profesor]
        );

        if (grupos.length === 0) {
            return res.status(403).json({
                success: false,
                mensaje: "El grupo seleccionado no pertenece a este profesor."
            });
        }

        // ==========================================
        // CREAR SESIÓN
        // ==========================================

        const [resultado] = await db.query(
            `
            INSERT INTO sesiones (
                id_grupo,
                fecha,
                hora_inicio,
                hora_fin,
                estado
            )
            VALUES (?, ?, ?, ?, 'Programada')
            `,
            [
                id_grupo,
                fecha,
                hora_inicio,
                hora_fin
            ]
        );

        // ==========================================
        // RESPUESTA
        // ==========================================

        return res.status(201).json({
            success: true,
            mensaje: "Sesión creada correctamente.",
            id_sesion: resultado.insertId,
            sesion: {
                id_sesion: resultado.insertId,
                id_grupo: grupos[0].id_grupo,
                numero_grupo: grupos[0].numero_grupo,
                nombre_materia: grupos[0].nombre_materia,
                aula: grupos[0].aula,
                fecha,
                hora_inicio,
                hora_fin,
                estado: "Programada"
            }
        });

    } catch (error) {

        console.error(
            "Error al crear sesión:",
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: "No se pudo crear la sesión."
        });
    }
};

// ======================================================
// DASHBOARD DEL DOCENTE
// ======================================================

const obtenerDashboardDocente = async (req, res) => {
    const { id_profesor } = req.params;

    if (!id_profesor) {
        return res.status(400).json({
            error: "Se requiere el id_profesor"
        });
    }

    try {

        // ==================================================
        // 1. INFORMACIÓN DEL PROFESOR
        // ==================================================

        const [profesores] = await db.query(`
            SELECT
                id_profesor,
                nombres,
                apellidos,
                correo_institucional,
                departamento_facultad
            FROM profesores
            WHERE id_profesor = ?
        `, [id_profesor]);

        if (profesores.length === 0) {
            return res.status(404).json({
                error: "El profesor no existe"
            });
        }

        const profesor = profesores[0];


        // ==================================================
        // 2. MATERIAS / GRUPOS DEL PROFESOR
        // ==================================================

        const [grupos] = await db.query(`
            SELECT
                g.id_grupo,
                g.numero_grupo,
                g.ciclo_academico,
                g.aula,

                m.id_materia,
                m.nombre_materia,

                COUNT(DISTINCT i.id_estudiante) AS estudiantes,

                COUNT(DISTINCT s.id_sesion) AS sesiones

            FROM grupos g

            INNER JOIN materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN inscripciones i
                ON g.id_grupo = i.id_grupo

            LEFT JOIN sesiones s
                ON g.id_grupo = s.id_grupo

            WHERE g.id_profesor = ?

            GROUP BY
                g.id_grupo,
                g.numero_grupo,
                g.ciclo_academico,
                g.aula,
                m.id_materia,
                m.nombre_materia

            ORDER BY g.id_grupo
        `, [id_profesor]);


        // ==================================================
        // 3. SESIONES DEL PROFESOR
        // ==================================================

        const [sesiones] = await db.query(`
            SELECT
                s.id_sesion,
                s.fecha,
                s.hora_inicio,
                s.hora_fin,
                s.estado,

                g.id_grupo,
                g.numero_grupo,
                g.aula,

                m.id_materia,
                m.nombre_materia,

                COUNT(a.id_asistencia) AS total_asistencias,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Presente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS presentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Ausente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS ausentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia IN ('Llegada Tarde', 'Tardanza')
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS tardanzas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Permiso'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS permisos

            FROM sesiones s

            INNER JOIN grupos g
                ON s.id_grupo = g.id_grupo

            INNER JOIN materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN asistencias a
                ON s.id_sesion = a.id_sesion

            WHERE g.id_profesor = ?

            GROUP BY
                s.id_sesion,
                s.fecha,
                s.hora_inicio,
                s.hora_fin,
                s.estado,
                g.id_grupo,
                g.numero_grupo,
                g.aula,
                m.id_materia,
                m.nombre_materia

            ORDER BY
                s.fecha DESC,
                s.hora_inicio DESC

            LIMIT 10
        `, [id_profesor]);


        // ==================================================
        // 4. RESUMEN GENERAL
        // ==================================================

        const [resumen] = await db.query(`
            SELECT

                COUNT(DISTINCT g.id_grupo) AS grupos,

                COUNT(DISTINCT g.id_materia) AS materias,

                COUNT(DISTINCT i.id_estudiante) AS estudiantes,

                COUNT(DISTINCT s.id_sesion) AS sesiones

            FROM grupos g

            LEFT JOIN inscripciones i
                ON g.id_grupo = i.id_grupo

            LEFT JOIN sesiones s
                ON g.id_grupo = s.id_grupo

            WHERE g.id_profesor = ?
        `, [id_profesor]);


        // ==================================================
        // 5. ESTADÍSTICAS DE ASISTENCIA
        // ==================================================

        const [estadisticas] = await db.query(`
            SELECT

                COUNT(a.id_asistencia) AS total,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Presente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS presentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Ausente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS ausentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia IN ('Llegada Tarde', 'Tardanza')
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS tardanzas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Permiso'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS permisos

            FROM asistencias a

            INNER JOIN sesiones s
                ON a.id_sesion = s.id_sesion

            INNER JOIN grupos g
                ON s.id_grupo = g.id_grupo

            WHERE g.id_profesor = ?
        `, [id_profesor]);


        // ==================================================
        // RESPUESTA
        // ==================================================

        return res.json({
            profesor: profesor,
            resumen: resumen[0],
            estadisticas: estadisticas[0],
            grupos: grupos,
            sesiones: sesiones
        });

    } catch (error) {

        console.error(
            "Error al obtener dashboard del docente:",
            error
        );

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};


// ======================================================
// OBTENER MATERIAS DEL DOCENTE
// ======================================================

const obtenerMateriasDocente = async (req, res) => {

    const { id_profesor } = req.params;

    if (!id_profesor) {
        return res.status(400).json({
            error: "Se requiere el id_profesor"
        });
    }

    try {

        const [materias] = await db.query(`
            SELECT

                g.id_grupo,
                g.numero_grupo,
                g.ciclo_academico,
                g.aula,

                m.id_materia,
                m.nombre_materia,

                COUNT(DISTINCT i.id_estudiante) AS estudiantes,

                COUNT(DISTINCT s.id_sesion) AS sesiones

            FROM grupos g

            INNER JOIN materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN inscripciones i
                ON g.id_grupo = i.id_grupo

            LEFT JOIN sesiones s
                ON g.id_grupo = s.id_grupo

            WHERE g.id_profesor = ?

            GROUP BY

                g.id_grupo,
                g.numero_grupo,
                g.ciclo_academico,
                g.aula,

                m.id_materia,
                m.nombre_materia

            ORDER BY
                m.nombre_materia
        `, [id_profesor]);


        return res.json(materias);

    } catch (error) {

        console.error(
            "Error al obtener materias del docente:",
            error
        );

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};


// ======================================================
// OBTENER SESIONES DEL DOCENTE
// ======================================================

const obtenerSesionesDocente = async (req, res) => {

    const { id_profesor } = req.params;

    if (!id_profesor) {
        return res.status(400).json({
            error: "Se requiere el id_profesor"
        });
    }

    try {

        const [sesiones] = await db.query(`
            SELECT

                s.id_sesion,
                s.fecha,
                s.hora_inicio,
                s.hora_fin,
                s.estado,

                g.id_grupo,
                g.numero_grupo,
                g.aula,

                m.id_materia,
                m.nombre_materia,

                COUNT(a.id_asistencia) AS total_asistencias,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Presente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS presentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Ausente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS ausentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia IN ('Llegada Tarde', 'Tardanza')
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS tardanzas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Permiso'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS permisos

            FROM sesiones s

            INNER JOIN grupos g
                ON s.id_grupo = g.id_grupo

            INNER JOIN materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN asistencias a
                ON s.id_sesion = a.id_sesion

            WHERE g.id_profesor = ?

            GROUP BY

                s.id_sesion,
                s.fecha,
                s.hora_inicio,
                s.hora_fin,
                s.estado,

                g.id_grupo,
                g.numero_grupo,
                g.aula,

                m.id_materia,
                m.nombre_materia

            ORDER BY
                s.fecha DESC,
                s.hora_inicio DESC
        `, [id_profesor]);


        return res.json(sesiones);

    } catch (error) {

        console.error(
            "Error al obtener sesiones del docente:",
            error
        );

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};


// ======================================================
// OBTENER ASISTENCIAS DE UNA SESIÓN
// ======================================================

const obtenerAsistenciasSesion = async (req, res) => {

    const { id_sesion } = req.params;

    if (!id_sesion) {
        return res.status(400).json({
            error: "Se requiere el id_sesion"
        });
    }

    try {

        const [asistencias] = await db.query(`
            SELECT

                a.id_asistencia,

                a.estado_asistencia,

                e.id_estudiante,

                e.nombres,

                e.apellidos,

                e.correo_institucional

            FROM asistencias a

            INNER JOIN estudiantes e
                ON a.id_estudiante = e.id_estudiante

            WHERE a.id_sesion = ?

            ORDER BY
                e.apellidos,
                e.nombres
        `, [id_sesion]);


        return res.json(asistencias);

    } catch (error) {

        console.error(
            "Error al obtener asistencias:",
            error
        );

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};


// ======================================================
// OBTENER REPORTE DEL DOCENTE
// ======================================================

const obtenerReporteDocente = async (req, res) => {

    const { id_profesor } = req.params;

    if (!id_profesor) {
        return res.status(400).json({
            error: "Se requiere el id_profesor"
        });
    }

    try {

        const [reporte] = await db.query(`
            SELECT

                m.id_materia,
                m.nombre_materia,

                g.id_grupo,
                g.numero_grupo,

                COUNT(a.id_asistencia) AS total,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Presente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS presentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Ausente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS ausentes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia IN ('Llegada Tarde', 'Tardanza')
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS tardanzas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.estado_asistencia = 'Permiso'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS permisos

            FROM grupos g

            INNER JOIN materias m
                ON g.id_materia = m.id_materia

            INNER JOIN sesiones s
                ON g.id_grupo = s.id_grupo

            LEFT JOIN asistencias a
                ON s.id_sesion = a.id_sesion

            WHERE g.id_profesor = ?

            GROUP BY

                m.id_materia,
                m.nombre_materia,

                g.id_grupo,
                g.numero_grupo

            ORDER BY
                m.nombre_materia
        `, [id_profesor]);


        return res.json(reporte);

    } catch (error) {

        console.error(
            "Error al obtener reporte del docente:",
            error
        );

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
};



// ======================================================
// CANCELAR UNA SESION
// ======================================================

const cancelarSesion = async (req, res) => {
    const { id_sesion } = req.params;

     try {
        // Verificar que la sesión exista
        const [sesiones] = await db.query(
            `SELECT id_sesion, estado
             FROM sesiones
             WHERE id_sesion = ?`,
            [id_sesion]
        );

        if (sesiones.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: "La sesión no existe"
            });
        }

        const sesion = sesiones[0];

        // Solo se pueden cancelar sesiones programadas
        if (sesion.estado !== "Programada") {
            return res.status(400).json({
                success: false,
                mensaje: "Solo se pueden cancelar sesiones con estado Programada"
            });
        }

        // Cambiar estado
        await db.query(
            `UPDATE sesiones
             SET estado = 'Cancelada'
             WHERE id_sesion = ?`,
            [id_sesion]
        );

        return res.status(200).json({
            success: true,
            mensaje: "Sesión cancelada correctamente"
        });

    } catch (error) {

        console.error("Error al cancelar sesión:", error);

        return res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor"
        });
    }
};


// ======================================================
// FINALIZAR UNA SESION
// ======================================================


const finalizarSesion = async (req, res) => {
    const { id_sesion } = req.params;
    let connection;

    try {

        // Realizaremos una serie de comprobaciones, para que la transaccion funcione bien
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1- BUSCAR LA SESIÓN

        const [sesiones] = await connection.query(
            `SELECT id_sesion, id_grupo, estado
             FROM sesiones
             WHERE id_sesion = ?`,
            [id_sesion]
        );

        if (sesiones.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                mensaje: "La sesión no existe"
            });
        }

        const sesion = sesiones[0];

        // 2- COMPROBAR QUE SU ESTADO SEA PROGRAMADA

        if (sesion.estado !== "Programada") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                mensaje:
                    "Solo se pueden finalizar sesiones con estado Programada"
            });
        }

        // 3- OBTENER ESTUDIANTES SIN ASISTENCIA

        const [estudiantes] = await connection.query(
            `SELECT i.id_estudiante
             FROM inscripciones i
             WHERE i.id_grupo = ?
             AND NOT EXISTS (
                 SELECT 1
                 FROM asistencias a
                 WHERE a.id_sesion = ?
                 AND a.id_estudiante = i.id_estudiante
             )`,
            [
                sesion.id_grupo,
                id_sesion
            ]
        );

        // 4- REGISTRAR AUSENCIAS

        for (const estudiante of estudiantes) {
            await connection.query(
                `INSERT INTO asistencias
                    (
                        id_sesion,
                        id_estudiante,
                        estado_asistencia,
                        metodo_registro, hora_marca
                    )
                 VALUES (?, ?, 'Ausente', 'Sistema', null)`,
                [
                    id_sesion,
                    estudiante.id_estudiante
                ]
            );
        }

        // 5- CAMBIAR SESIÓN A FINALIZADA

        await connection.query(
            `UPDATE sesiones
             SET estado = 'Finalizada'
             WHERE id_sesion = ?`,
            [id_sesion]
        );

        // 6- CONFIRMAR TRANSACCIÓN
        await connection.commit();

        return res.status(200).json({
            success: true,
            mensaje: "Sesión finalizada correctamente",
            ausencias_registradas: estudiantes.length
        });

    } catch (error) {
        // Si ocurrió algún error, deshacer todo
        if (connection) {
            await connection.rollback();
        }
        console.error(
            "Error al finalizar sesión:",
            error
        );
        return res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor"
        });
    } finally {
        // Liberar conexión
        if (connection) {
            connection.release();
        }
    }
};


// ======================================================
// EXPORTAR FUNCIONES
// ======================================================

module.exports = {
    obtenerDashboardDocente,
    obtenerMateriasDocente,
    obtenerSesionesDocente,
    obtenerAsistenciasSesion,
    obtenerReporteDocente,
    cancelarSesion,
    finalizarSesion,
    crearSesion
};