const express = require("express");

const router = express.Router();

const {
    obtenerDashboardDocente
} = require("../controllers/docente.controller");


// =====================================================
// DASHBOARD DEL DOCENTE
// =====================================================

router.get(
    "/dashboard/:id_profesor",
    obtenerDashboardDocente
);


module.exports = router;