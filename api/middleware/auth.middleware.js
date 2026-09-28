const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                mensaje: "No autorizado."
            });
        }

        const partes = authHeader.split(" ");

        if (
            partes.length !== 2 ||
            partes[0] !== "Bearer"
        ) {
            return res.status(401).json({
                success: false,
                mensaje: "Token inválido."
            });
        }

        const token = partes[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            mensaje: "Sesión inválida o expirada."
        });
    }
};

module.exports = verificarToken;