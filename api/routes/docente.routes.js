const express = require("express");

const router = express.Router();

const {
    obtenerDashboardDocente,
    cancelarSesion
} = require("../controllers/docente.controller");


// =====================================================
// DASHBOARD DEL DOCENTE
// =====================================================

router.get( "/dashboard/:id_profesor", obtenerDashboardDocente);

// =====================================================
// CANCELAR SESIÓN
// =====================================================

router.put( '/cancelar/:id_sesion', cancelarSesion );


module.exports = router;