const express = require("express");
const router = express.Router();
const ai = require("../config/gemini");
const { preguntarAsistente } = require("../controllers/asistente.controller");
const verificarToken = require("../middleware/auth.middleware");

// Para hacer pruebas, que responda algo basico
router.get("/prueba", async (req, res) => {

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: "Explica brevemente qué el estoicismo."
        });
        res.json({
            success: true,
            respuesta: response.text
        });

    } catch (error) {
        console.error("Error Gemini:", error);
        res.status(500).json({
            success: false,
            mensaje: "Error al comunicarse con Gemini"
        });
        
    }
    
});

// Para ya hacer una pregunta real al asistente, manejando permisos y reglas
router.post( "/", verificarToken, preguntarAsistente);

module.exports = router;