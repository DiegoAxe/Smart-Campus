const db = require('../db');

// 1. Registrar asistencia de un estudiante
const registrarAsistencia = async (req, res) => {
  const { id_sesion, id_estudiante, metodo_registro } = req.body;

  // Validación de campos requeridos
  if (!id_sesion || !id_estudiante) {
    return res.status(400).json({ 
      error: 'Se requieren el id_sesion y el id_estudiante' 
    });
  }

  try {
    // Verificar si la sesión existe y está activa
    const [sesion] = await db.query(
      'SELECT estado FROM Sesiones WHERE id_sesion = ?', 
      [id_sesion]
    );

    if (sesion.length === 0) {
      return res.status(404).json({ error: 'La sesión de clase no existe' });
    }

    if (sesion[0].estado === 'Finalizada' || sesion[0].estado === 'Cancelada') {
      return res.status(400).json({ 
        error: `No se puede registrar asistencia. La sesión está ${sesion[0].estado}` 
      });
    }

    // Insertar la asistencia
    const queryInsert = `
      INSERT INTO Asistencias (id_sesion, id_estudiante, estado_asistencia, hora_marca, metodo_registro)
      VALUES (?, ?, 'Presente', NOW(), ?)
    `;

    await db.query(queryInsert, [
      id_sesion, 
      id_estudiante, 
      metodo_registro || 'QR'
    ]);

    return res.status(201).json({
      mensaje: 'Asistencia registrada correctamente',
      datos: { id_sesion, id_estudiante, hora_marca: new Date() }
    });

  } catch (error) {
    // Código 1062 en MySQL: Violación de índice UNIQUE (asistencia duplicada)
    if (error.errno === 1062) {
      return res.status(409).json({ 
        error: 'El estudiante ya tiene asistencia registrada en esta sesión' 
      });
    }

    // Código 1452 en MySQL: Error de llave foránea (id_estudiante no existe)
    if (error.errno === 1452) {
      return res.status(404).json({ 
        error: 'El estudiante ingresado no existe en la base de datos' 
      });
    }

    console.error('Error al registrar asistencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 2. Obtener todas las asistencias de una sesión específica
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
      FROM Asistencias a
      INNER JOIN Estudiantes e ON a.id_estudiante = e.id_estudiante
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

// 3. Obtener el historial de asistencias de un estudiante
const obtenerHistorialEstudiante = async (req, res) => {
  const { id_estudiante } = req.params;

  if (!id_estudiante) {
    return res.status(400).json({ error: 'Se requiere el carnet del estudiante' });
  }

  try {
    const [estudiantes] = await db.query(
      'SELECT id_estudiante FROM Estudiantes WHERE id_estudiante = ?',
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
        NULL AS aula,
        a.estado_asistencia,
        a.metodo_registro
      FROM Asistencias a
      INNER JOIN Sesiones s ON a.id_sesion = s.id_sesion
      INNER JOIN Grupos g ON s.id_grupo = g.id_grupo
      INNER JOIN Materias m ON g.id_materia = m.id_materia
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

// 4. Obtener el resumen de asistencias de un estudiante
const obtenerResumenEstudiante = async (req, res) => {
  const { id_estudiante } = req.params;

  if (!id_estudiante) {
    return res.status(400).json({ error: 'Se requiere el carnet del estudiante' });
  }

  try {
    const [estudiantes] = await db.query(
      'SELECT id_estudiante FROM Estudiantes WHERE id_estudiante = ?',
      [id_estudiante]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({ error: 'El estudiante no fue encontrado' });
    }

    const query = `
      SELECT
        COUNT(*) AS asistencias_totales,
        COUNT(CASE WHEN estado_asistencia = 'Presente' THEN 1 END) AS presentes,
        COUNT(CASE WHEN estado_asistencia = 'Llegada Tarde' THEN 1 END) AS tardanzas,
        COUNT(CASE WHEN estado_asistencia = 'Ausente' THEN 1 END) AS ausentes,
        COUNT(CASE WHEN estado_asistencia = 'Permiso' THEN 1 END) AS permisos
      FROM Asistencias
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

module.exports = {
  registrarAsistencia,
  obtenerAsistenciasPorSesion,
  obtenerHistorialEstudiante,
  obtenerResumenEstudiante
};