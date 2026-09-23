const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-campus-secret-key';

const iniciarSesion = async (req, res) => {
  const {
    usuario,
    identificador,
    contraseña,
    texto_correo,
    contrasena
  } = req.body;

  const valorUsuario = usuario || identificador || texto_correo;
  const password = contraseña || contrasena;

  if (!valorUsuario || !password) {
    return res.status(400).json({
      success: false,
      mensaje: 'Se requieren usuario y contraseña'
    });
  }

  try {
    const [usuarios] = await db.query(`
      SELECT
        id_estudiante AS id,
        nombres,
        apellidos,
        correo_institucional,
        NULL AS departamento_facultad,
        'Estudiante' AS rol
      FROM Estudiantes
      WHERE (id_estudiante = ? OR correo_institucional = ?)
        AND contraseña = ?

      UNION ALL

      SELECT
        id_profesor AS id,
        nombres,
        apellidos,
        correo_institucional,
        departamento_facultad,
        'Docente' AS rol
      FROM Profesores
      WHERE (id_profesor = ? OR correo_institucional = ?)
        AND contraseña = ?
      LIMIT 1
    `, [valorUsuario, valorUsuario, password, valorUsuario, valorUsuario, password]);

    if (usuarios.length === 0) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    const usuarioEncontrado = usuarios[0];
    const token = jwt.sign(
      {
        id: String(usuarioEncontrado.id),
        nombre: usuarioEncontrado.nombres,
        apellidos: usuarioEncontrado.apellidos,
        rol: usuarioEncontrado.rol,
        correo_institucional: usuarioEncontrado.correo_institucional
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      usuario: {
        id: String(usuarioEncontrado.id),
        nombre: usuarioEncontrado.nombres,
        apellidos: usuarioEncontrado.apellidos,
        correo_institucional: usuarioEncontrado.correo_institucional,
        departamento_facultad: usuarioEncontrado.departamento_facultad,
        rol: usuarioEncontrado.rol
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

module.exports = { iniciarSesion };
