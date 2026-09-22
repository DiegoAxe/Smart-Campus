const express = require('express');
const cors = require('cors');
require('dotenv').config();

const asistenciasRoutes = require('./routes/asistencias.routes');
const authRoutes = require('./routes/auth.routes');
const docenteRoutes = require('./routes/docente.routes');

const app = express();


// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());

app.use(express.json());

<<<<<<< HEAD
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smart-campus-api' });
});

// Montar las rutas
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
=======
app.use(express.urlencoded({
    extended: true
}));


// =====================================================
// RUTAS
// =====================================================

app.use(
    '/api/asistencias',
    asistenciasRoutes
);

app.use(
    '/api/auth',
    authRoutes
);

app.use(
    '/api/docente',
    docenteRoutes
);


// =====================================================
// RUTA DE PRUEBA
// =====================================================

app.get('/', (req, res) => {

    res.json({
        mensaje: 'API Smart Campus funcionando correctamente'
    });

});


// =====================================================
// SERVIDOR
// =====================================================

const PORT = 3001;

>>>>>>> 88a92fad81f5cdcfe95f5a99aa05367337d5a5e9
app.listen(PORT, () => {

    console.log(
        `Servidor listo y corriendo en http://localhost:${PORT}`
    );

});