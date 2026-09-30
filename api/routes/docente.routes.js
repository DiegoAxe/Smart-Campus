const express = require("express");

const router = express.Router();

const {
    obtenerDashboardDocente,
    cancelarSesion,
    finalizarSesion,
    crearSesion
} = require("../controllers/docente.controller");


// =====================================================
// CREAR SESION
// =====================================================

router.post( "/sesiones", crearSesion );


// =====================================================
// DASHBOARD DEL DOCENTE
// =====================================================

router.get( "/dashboard/:id_profesor", obtenerDashboardDocente);

// =====================================================
// CANCELAR SESIÓN
// =====================================================

router.put( '/cancelar/:id_sesion', cancelarSesion );

// =====================================================
// FINALIZAR SESIÓN
// =====================================================

router.put( '/finalizar/:id_sesion', finalizarSesion );

module.exports = router;