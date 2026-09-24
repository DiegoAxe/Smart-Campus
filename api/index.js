const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const asistenciasRoutes = require('./routes/asistencias.routes');
const authRoutes = require('./routes/auth.routes');
const docenteRoutes = require('./routes/docente.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    const [tablas] = await db.query(
      `SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME IN (?, ?, ?, ?, ?, ?, ?)`,
      [
        process.env.DB_NAME,
        'Profesores',
        'Estudiantes',
        'Materias',
        'Grupos',
        'Inscripciones',
        'Sesiones',
        'Asistencias'
      ]
    );

    const tablasEncontradas = tablas.map((tabla) => tabla.TABLE_NAME);
    const tablasFaltantes = [
      'Profesores',
      'Estudiantes',
      'Materias',
      'Grupos',
      'Inscripciones',
      'Sesiones',
      'Asistencias'
    ].filter((tabla) => !tablasEncontradas.includes(tabla));

    if (tablasFaltantes.length > 0) {
      return res.status(503).json({
        ok: false,
        service: 'smart-campus-api',
        database: 'connected',
        tablas_faltantes: tablasFaltantes
      });
    }

    return res.json({
      ok: true,
      service: 'smart-campus-api',
      database: 'connected',
      schema: 'valid'
    });
  } catch (error) {
    console.error('Health check de base de datos falló:', error.message);
    return res.status(503).json({
      ok: false,
      service: 'smart-campus-api',
      database: 'unavailable',
      mensaje: 'No se pudo validar la base de datos'
    });
  }
});

app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/docente', docenteRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor listo y corriendo en http://localhost:${PORT}`);
});