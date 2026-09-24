const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function verificarApi() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    console.log(`Health check: HTTP ${response.status}`);
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok || data.ok !== true || data.database !== 'connected' || data.schema !== 'valid') {
      process.exitCode = 1;
      return;
    }

    console.log('API, conexión MySQL y esquema validados correctamente.');
  } catch (error) {
    console.error(`No se pudo consultar ${API_URL}/health: ${error.message}`);
    process.exitCode = 1;
  }
}

verificarApi();
