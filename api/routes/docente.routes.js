const express = require("express");

const router = express.Router();

const {
    obtenerDashboardDocente,
    cancelarSesion,
    finalizarSesion
} = require("../controllers/docente.controller");


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