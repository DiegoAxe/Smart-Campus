const db = require('../db');
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

// 1. Registrar asistencia mediante QR
const registrarAsistencia = async (req, res) => {
  const { id_sesion, id_estudiante } = req.body;

  // =====================================================
  // 0. Verificar datos obligatorios
  // =====================================================
  if (!id_sesion || !id_estudiante) {
    return res.status(400).json({
      error: 'Faltan datos: se requieren id_sesion e id_estudiante'
    });
  }

  try {
    // =====================================================
    // 1. Buscar la sesión
    // =====================================================
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

    if (sesiones.length === 0) {
      return res.status(404).json({
        error: `La sesión con id ${id_sesion} no existe`
      });
    }

    const sesion = sesiones[0];

    // =====================================================
    // 2. Verificar estado de la sesión
    // =====================================================
    if (sesion.estado === 'Finalizada') {
      return res.status(400).json({
        error: 'La sesión ya está finalizada'
      });
    }

    if (sesion.estado === 'Cancelada') {
      return res.status(400).json({
        error: 'La sesión está cancelada'
      });
    }

    // =====================================================
    // 3. Verificar que el estudiante exista
    // =====================================================
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
        error: `El estudiante con id ${id_estudiante} no existe`
      });
    }

    // =====================================================
    // 4. Verificar inscripción al grupo
    // =====================================================
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
        error: `El estudiante ${id_estudiante} no está inscrito en el grupo ${sesion.id_grupo}`
      });
    }

    // =====================================================
    // 5. Verificar si ya registró asistencia
    // =====================================================
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
        error: `El estudiante ${id_estudiante} ya tiene una asistencia registrada para la sesión ${id_sesion}`
      });
    }

    // =====================================================
    // 6. Obtener fecha y hora ACTUAL de El Salvador
    // =====================================================
    const ahora = new Date();

    const partesSV = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/El_Salvador',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23'
    }).formatToParts(ahora);

    const obtenerParte = (tipo) =>
      partesSV.find((parte) => parte.type === tipo)?.value;

    const anioActual = obtenerParte('year');
    const mesActual = obtenerParte('month');
    const diaActual = obtenerParte('day');
    const horaActual = obtenerParte('hour');
    const minutoActual = obtenerParte('minute');
    const segundoActual = obtenerParte('second');

    const fechaActual =
      `${anioActual}-${mesActual}-${diaActual}`;

    const horaActualTexto =
      `${horaActual}:${minutoActual}:${segundoActual}`;

    // =====================================================
    // 7. Obtener correctamente la fecha de la sesión
    // =====================================================
    let fechaSesion;

    if (sesion.fecha instanceof Date) {
      // Si mysql2 la devuelve como Date, usamos UTC
      // para evitar que el servidor nos cambie el día.
      const anio = sesion.fecha.getUTCFullYear();
      const mes = String(sesion.fecha.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(sesion.fecha.getUTCDate()).padStart(2, '0');

      fechaSesion = `${anio}-${mes}-${dia}`;
    } else {
      fechaSesion = String(sesion.fecha).split('T')[0];
    }

    // =====================================================
    // 8. Verificar que sea el mismo día
    // =====================================================
    if (fechaActual !== fechaSesion) {
      return res.status(400).json({
        error: 'La sesión no corresponde al día actual',
        detalles: {
          fecha_sesion: fechaSesion,
          fecha_actual_El_Salvador: fechaActual
        }
      });
    }

    // =====================================================
    // 9. Convertir una hora HH:mm:ss a segundos
    // =====================================================
    const convertirHoraASegundos = (hora) => {
      const textoHora = String(hora);

      const [horas, minutos, segundos = 0] =
        textoHora.split(':').map(Number);

      return (
        (horas * 3600) +
        (minutos * 60) +
        segundos
      );
    };

    const segundosActual =
      convertirHoraASegundos(horaActualTexto);

    const segundosInicio =
      convertirHoraASegundos(sesion.hora_inicio);

    const segundosFin =
      convertirHoraASegundos(sesion.hora_fin);

    // =====================================================
    // 10. Validar horario de la sesión
    // =====================================================

    // Configuración inválida de la sesión
    if (segundosInicio >= segundosFin) {
      return res.status(500).json({
        error: 'La sesión tiene un horario inválido',
        detalles: {
          hora_inicio: sesion.hora_inicio,
          hora_fin: sesion.hora_fin
        }
      });
    }

    // 15 minutos después del inicio
    const limitePresente =
      segundosInicio + (15 * 60);

    // Antes de comenzar
    if (segundosActual < segundosInicio) {
      return res.status(400).json({
        error: 'La sesión todavía no ha comenzado',
        detalles: {
          hora_actual_El_Salvador: horaActualTexto,
          hora_inicio: sesion.hora_inicio,
          hora_fin: sesion.hora_fin
        }
      });
    }

    // Después de finalizar
    if (segundosActual >= segundosFin) {
      return res.status(400).json({
        error: 'La sesión ya terminó',
        detalles: {
          hora_actual_El_Salvador: horaActualTexto,
          hora_inicio: sesion.hora_inicio,
          hora_fin: sesion.hora_fin
        }
      });
    }

    // =====================================================
    // 11. Determinar estado de asistencia
    // =====================================================
    let estadoAsistencia;

    if (segundosActual <= limitePresente) {
      estadoAsistencia = 'Presente';
    } else {
      estadoAsistencia = 'Tardanza';
    }

    // =====================================================
    // 12. Guardar hora de El Salvador
    // =====================================================
    const fechaHoraMarca =
      `${fechaActual} ${horaActualTexto}`;

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

    // =====================================================
    // 13. Respuesta exitosa
    // =====================================================
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

    // =====================================================
    // Errores específicos de MySQL
    // =====================================================

    // Registro duplicado
    if (error.errno === 1062) {
      return res.status(409).json({
        error: 'El estudiante ya tiene registrada una asistencia para esta sesión'
      });
    }

    // Error de clave foránea
    if (error.errno === 1452) {
      return res.status(404).json({
        error: 'Error de integridad: el estudiante, grupo o sesión no existe en una tabla relacionada'
      });
    }

    // Otros errores
    console.error('Error al registrar asistencia:', error);

    return res.status(500).json({
      error: 'Error interno del servidor al registrar la asistencia',
      detalle: error.message
    });
  }
};

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
