const { preguntarGemini } = require("../services/asistente.service");

const preguntarAsistente = async (req, res) => {
    try {
        // Verificar que sea un docente
        if (req.user.rol !== "Docente") {
            return res.status(403).json({
                success: false,
                mensaje: "El asistente IA está disponible únicamente para docentes."
            });
        }

        const { pregunta } = req.body;

        //Validaciones para evitar que la pregunta sea vacía, nula o demasiado larga
        if (!pregunta || typeof pregunta !== "string") {
            return res.status(400).json({
                success: false,
                mensaje: "Debes proporcionar una pregunta."
            });
        }

        if (pregunta.trim().length === 0) {
            return res.status(400).json({
                success: false,
                mensaje: "La pregunta no puede estar vacía."
            });
        }

        if (pregunta.length > 500) {
            return res.status(400).json({
                success: false,
                mensaje: "La pregunta es demasiado larga."
            });
        }

        const respuesta = await preguntarGemini(
            pregunta.trim(),
            req.user.id
        );

        res.json({
            success: true,
            respuesta
        });

    }catch (error) {
    console.error("Error en asistente IA:", error);

    if (error.name === "AsistenteError") {
        return res.status(error.statusCode).json({
            success: false,
            tipoError: error.tipo,
            mensaje: error.message
        });
    }

    return res.status(500).json({
        success: false,
        tipoError: "DESCONOCIDO",
        mensaje: "No se pudo obtener una respuesta del asistente."
    });
}
};

module.exports = {
    preguntarAsistente
};