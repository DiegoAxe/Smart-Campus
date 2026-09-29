const ai = require("../config/gemini");

const { obtenerMisGrupos, obtenerMisSesiones, obtenerAsistenciasGrupo,
    obtenerEstudiantesGrupo } = require("./asistente.tools");

class AsistenteError extends Error {
    constructor(tipo, mensaje, statusCode = 500) {
        super(mensaje);

        this.name = "AsistenteError";
        this.tipo = tipo;
        this.statusCode = statusCode;
    }
}

const SYSTEM_INSTRUCTION = `
Eres el asistente virtual de Smart Campus.
Tu función es ayudar exclusivamente a docentes de la plataforma.

REGLAS GENERALES:
- Responde siempre en español.
- Utiliza un lenguaje respetuoso, profesional y apropiado para un entorno universitario.
- No utilices insultos, lenguaje vulgar, ofensivo o degradante.
- No reveles contraseñas, credenciales, tokens ni información privada.
- No inventes información.
- Si no tienes información suficiente para responder, indícalo claramente.
- No afirmes haber realizado una acción si realmente no la realizaste.
- Las preguntas relacionadas con Smart Campus deben responderse únicamente utilizando la información que el sistema te proporcione mediante las herramientas.
- Nunca intentes obtener información que no esté disponible mediante las herramientas proporcionadas.
- Nunca solicites al usuario credenciales, contraseñas o tokens.
- Recuerda que eres un asistente de Smart Campus y no un administrador de la base de datos.

PERMISOS:
- El usuario actual es un DOCENTE.
- Solo puedes utilizar información relacionada con ese docente y los grupos, estudiantes y sesiones a los que tenga acceso.
- No debes revelar información perteneciente a otros docentes.
- Si una herramienta indica que el usuario no tiene acceso a la información solicitada, informa al docente de manera clara y profesional que no tiene permisos para acceder a esa información.
- No reveles si el recurso solicitado pertenece a otro docente.
- No reveles identificadores, nombres, estudiantes, sesiones u otros datos del recurso al que el docente no tiene acceso.
- Una falta de permisos no debe presentarse como un error técnico del sistema.

USO DE HERRAMIENTAS:
- Utiliza las herramientas disponibles cuando la pregunta requiera información de Smart Campus.
- No inventes datos que deberían obtenerse mediante una herramienta.
- Para consultar los grupos del docente utiliza obtenerMisGrupos.
- Para consultar las sesiones del docente utiliza obtenerMisSesiones.
- Para consultar los estudiantes de un grupo utiliza obtenerEstudiantesGrupo.
- Para consultar las asistencias de un grupo utiliza obtenerAsistenciasGrupo.
- El identificador del profesor es proporcionado internamente por el sistema y nunca debes pedírselo al usuario.

USO DE GOOGLE SEARCH:

- Puedes utilizar Google Search para preguntas de cultura general, información pública, información actualizada, acontecimientos recientes, tecnología, noticias y otros temas que requieran información externa.
- Utiliza Google Search cuando la información pueda haber cambiado recientemente o cuando necesites información actualizada de Internet.
- No utilices Google Search para obtener información de Smart Campus.
- Toda la información relacionada con docentes, grupos, estudiantes, sesiones y asistencias debe obtenerse exclusivamente mediante las herramientas de Smart Campus.
- Si una pregunta combina información de Smart Campus con información externa, utiliza las herramientas correspondientes para cada parte.
- No presentes información obtenida de Internet como si proviniera de Smart Campus.
- Cuando utilices información obtenida mediante Google Search, proporciona las fuentes cuando estén disponibles.
`;

// DECLARACIÓN DE LAS HERRAMIENTAS

const tools = [
    {
        googleSearch: {}
    },
    {
        functionDeclarations: [
            {
                name: "obtenerMisGrupos",
                description:
                    "Obtiene todos los grupos que pertenecen al docente autenticado. " +
                    "Debe utilizarse cuando el docente pregunte por sus grupos, materias, aulas o grupos asignados.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },

            {
                name: "obtenerMisSesiones",
                description:
                    "Obtiene las sesiones pertenecientes a los grupos del docente autenticado. " +
                    "Debe utilizarse cuando el docente pregunte por sus sesiones, clases, fechas, horarios o estado de sus sesiones.",
                parameters: {
                    type: "OBJECT",
                    properties: {},
                    required: []
                }
            },

            {
                name: "obtenerAsistenciasGrupo",
                description:
                    "Obtiene los registros de asistencia de un grupo específico del docente. " +
                    "Debe utilizarse cuando el docente pregunte quién asistió, quién faltó, " +
                    "quién llegó tarde o cualquier información relacionada con las asistencias de un grupo.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        idGrupo: {
                            type: "STRING",
                            description:
                                "Identificador del grupo que pertenece al docente."
                        }
                    },
                    required: ["idGrupo"]
                }
            },

            {
                name: "obtenerEstudiantesGrupo",
                description:
                    "Obtiene los estudiantes inscritos en un grupo específico del docente. " +
                    "Debe utilizarse cuando el docente pregunte por los estudiantes, alumnos, " +
                    "integrantes o inscritos de un grupo.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        idGrupo: {
                            type: "STRING",
                            description:
                                "Identificador del grupo que pertenece al docente."
                        }
                    },
                    required: ["idGrupo"]
                }
            }
        ]
    }
];

const toolConfig = {
    functionCallingConfig: {
        mode: "VALIDATED"
    },
    includeServerSideToolInvocations: true
};


// IDENTIFICAR EL ERROR, Y MANDAR UN MENSAJE DE ERROR AMIGABLE AL USUARIO
const identificarErrorGemini = (error) => {
    const mensaje = error?.message || "";
    const status = error?.status || error?.code;

    // CUOTA / LÍMITE DE USO
    if (
        mensaje.includes("GenerateRequestsPerDay") ||
        mensaje.includes("PerDay") ||
        mensaje.includes("daily quota") ||
        mensaje.includes("quota") ||
        mensaje.includes("RESOURCE_EXHAUSTED")
    ) {
        return {
            tipo: "CUOTA",
            mensaje:
                "El asistente alcanzó temporalmente su límite de uso. " +
                "Intenta nuevamente cuando la cuota se restablezca."
        };
    }

    // DEMASIADAS SOLICITUDES EN POCO TIEMPO
    if (
        status === 429 ||
        mensaje.includes("Too Many Requests")
    ) {
        return {
            tipo: "RATE_LIMIT",
            mensaje:
                "Se realizaron demasiadas solicitudes al asistente en poco tiempo. " +
                "Espera unos segundos e inténtalo nuevamente."
        };
    }

    // ERROR DE AUTENTICACIÓN
    if (
        status === 401 ||
        mensaje.includes("UNAUTHENTICATED") ||
        mensaje.includes("API key")
    ) {
        return {
            tipo: "AUTENTICACION",
            mensaje:
                "El servicio de inteligencia artificial no está correctamente autenticado."
        };
    }

    // ERROR DE PERMISOS
    if (
        status === 403 ||
        mensaje.includes("PERMISSION_DENIED")
    ) {
        return {
            tipo: "PERMISOS",
            mensaje:
                "El servicio de inteligencia artificial no tiene permisos suficientes para realizar esta operación."
        };
    }

    // ERROR DESCONOCIDO
    return {
        tipo: "DESCONOCIDO",
        mensaje:
            "No se pudo obtener una respuesta del asistente."
    };
};


// EJECUTAR UNA HERRAMIENTA

const ejecutarHerramienta = async (nombre, argumentos, idProfesor) => {

    switch (nombre) {
        case "obtenerMisGrupos":
            return await obtenerMisGrupos(idProfesor);

        case "obtenerMisSesiones":
            return await obtenerMisSesiones(idProfesor);

        case "obtenerAsistenciasGrupo":
            return await obtenerAsistenciasGrupo(
                idProfesor,
                argumentos.idGrupo
            );

        case "obtenerEstudiantesGrupo":
            return await obtenerEstudiantesGrupo(
                idProfesor,
                argumentos.idGrupo
            );
        default:
            throw new Error(`Herramienta desconocida: ${nombre}`);
    }
};

// PREGUNTAR A GEMINI

async function preguntarGemini(pregunta, idProfesor) {
    let response;

    try {

        response = await ai.models.generateContent({
            model: "gemini-3.8-flash",

            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: pregunta
                        }
                    ]
                }
            ],

            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                maxOutputTokens: 500,
                thinkingConfig: {
                    thinkingLevel: "low"
                },
                tools,
                toolConfig
            }
        });

    } catch (error) {

        console.error("Error de Gemini:", error);
        const errorGemini = identificarErrorGemini(error);

        throw new AsistenteError(
            errorGemini.tipo,
            errorGemini.mensaje,
            errorGemini.tipo === "CUOTA_DIARIA" ||
            errorGemini.tipo === "MUCHO_TRAFICO"
                ? 429
                : 500
        );
    }


    if (!response.functionCalls || response.functionCalls.length === 0) {
        return response.text;
    }

    const functionCalls = response.functionCalls;
    const resultados = [];

    for (const functionCall of functionCalls) {

        console.log(
            `Gemini solicitó herramienta: ${functionCall.name}`
        );

        console.log(
            "Argumentos:",
            functionCall.args
        );

        let resultado;

        try {

            resultado = await ejecutarHerramienta(
                functionCall.name,
                functionCall.args || {},
                idProfesor
            );

        } catch (error) {

            console.error(
                "Error al ejecutar herramienta:",
                error
            );

            throw new AsistenteError(
                "SQL",
                "Ocurrió un problema al consultar la información de Smart Campus.",
                500
            );
        }

        resultados.push({
            id: functionCall.id,
            name: functionCall.name,
            resultado
        });
    }

    const functionResponses = resultados.map((item) => ({
        functionResponse: {
            name: item.name,
            response: {
                resultado: item.resultado
            },
            id: item.id
        }
    }));

    const history = [
        {
            role: "user",
            parts: [
                {
                    text: pregunta
                }
            ]
        },

        response.candidates[0].content,

        {
            role: "user",
            parts: functionResponses
        }
    ];

    let responseFinal;

    try {

        responseFinal = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: history,

            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                maxOutputTokens: 500,
                thinkingConfig: {
                    thinkingLevel: "low"
                },
                tools,
                toolConfig
            }
        });

    } catch (error) {

        console.error("Error de Gemini:", error);
        const errorGemini = identificarErrorGemini(error);

        throw new AsistenteError(
            errorGemini.tipo,
            errorGemini.mensaje,
            errorGemini.tipo === "CUOTA_DIARIA" ||
            errorGemini.tipo === "MUCHO_TRAFICO"
                ? 429
                : 500
        );
    }

    return responseFinal.text;
}

module.exports = {
    preguntarGemini
};