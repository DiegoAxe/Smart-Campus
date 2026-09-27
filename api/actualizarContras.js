const argon2 = require("argon2");
const db = require('./db');

async function actualizarContras() {

    try {
        // Para Estudiantes
        const [estudiantes] = await db.query(
            "SELECT id_estudiante, contraseña FROM Estudiantes"
        );

        for (const estudiante of estudiantes) {

            const hash = await argon2.hash( estudiante.contraseña );

            await db.query(
                `UPDATE Estudiantes
                 SET contraseña = ?
                 WHERE id_estudiante = ?`,
                [hash, estudiante.id_estudiante]
            );
        }

        // Para Profesores
        const [profesores] = await db.query(
            "SELECT id_profesor, contraseña FROM Profesores"
        );

        for (const profesor of profesores) {

            const hash = await argon2.hash( profesor.contraseña );

            await db.query(
                `UPDATE Profesores
                 SET contraseña = ?
                 WHERE id_profesor = ?`,
                [hash, profesor.id_profesor]
            );
        }

        console.log("Contraseñas migradas correctamente.");
        process.exit(0);

    } catch (error) {

        console.error(
            "Error protegiendo las contraseñas:", error
        );
        process.exit(1);
    }
}

actualizarContras();