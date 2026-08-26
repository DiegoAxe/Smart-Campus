const express = require('express');
const cors = require('cors');
require('dotenv').config();

const asistenciasRoutes = require('./routes/asistencias.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Montar las rutas
app.use('/api/asistencias', asistenciasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo y corriendo en el puerto ${PORT}`);
});