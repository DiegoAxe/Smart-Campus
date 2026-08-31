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

app.listen(PORT, () => {

    console.log(
        `Servidor listo y corriendo en http://localhost:${PORT}`
    );

});