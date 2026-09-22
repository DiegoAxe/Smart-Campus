const db = require("../db");

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
            FROM Profesores
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

            FROM Grupos g

            INNER JOIN Materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN Inscripciones i
                ON g.id_grupo = i.id_grupo

            LEFT JOIN Sesiones s
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

            FROM Sesiones s

            INNER JOIN Grupos g
                ON s.id_grupo = g.id_grupo

            INNER JOIN Materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN Asistencias a
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

            FROM Grupos g

            LEFT JOIN Inscripciones i
                ON g.id_grupo = i.id_grupo

            LEFT JOIN Sesiones s
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

            FROM Asistencias a

            INNER JOIN Sesiones s
                ON a.id_sesion = s.id_sesion

            INNER JOIN Grupos g
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

            FROM Grupos g

            INNER JOIN Materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN Inscripciones i
                ON g.id_grupo = i.id_grupo

            LEFT JOIN Sesiones s
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

            FROM Sesiones s

            INNER JOIN Grupos g
                ON s.id_grupo = g.id_grupo

            INNER JOIN Materias m
                ON g.id_materia = m.id_materia

            LEFT JOIN Asistencias a
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

            FROM Asistencias a

            INNER JOIN Estudiantes e
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

            FROM Grupos g

            INNER JOIN Materias m
                ON g.id_materia = m.id_materia

            INNER JOIN Sesiones s
                ON g.id_grupo = s.id_grupo

            LEFT JOIN Asistencias a
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
// EXPORTAR FUNCIONES
// ======================================================

module.exports = {

    obtenerDashboardDocente,

    obtenerMateriasDocente,

    obtenerSesionesDocente,

    obtenerAsistenciasSesion,

    obtenerReporteDocente

};