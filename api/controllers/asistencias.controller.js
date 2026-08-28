const db = require('../db');

const obtenerFechaHora = (valor) => {
  if (!valor) return new Date();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const diaSemanaLunesUno = (fecha) => (fecha.getDay() + 6) % 7 + 1;

const registrarAsistenciaDesdeDispositivo = async (req, res) => {
  const { id_dispositivo, carnet, fecha_hora } = req.body;
  const fechaHora = obtenerFechaHora(fecha_hora);

  if (!id_dispositivo || !carnet) {
    return res.status(400).json({ error: 'Se requieren id_dispositivo y carnet' });
  }
  if (!fechaHora) {
    return res.status(400).json({ error: 'fecha_hora no tiene un formato válido' });
  }
  if (!req.get('x-device-key')) {
    return res.status(401).json({ error: 'Falta la clave del dispositivo' });
  }

  try {
    const [dispositivos] = await db.query(`
      SELECT d.id_aula, a.nombre_aula
      FROM Dispositivos d
      INNER JOIN Aulas a ON a.id_aula = d.id_aula
      WHERE d.id_dispositivo = ?
        AND d.api_key_hash = SHA2(?, 256)
        AND d.activo = TRUE AND a.activo = TRUE
    `, [id_dispositivo, req.get('x-device-key')]);

    if (dispositivos.length === 0) {
      return res.status(401).json({ error: 'Dispositivo no autorizado o inactivo' });
    }

    const dispositivo = dispositivos[0];
    const fecha = fechaHora.toISOString().slice(0, 10);
    const hora = fechaHora.toISOString().slice(11, 19);
    const dia = diaSemanaLunesUno(fechaHora);
    const [horarios] = await db.query(`
      SELECT h.id_grupo, h.hora_inicio, h.hora_fin, m.nombre_materia
      FROM Horarios h
      INNER JOIN Grupos g ON g.id_grupo = h.id_grupo
      INNER JOIN Materias m ON m.id_materia = g.id_materia
      WHERE h.id_aula = ? AND h.dia_semana = ? AND h.activo = TRUE
        AND h.hora_inicio <= ? AND h.hora_fin >= ?
      ORDER BY h.hora_inicio DESC
      LIMIT 1
    `, [dispositivo.id_aula, dia, hora, hora]);

    if (horarios.length === 0) {
      return res.status(409).json({ error: 'No hay una clase programada en esta aula y horario' });
    }

    const horario = horarios[0];
    const [estudiantes] = await db.query(
      'SELECT id_estudiante FROM Estudiantes WHERE id_estudiante = ?', [carnet]
    );
    if (estudiantes.length === 0) {
      return res.status(404).json({ error: 'El carnet no pertenece a un estudiante' });
    }
    const [inscripciones] = await db.query(
      'SELECT 1 FROM Inscripciones WHERE id_estudiante = ? AND id_grupo = ?',
      [carnet, horario.id_grupo]
    );
    if (inscripciones.length === 0) {
      return res.status(403).json({ error: 'El estudiante no está inscrito en esta materia' });
    }

    let [sesiones] = await db.query(
      'SELECT id_sesion FROM Sesiones WHERE id_grupo = ? AND fecha = ? AND id_aula = ?',
      [horario.id_grupo, fecha, dispositivo.id_aula]
    );
    if (sesiones.length === 0) {
      const [resultado] = await db.query(`
        INSERT INTO Sesiones (id_grupo, fecha, hora_inicio, hora_fin, id_aula, estado)
        VALUES (?, ?, ?, ?, ?, 'Programada')
      `, [horario.id_grupo, fecha, horario.hora_inicio, horario.hora_fin, dispositivo.id_aula]);
      sesiones = [{ id_sesion: resultado.insertId }];
    }

    const inicio = new Date(`${fecha}T${horario.hora_inicio}`);
    const estado = fechaHora.getTime() > inicio.getTime() + 10 * 60 * 1000
      ? 'Llegada Tarde' : 'Presente';
    await db.query(`
      INSERT INTO Asistencias (id_sesion, id_estudiante, estado_asistencia, hora_marca, metodo_registro)
      VALUES (?, ?, ?, ?, 'IoT-QR')
    `, [sesiones[0].id_sesion, carnet, estado, fechaHora]);

    return res.status(201).json({
      mensaje: 'Asistencia registrada correctamente',
      datos: { id_estudiante: carnet, materia: horario.nombre_materia,
        aula: dispositivo.nombre_aula, fecha, hora_marca: fechaHora,
        estado_asistencia: estado }
    });
  } catch (error) {
    if (error.errno === 1062) {
      return res.status(409).json({ error: 'El estudiante ya tiene asistencia registrada en esta sesión' });
    }
    console.error('Error al registrar asistencia desde dispositivo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

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

  try {
    const query = `
      SELECT 
        a.id_asistencia,
        s.fecha,
        a.hora_marca,
        m.nombre_materia,
        g.numero_grupo,
        au.nombre_aula,
        a.estado_asistencia,
        a.metodo_registro
      FROM Asistencias a
      INNER JOIN Sesiones s ON a.id_sesion = s.id_sesion
      INNER JOIN Grupos g ON s.id_grupo = g.id_grupo
      INNER JOIN Materias m ON g.id_materia = m.id_materia
      LEFT JOIN Aulas au ON s.id_aula = au.id_aula
      WHERE a.id_estudiante = ?
      ORDER BY a.hora_marca DESC, s.fecha DESC
      LIMIT 5
    `;

    const [filas] = await db.query(query, [id_estudiante]);
    return res.json(filas);

  } catch (error) {
    console.error('Error al obtener historial del estudiante:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  registrarAsistencia,
  obtenerAsistenciasPorSesion,
  obtenerHistorialEstudiante
};