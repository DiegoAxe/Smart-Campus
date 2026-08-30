const express = require('express');
const router = express.Router();
const {
  registrarAsistencia,
  procesoLogin,
  obtenerAsistenciasPorSesion,
  obtenerHistorialEstudiante,
  obtenerResumenEstudiante,
  obtenerMateriasResumen
} = require('../controllers/asistencias.controller');

// Ruta para marcar/registrar asistencia (POST)
router.post('/', registrarAsistencia);

// Ruta para hacer el login (POST)
router.post('/login/', procesoLogin);

// Ruta para obtener la lista de asistencias de una sesión (GET)
router.get('/sesion/:id_sesion', obtenerAsistenciasPorSesion);

// Ruta para consultar el historial de un alumno (GET)
router.get('/estudiante/:id_estudiante', obtenerHistorialEstudiante);

// Ruta para consultar el resumen de asistencias de un alumno (GET)
router.get('/estudiante/:id_estudiante/resumen', obtenerResumenEstudiante);

// Ruta para consultar el resumen de materias de un alumno (GET)
router.get('/estudiante/:id_estudiante/materias', obtenerMateriasResumen);

module.exports = router;