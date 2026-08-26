const express = require('express');
const router = express.Router();
const {
  registrarAsistencia,
  obtenerAsistenciasPorSesion,
  obtenerHistorialEstudiante
} = require('../controllers/asistencias.controller');

// Ruta para marcar/registrar asistencia (POST)
router.post('/', registrarAsistencia);

// Ruta para obtener la lista de asistencias de una sesión (GET)
router.get('/sesion/:id_sesion', obtenerAsistenciasPorSesion);

// Ruta para consultar el historial de un alumno (GET)
router.get('/estudiante/:id_estudiante', obtenerHistorialEstudiante);

module.exports = router;