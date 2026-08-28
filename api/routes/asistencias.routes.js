const express = require('express');
const router = express.Router();
const {
  registrarAsistencia,
  registrarAsistenciaDesdeDispositivo,
  obtenerAsistenciasPorSesion,
  obtenerHistorialEstudiante
} = require('../controllers/asistencias.controller');

// Ruta para marcar/registrar asistencia (POST)
router.post('/', registrarAsistencia);

router.post('/dispositivo', registrarAsistenciaDesdeDispositivo);

// Ruta para obtener la lista de asistencias de una sesión (GET)
router.get('/sesion/:id_sesion', obtenerAsistenciasPorSesion);

// Ruta para consultar el historial de un alumno (GET)
router.get('/estudiante/:id_estudiante', obtenerHistorialEstudiante);

module.exports = router;