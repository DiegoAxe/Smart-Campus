const db = require('../db');

const iniciarSesion = async (req, res) => {
  const { usuario, identificador, contraseña } = req.body;
  const texto_correo = usuario || identificador;
  const contrasena = contraseña;
 
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

              if(profesor.contraseña != contrasena){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              return res.json({
                  success: true,
                  usuario: {
                      id_usuario: profesor.id_profesor,
                      nombres: profesor.nombres,
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

              if(estudiante.contraseña != contrasena){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              return res.json({
                  success: true,
                  usuario: {
                      id_usuario: estudiante.id_estudiante,
                      nombres: estudiante.nombres,
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

              if(profesor.contraseña != contrasena){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              return res.json({
                  success: true,
                  usuario: {
                      id_usuario: profesor.id_profesor,
                      nombres: profesor.nombres,
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

              if(estudiante.contraseña != contrasena){
                return res.status(401).json({
                  success: false,
                  mensaje: "Contraseña incorrecta"
              });
              }

              return res.json({
                  success: true,
                  usuario: {
                      id_usuario: estudiante.id_estudiante,
                      nombres: estudiante.nombres,
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


module.exports = { iniciarSesion };
