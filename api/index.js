const express = require('express');
const cors = require('cors');
require('dotenv').config();

const asistenciasRoutes = require('./routes/asistencias.routes');
const authRoutes = require('./routes/auth.routes');
const docenteRoutes = require('./routes/docente.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smart-campus-api' });
});

app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/docente', docenteRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor listo y corriendo en http://localhost:${PORT}`);
});