Repositorio dedicado a DPS Teorico, proyecto de catedra de 2026: "Smart Campus".

## Asistencia automática por IoT

El API Express debe ejecutarse en el puerto `3001` y Next.js en el puerto `3000`.
Antes de iniciar el API, ejecuta `smartcampus-db.sql` en MySQL para crear las tablas
de aulas, dispositivos y horarios.

### Configurar un dispositivo

La clave nunca se guarda en texto plano. Para generar el valor de `api_key_hash`:

```sql
INSERT INTO Aulas (id_aula, nombre_aula) VALUES ('A201', 'Aula A-201');
INSERT INTO Dispositivos (id_dispositivo, id_aula, api_key_hash)
VALUES ('ESP32-A201', 'A201', SHA2('clave-secreta-del-dispositivo', 256));
```

Un dispositivo registra una lectura con:

```http
POST /api/asistencias/dispositivo
x-device-key: clave-secreta-del-dispositivo
Content-Type: application/json
```

```json
{
	"id_dispositivo": "ESP32-A201",
	"carnet": "RG210145"
}
```

El servidor usa el aula del dispositivo, el día y la hora para encontrar la
materia en `Horarios`. El estudiante debe estar inscrito en el grupo. La
consulta `GET /api/asistencias/estudiante/:id_estudiante` devuelve las últimas
cinco asistencias, ordenadas de la más reciente a la más antigua.

### Inicio de sesión

`POST /api/auth/login` recibe `usuario` (identificador o correo) y `contraseña`.
Busca coincidencia exacta en estudiantes y profesores y devuelve `usuario` con
`id_usuario`, nombres, apellidos, correo, rol y, para profesores, departamento.
Nunca devuelve `contraseña` ni `codigo_qr`.

Para apuntar el frontend a otro API, define `NEXT_PUBLIC_API_URL`, por ejemplo:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Integrantes:
- 
- 
- 
- 
- 
