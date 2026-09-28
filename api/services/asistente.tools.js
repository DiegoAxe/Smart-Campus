const db = require('../db');

const obtenerMisGrupos = async (idProfesor) => {
    const [filas] = await db.query(
        `
        SELECT
            g.id_grupo,
            g.numero_grupo,
            g.ciclo_academico,
            g.aula,
            m.nombre_materia
        FROM grupos g
        INNER JOIN materias m
            ON g.id_materia = m.id_materia
        WHERE g.id_profesor = ?
        `,
        [idProfesor]
    );
    return filas;
};

const obtenerMisSesiones = async (idProfesor) => {
    const [filas] = await db.query(
        `
        SELECT
            s.id_sesion,
            s.id_grupo,
            s.fecha,
            s.hora_inicio,
            s.hora_fin,
            s.estado,
            g.numero_grupo,
            m.nombre_materia
        FROM sesiones s
        INNER JOIN grupos g
            ON s.id_grupo = g.id_grupo
        INNER JOIN materias m
            ON g.id_materia = m.id_materia
        WHERE g.id_profesor = ?
        ORDER BY s.fecha DESC, s.hora_inicio DESC
        `,
        [idProfesor]
    );
    return filas;
};

const obtenerAsistenciasGrupo = async (idProfesor, idGrupo) => {
    // Verificar que el grupo pertenece al profesor
    const [grupo] = await db.query(
        `
        SELECT
            g.id_grupo
        FROM grupos g
        WHERE g.id_grupo = ?
        AND g.id_profesor = ?
        `,
        [idGrupo, idProfesor]
    );

    if (grupo.length === 0) {
        return {
            success: false,
            acceso: false,
            mensaje: "El grupo solicitado no está disponible para el docente actual."
        };
    }

    const [filas] = await db.query(
        `
        SELECT
            a.id_asistencia,
            a.id_sesion,
            a.id_estudiante,
            CONCAT(e.nombres, ' ', e.apellidos) AS estudiante,
            a.estado_asistencia,
            a.hora_marca,
            a.metodo_registro,
            s.fecha,
            s.hora_inicio,
            s.hora_fin,
            g.numero_grupo,
            m.nombre_materia
        FROM asistencias a
        INNER JOIN estudiantes e
            ON a.id_estudiante = e.id_estudiante
        INNER JOIN sesiones s
            ON a.id_sesion = s.id_sesion
        INNER JOIN grupos g
            ON s.id_grupo = g.id_grupo
        INNER JOIN materias m
            ON g.id_materia = m.id_materia
        WHERE g.id_grupo = ?
        AND g.id_profesor = ?
        ORDER BY s.fecha DESC, s.hora_inicio DESC, e.apellidos, e.nombres
        `,
        [idGrupo, idProfesor]
    );

    return {
        success: true,
        acceso: true,
        datos: filas
    };
};

const obtenerEstudiantesGrupo = async (idProfesor, idGrupo) => {
    // Verificar que el grupo pertenece al profesor
    const [grupo] = await db.query(
        `
        SELECT
            g.id_grupo
        FROM grupos g
        WHERE g.id_grupo = ?
        AND g.id_profesor = ?
        `,
        [idGrupo, idProfesor]
    );

    if (grupo.length === 0) {
        return {
            success: false,
            acceso: false,
            mensaje: "El grupo solicitado no está disponible para el docente actual."
        };
    }

    const [filas] = await db.query(
        `
        SELECT
            e.id_estudiante,
            e.nombres,
            e.apellidos,
            e.correo_institucional,
            i.id_inscripcion
        FROM inscripciones i
        INNER JOIN estudiantes e
            ON i.id_estudiante = e.id_estudiante
        WHERE i.id_grupo = ?
        ORDER BY e.apellidos, e.nombres
        `,
        [idGrupo]
    );

    return {
        success: true,
        acceso: true,
        datos: filas
    };
};

module.exports = {
    obtenerMisGrupos,
    obtenerMisSesiones,
    obtenerAsistenciasGrupo,
    obtenerEstudiantesGrupo
};