const db = require('../db');

const iniciarSesion = async (req, res) => {
  const { usuario, identificador, contraseña } = req.body;
  const valorUsuario = usuario || identificador;

  if (!valorUsuario || !contraseña) {
    return res.status(400).json({ error: 'Se requieren usuario y contraseña' });
  }

  try {
    // La contraseña se usa solo para filtrar; nunca se incluye en la respuesta.
    const [usuarios] = await db.query(`
      SELECT id_estudiante AS id_usuario, nombres, apellidos,
             correo_institucional, NULL AS departamento_facultad,
             'estudiante' AS rol
      FROM Estudiantes
      WHERE (id_estudiante = ? OR correo_institucional = ?)
        AND contraseña = ?
      UNION ALL
      SELECT id_profesor AS id_usuario, nombres, apellidos,
             correo_institucional, departamento_facultad,
             'profesor' AS rol
      FROM Profesores
      WHERE (id_profesor = ? OR correo_institucional = ?)
        AND contraseña = ?
      LIMIT 1
    `, [valorUsuario, valorUsuario, contraseña, valorUsuario, valorUsuario, contraseña]);

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    return res.json({ usuario: usuarios[0] });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { iniciarSesion };
