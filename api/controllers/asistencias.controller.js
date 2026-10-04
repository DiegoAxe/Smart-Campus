const db = require('../db');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

// 1. Registrar asistencia mediante QR
const registrarAsistencia = async (req, res) => {
  const { id_sesion, id_estudiante } = req.body;

  // Verificar datos obligatorios
  if (!id_sesion || !id_estudiante) {
    return res.status(400).json({
      error: 'Se requieren el id_sesion y el id_estudiante'
    });
  }

  try {
    // ==========================================
    // 1. Buscar la sesión
    // ==========================================
    const [sesiones] = await db.query(
      `
      SELECT
        s.id_sesion,
        s.id_grupo,
        s.fecha,
        s.hora_inicio,
        s.hora_fin,
        s.estado
      FROM sesiones s
      WHERE s.id_sesion = ?
      `,
      [id_sesion]
    );

    // La sesión no existe
    if (sesiones.length === 0) {
      return res.status(404).json({
        error: 'Sesion finalizada o inexistente. Sea mas puntual la proxima vez'
      });
    }

    const sesion = sesiones[0];

    // ==========================================
    // 2. Verificar estado de la sesión
    // ==========================================
    if (
      sesion.estado === 'Finalizada' ||
      sesion.estado === 'Cancelada'
    ) {
      return res.status(400).json({
        error: 'Sesion finalizada o inexistente. Sea mas puntual la proxima vez'
      });
    }

    // ==========================================
    // 3. Verificar que el estudiante exista
    // ==========================================
    const [estudiantes] = await db.query(
      `
      SELECT id_estudiante
      FROM estudiantes
      WHERE id_estudiante = ?
      `,
      [id_estudiante]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({
        error: 'El estudiante ingresado no existe en la base de datos'
      });
    }

    // ==========================================
    // 4. Verificar inscripción al grupo
    // ==========================================
    const [inscripcion] = await db.query(
      `
      SELECT 1
      FROM inscripciones
      WHERE id_estudiante = ?
        AND id_grupo = ?
      `,
      [id_estudiante, sesion.id_grupo]
    );

    if (inscripcion.length === 0) {
      return res.status(400).json({
        error: 'El estudiante no está inscrito en este grupo'
      });
    }

    // ==========================================
    // 5. Verificar si ya registró asistencia
    // ==========================================
    const [asistenciaExistente] = await db.query(
      `
      SELECT id_asistencia
      FROM asistencias
      WHERE id_sesion = ?
        AND id_estudiante = ?
      `,
      [id_sesion, id_estudiante]
    );

    if (asistenciaExistente.length > 0) {
      return res.status(409).json({
        error: 'El estudiante ya tiene asistencia registrada en esta sesión'
      });
    }

    // ==========================================
    // 6. Obtener fecha y hora actual de El Salvador
    // ==========================================

    const ahora = new Date();

    const partesHoraSV = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/El_Salvador',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(ahora);

    const obtenerParte = (tipo) =>
      partesHoraSV.find((parte) => parte.type === tipo)?.value;

    const anioSV = obtenerParte('year');
    const mesSV = obtenerParte('month');
    const diaSV = obtenerParte('day');
    const horaSV = obtenerParte('hour');
    const minutoSV = obtenerParte('minute');
    const segundoSV = obtenerParte('second');

    const fechaActual = `${anioSV}-${mesSV}-${diaSV}`;

    const horaActual = `${horaSV}:${minutoSV}:${segundoSV}`;

    // ==========================================
    // 7. Obtener la fecha de la sesión
    // ==========================================

    // MySQL normalmente devuelve DATE como string:
    // YYYY-MM-DD
    const fechaSesion =
      sesion.fecha instanceof Date
        ? new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/El_Salvador',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(sesion.fecha)
        : String(sesion.fecha).split('T')[0];

    // Verificar que la sesión corresponda al día actual
    if (fechaActual !== fechaSesion) {
      return res.status(400).json({
        error: 'Sesion finalizada o inexistente. Sea mas puntual la proxima vez'
      });
    }

    // ==========================================
    // 8. Convertir las horas de la sesión
    //    a segundos para hacer las comparaciones
    // ==========================================

    const convertirHoraASegundos = (hora) => {
      const [horas, minutos, segundos = 0] =
        String(hora).split(':').map(Number);

      return (
        horas * 3600 +
        minutos * 60 +
        segundos
      );
    };

    const segundosActual = convertirHoraASegundos(horaActual);
    const segundosInicio = convertirHoraASegundos(sesion.hora_inicio);
    const segundosFin = convertirHoraASegundos(sesion.hora_fin);

    // ==========================================
    // 9. Calcular límite para estar "Presente"
    // ==========================================

    // 15 minutos después de la hora de inicio
    const limitePresente = segundosInicio + (15 * 60);

    // ==========================================
    // 10. Determinar estado de asistencia
    // ==========================================

    let estadoAsistencia;

    if (
      segundosActual >= segundosInicio &&
      segundosActual <= limitePresente
    ) {
      // Desde la hora de inicio hasta 15 minutos después
      estadoAsistencia = 'Presente';

    } else if (
      segundosActual > limitePresente &&
      segundosActual < segundosFin
    ) {
      // Después de los 15 minutos pero antes de finalizar
      estadoAsistencia = 'Tardanza';

    } else {
      // Antes de iniciar o después de finalizar
      return res.status(400).json({
        error: 'Sesion finalizada o inexistente. Sea mas puntual la proxima vez'
      });
    }

    // ==========================================
    // 11. Registrar asistencia
    // ==========================================

    // Se envía explícitamente la fecha y hora de
    // El Salvador en lugar de utilizar NOW().
    const fechaHoraMarca = `${fechaActual} ${horaActual}`;

    const queryInsert = `
      INSERT INTO asistencias (
        id_sesion,
        id_estudiante,
        estado_asistencia,
        hora_marca,
        metodo_registro
      )
      VALUES (?, ?, ?, ?, 'QR')
    `;

    await db.query(queryInsert, [
      id_sesion,
      id_estudiante,
      estadoAsistencia,
      fechaHoraMarca
    ]);

    // ==========================================
    // 12. Respuesta
    // ==========================================

    return res.status(201).json({
      mensaje: 'Asistencia registrada correctamente',
      datos: {
        id_sesion,
        id_estudiante,
        estado_asistencia: estadoAsistencia,
        metodo_registro: 'QR',
        hora_marca: fechaHoraMarca,
        zona_horaria: 'America/El_Salvador'
      }
    });

  } catch (error) {

    // Registro duplicado
    if (error.errno === 1062) {
      return res.status(409).json({
        error: 'El estudiante ya tiene asistencia registrada en esta sesión'
      });
    }

    // Problema con FK
    if (error.errno === 1452) {
      return res.status(404).json({
        error: 'El estudiante o la sesión ingresada no existe'
      });
    }

    console.error('Error al registrar asistencia:', error);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};
```
// 2. Hacer el proceso de Login de un estudiante o docente, dependiendo si es el carnet o correo institucional
const procesoLogin = async (req, res) => {
  const { texto_correo, contrasena } = req.body;

  // Validación de campos requeridos
  if (!texto_correo || !contrasena) {
    return res.status(400).json({ 
      error: 'Se requieren el carnet/correo y la contraseña' 
    });
  }

  // Dara "true" si contiene un "@"
  const esCorreo = texto_correo.includes("@");
  if (esCorreo == true){
    /////////////////////// Si es el correo institucional
    try {
      // 1. Buscar si es un Docente
      const [profesores] = await db.query(
          `SELECT id_profesor, nombres, apellidos, correo_institucional, departamento_facultad, contraseña
            FROM profesores WHERE correo_institucional = ?`,
            [texto_correo]    );

            if (profesores.length > 0) {
              const profesor = profesores[0];
              const contraCorrecta = await argon2.verify( profesor.contraseña, contrasena );

              if( !contraCorrecta){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
                });
              }

              const token = jwt.sign(
                {
                    id: profesor.id_profesor,
                    rol: "Docente"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "8h"
                }
              );

              return res.json({
                  success: true,
                  token,
                  usuario: {
                      id: profesor.id_profesor,
                      nombre: profesor.nombres,
                      apellidos: profesor.apellidos,
                      correo_institucionale: profesor.correo_institucional,
                      departamento_facultad: profesor.departamento_facultad,
                      rol: "Docente"
                  }
              });
            }
        
          // 2. Si no existe como profesor, buscar en Estudiantes
          const [estudiantes] = await db.query(
              `SELECT id_estudiante, nombres, apellidos, correo_institucional, contraseña
              FROM estudiantes WHERE correo_institucional = ?`,
            [texto_correo]    );

          if (estudiantes.length > 0) {
              const estudiante = estudiantes[0];
              const contraCorrecta = await argon2.verify( estudiante.contraseña, contrasena );

              if(!contraCorrecta){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              return res.json({
                  success: true,
                  usuario: {
                      id: estudiante.id_estudiante,
                      nombre: estudiante.nombres,
                      apellidos: estudiante.apellidos,
                      correo_institucionale: estudiante.correo_institucional,
                      departamento_facultad: null,
                      rol: "Estudiante"
                  }
              });
          }

        // 3. No existe en ninguna tabla
        return res.status(401).json({
            success: false,
            mensaje: "Usuario no encontrado"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor"
        });
    }

  }else{
    //////////////////////////// Si es el carnet
    try {
      // 1. Buscar si es un Docente
      const [profesores] = await db.query(
          `SELECT id_profesor, nombres, apellidos, correo_institucional, departamento_facultad, contraseña
            FROM profesores WHERE id_profesor = ?`,
            [texto_correo]    );

            if (profesores.length > 0) {
              const profesor = profesores[0];
              const contraCorrecta = await argon2.verify( profesor.contraseña, contrasena );

              if(!contraCorrecta){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              const token = jwt.sign(
                {
                    id: profesor.id_profesor,
                    rol: "Docente"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "8h"
                }
              );

              return res.json({
                  success: true,
                  token,
                  usuario: {
                      id: profesor.id_profesor,
                      nombre: profesor.nombres,
                      apellidos: profesor.apellidos,
                      correo_institucionale: profesor.correo_institucional,
                      departamento_facultad: profesor.departamento_facultad,
                      rol: "Docente"
                  }
              });
            }
        
          // 2. Si no existe como profesor, buscar en Estudiantes
          const [estudiantes] = await db.query(
              `SELECT id_estudiante, nombres, apellidos, correo_institucional, contraseña
              FROM estudiantes WHERE id_estudiante = ?`,
            [texto_correo]    );

          if (estudiantes.length > 0) {
              const estudiante = estudiantes[0];
              const contraCorrecta = await argon2.verify( estudiante.contraseña, contrasena );
              
              if(!contraCorrecta){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              return res.json({
                  success: true,
                  usuario: {
                      id: estudiante.id_estudiante,
                      nombre: estudiante.nombres,
                      apellidos: estudiante.apellidos,
                      correo_institucionale: estudiante.correo_institucional,
                      departamento_facultad: null,
                      rol: "Estudiante"
                  }
              });
          }

        // 3. No existe en ninguna tabla
        return res.status(401).json({
            success: false,
            mensaje: "Usuario no encontrado"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor"
        });
    }

  }
};

// 3. Obtener todas las asistencias de una sesión específica
const obtenerAsistenciasPorSesion = async (req, res) => {
  const { id_sesion } = req.params;

  try {
    const query = `
      SELECT 
        a.id_asistencia,
        a.id_estudiante,
        e.id_estudiante,
        e.nombres,
        e.apellidos,
        a.estado_asistencia,
        a.hora_marca,
        a.metodo_registro
      FROM asistencias a
      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      WHERE a.id_sesion = ?
      ORDER BY a.hora_marca ASC
    `;

    const [filas] = await db.query(query, [id_sesion]);
    return res.json(filas);

  } catch (error) {
    console.error('Error al obtener asistencias por sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 4. Obtener el historial de asistencias de un estudiante
const obtenerHistorialEstudiante = async (req, res) => {
  const { id_estudiante } = req.params;

  if (!id_estudiante) {
    return res.status(400).json({ error: 'Se requiere el carnet del estudiante' });
  }

  try {
    const [estudiantes] = await db.query(
      'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?',
      [id_estudiante]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({ error: 'El estudiante no fue encontrado' });
    }

    const query = `
      SELECT
        a.id_asistencia,
        s.fecha,
        a.hora_marca,
        m.nombre_materia,
        g.numero_grupo,
        g.aula,
        a.estado_asistencia,
        a.metodo_registro
      FROM asistencias a
      INNER JOIN sesiones s ON a.id_sesion = s.id_sesion
      INNER JOIN grupos g ON s.id_grupo = g.id_grupo
      INNER JOIN materias m ON g.id_materia = m.id_materia
      WHERE a.id_estudiante = ?
      ORDER BY s.fecha DESC, a.hora_marca DESC, a.id_asistencia DESC
      LIMIT 5
    `;

    const [filas] = await db.query(query, [id_estudiante]);
    return res.json(filas);

  } catch (error) {
    console.error('Error al obtener historial del estudiante:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 5. Obtener el resumen de asistencias de un estudiante
const obtenerResumenEstudiante = async (req, res) => {
  const { id_estudiante } = req.params;

  if (!id_estudiante) {
    return res.status(400).json({ error: 'Se requiere el carnet del estudiante' });
  }

  try {
    const [estudiantes] = await db.query(
      'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?',
      [id_estudiante]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({ error: 'El estudiante no fue encontrado' });
    }

    const query = `
      SELECT
        COUNT(*) AS asistencias_totales,
        COUNT(CASE WHEN estado_asistencia = 'Presente' THEN 1 END) AS presentes,
        COUNT(CASE WHEN estado_asistencia = 'Tardanza' THEN 1 END) AS tardanzas,
        COUNT(CASE WHEN estado_asistencia = 'Ausente' THEN 1 END) AS ausentes,
        COUNT(CASE WHEN estado_asistencia = 'Permiso' THEN 1 END) AS permisos
      FROM asistencias
      WHERE id_estudiante = ?
    `;

    const [filas] = await db.query(query, [id_estudiante]);
    const resumen = filas[0];

    return res.json({
      asistencias_totales: Number(resumen.asistencias_totales),
      presentes: Number(resumen.presentes),
      tardanzas: Number(resumen.tardanzas),
      ausentes: Number(resumen.ausentes),
      permisos: Number(resumen.permisos)
    });
  } catch (error) {
    console.error('Error al obtener resumen de asistencias:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 6. Obtener informacion de las asistencias por materia de un estudiante
const obtenerMateriasResumen = async (req, res) => {
  const { id_estudiante } = req.params;

  if (!id_estudiante) {
    return res.status(400).json({ error: 'Se requiere el carnet del estudiante' });
  }

  try {
    const [estudiantes] = await db.query(
      'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?',
      [id_estudiante]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({ error: 'El estudiante no fue encontrado' });
    }

    const query = `
      SELECT
        m.nombre_materia AS materia,
        g.numero_grupo AS grupo,
        CONCAT(e.nombres, ' ', e.apellidos) AS estudiante,

        GROUP_CONCAT(
          DISTINCT CASE DAYOFWEEK(s.fecha)
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Lunes'
            WHEN 3 THEN 'Martes'
            WHEN 4 THEN 'Miércoles'
            WHEN 5 THEN 'Jueves'
            WHEN 6 THEN 'Viernes'
            WHEN 7 THEN 'Sábado'
          END
          ORDER BY DAYOFWEEK(s.fecha) SEPARATOR '-'
        ) AS dias_semana,

        MIN(s.hora_inicio) AS hora_inicio,
        g.aula AS aula,
        COUNT(a.id_asistencia) AS total_sesiones,
        SUM(
          CASE
          WHEN a.estado_asistencia = 'Ausente' THEN 1
          ELSE 0
         END
        ) AS cantidad_inasistencias

      FROM estudiantes e
      INNER JOIN inscripciones i ON e.id_estudiante = i.id_estudiante
      INNER JOIN grupos g ON i.id_grupo = g.id_grupo
      INNER JOIN materias m ON g.id_materia = m.id_materia
      INNER JOIN sesiones s ON g.id_grupo = s.id_grupo
      LEFT JOIN asistencias a ON s.id_sesion = a.id_sesion AND a.id_estudiante = e.id_estudiante

      WHERE e.id_estudiante = ?

      GROUP BY
          e.id_estudiante, e.nombres, e.apellidos, g.id_grupo,
          g.numero_grupo, m.nombre_materia, g.aula
      ORDER BY m.nombre_materia
      `;

    const [filas] = await db.query(query, [id_estudiante]);
    return res.json(filas);

  } catch (error) {
    console.error('Error al obtener resumen de materias:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};



module.exports = {
  registrarAsistencia,
  procesoLogin,
  obtenerAsistenciasPorSesion,
  obtenerHistorialEstudiante,
  obtenerResumenEstudiante,
  obtenerMateriasResumen
};