# CaféFlow Backend

EXCEL CAFEFLOW-PLATILLA-SCRUM
https://docs.google.com/spreadsheets/d/1uLeyWFG8C-NzjGinBdygrRYZwfu34rs6/edit?usp=sharing&ouid=103795475046358659572&rtpof=true&sd=true

Backend de CaféFlow construido con Node.js y Express, organizado para separar la
configuración, las rutas y la lógica de la aplicación.

## Instalación

Usa Node.js 22.x (las dependencias requieren Node.js 20.19.0 o posterior).

```bash
npm ci
```

## Configurar MongoDB Atlas

1. Crea una cuenta o inicia sesión en [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Crea un cluster y espera a que termine de aprovisionarse.
3. En **Database Access**, crea un usuario de base de datos y asígnale el rol
   `readWrite` sobre la base de datos `cafeflow`.
4. En **Network Access**, agrega tu dirección IP actual. Para desarrollo local,
   usa la opción **Add Current IP Address**.
5. En **Database**, selecciona **Connect**, elige **Drivers** y copia la URI de
   conexión. Comprueba que la base de datos de la URI sea `cafeflow` y sustituye
   los marcadores de usuario, contraseña y cluster por los valores de Atlas.
6. Copia el ejemplo de desarrollo a `.env.development` desde la raíz del
   proyecto:

   ```powershell
   Copy-Item .env.development.example .env.development
   ```

7. Abre `.env.development` localmente y reemplaza `MONGODB_URI` con la URI
   obtenida en Atlas. Define también `JWT_SECRET`. No compartas ese archivo:
   contiene credenciales.

## Ejecución

```bash
npm start
```

La aplicación carga `.env.development`, `.env.test` o `.env.production` según
`NODE_ENV` antes de leer la configuración. Las variables ya definidas en el
entorno (por ejemplo, las de CI) prevalecen sobre los archivos. Conecta a MongoDB
y solo entonces inicia Express. El servidor escucha en `PORT` o, si no está
definido, en el puerto `3000`. Faltantes de configuración se informan por nombre
de variable, nunca por su valor sensible, y detienen el proceso.

Los archivos `.env` reales están excluidos de Git. Usa
`.env.development.example`, `.env.test.example` y `.env.production.example` como
plantillas; no pongas secretos reales en esos ejemplos.

## Estructura

- `src/config`: configuración de la aplicación.
- `src/routes`: definición de rutas HTTP.
- `src/controllers`: manejo de solicitudes y respuestas.
- `src/services`: lógica de negocio.
- `src/models`: modelos de datos.

## Pruebas unitarias (SCRUM-17)

Instala dependencias con `npm ci` y ejecuta:

```bash
npm run test:unit
```

Jest genera cobertura en consola y en `coverage/unit/`, incluyendo todos los
archivos `src/**/*.js`, también los que aún no son ejecutados. Las pruebas
actuales verifican el middleware JSON de Express, el conector de MongoDB con
`mongoose.connect` simulado y el arranque del servidor con las dependencias
externas simuladas; no abren conexión a MongoDB ni escuchan en un puerto real.
También verifican registro, duplicados, login, hash de contraseñas, generación y
validación de JWT, errores, perfil y permisos con los modelos, bcrypt y JWT
simulados. El modelo no incluye un estado de cuenta activa/inactiva, por lo que
no hay una regla de usuario inactivo que probar.

## Pruebas de API con Postman y Newman (SCRUM-19)

Importa en Postman:

- Colección unificada: `tests/api/cafeflow.postman_collection.json`
- Ambiente de ejemplo sin credenciales reales:
  `postman/CafeFlow.postman_environment.json`

La colección unificada combina los casos de ambas colecciones: `GET /api/salud`,
registro con email único y rechazo de duplicados/datos inválidos, login correcto
e incorrecto, `/api/usuarios/me` sin token, con token inválido y válido, y el
rechazo 403 del rol cliente al listar usuarios. También verifica respuestas JSON,
ausencia de contraseñas/hash y el umbral inicial de tiempo de respuesta. El caso
de token vencido se conserva desactivado porque requiere un token firmado y
expirado con el secreto del ambiente local de pruebas.

Configura un ambiente de prueba, arranca el backend con `npm start` y ejecuta
Newman desde PowerShell:

```powershell
$env:API_BASE_URL = 'http://localhost:3000'
$env:POSTMAN_ENVIRONMENT = 'postman/CafeFlow.postman_environment.json'
$env:MAX_RESPONSE_TIME_MS = '2000'
npm run test:api
```

`API_BASE_URL` es opcional (por defecto `http://localhost:3000`); usa solamente
una instancia iniciada con una base de pruebas aislada.
`POSTMAN_ENVIRONMENT` puede apuntar a otro archivo de ambiente de Postman.
`MAX_RESPONSE_TIME_MS` es el umbral inicial (por defecto 2000 ms), no un SLA;
ajústalo con mediciones reales. Los scripts de colección verifican tiempo de
respuesta, JSON y ausencia de claves de contraseña/hash. El login captura
automáticamente `access_token` en `accessToken`.

El runner sale con código 2 e indica que las pruebas están pendientes si no
hay solicitudes habilitadas; así una colección vacía no parece aprobada. Usa
solo una base de pruebas aislada con `JWT_SECRET` y MongoDB configurados para
ejecutar la colección.

### Datos de prueba y limpieza segura

Ejecuta contra una base aislada para pruebas. El registro usa el prefijo
`cafeflow-` y genera un correo único; para limpiar, elimina únicamente esa
cuenta exacta, si confirmaste que la creó tu ejecución. No borres colecciones,
usuarios compartidos ni datos ajenos. El proyecto no implementa endpoint de
limpieza. No guardes credenciales ni tokens reales en los archivos versionados.

### Revisión de dependencias

Jest, Supertest y Newman se agregaron como dependencias de desarrollo; las
dependencias de producción y los scripts que ya existían se conservaron. La
instalación actual reportó advisories en dependencias transitivas: revisa
`npm audit` y acuerda con Esteban y Marlon la actualización de
`package.json`/`package-lock.json`; no se aplicaron arreglos automáticos.

## Preparar la entrega

Tras la revisión del equipo, puedes crear un commit con los archivos de esta
tarea y publicar la rama explícitamente:

```bash
git add package.json package-lock.json README.md tests scripts postman
git commit -m "test: add Jest and Newman test suites"
git push -u origin feature/SCRUM-17-19-pruebas-api
```
## Endpoint de salud

La API incluye una ruta de prueba para confirmar que el servicio responde:

- **Método:** GET
- **URL:** `http://localhost:3000/api/salud`
- **Body:** ninguno
- **Autenticación:** ninguna

En Postman, selecciona GET, pega la URL y envía la solicitud sin body ni
autenticación. Se espera una respuesta HTTP 200 con el estado de la API:

```json
{
  "estado": "ok",
  "mensaje": "API de CaféFlow funcionando correctamente"
}
```

El puerto es `3000` por defecto; si defines `PORT`, utiliza ese puerto en la URL.

## Registro, inicio de sesión y usuarios

Todas las solicitudes de autenticación usan JSON. Un registro público siempre
crea un usuario con rol `cliente`; los campos adicionales como `rol` se ignoran.
El email se guarda en minúsculas y no puede repetirse. La contraseña requiere al
menos 8 caracteres y se almacena cifrada con bcrypt.

### Registrar usuario

`POST /api/auth/register`

```json
{
  "nombre": "Nombre de usuario",
  "email": "persona@example.com",
  "password": "<tu-contraseña-de-al-menos-8-caracteres>"
}
```

Responde `201` con `{ "user": { "id", "nombre", "email", "rol" } }`. Los datos
inválidos responden `400`; un email registrado responde `409`.

### Iniciar sesión

`POST /api/auth/login`

```json
{
  "email": "persona@example.com",
  "password": "<tu-contraseña>"
}
```

Responde `200` con un token y el perfil público:

```json
{
  "access_token": "<token-JWT>",
  "user": {
    "id": "<id>",
    "nombre": "Nombre de usuario",
    "email": "persona@example.com",
    "rol": "cliente"
  }
}
```

Las credenciales incorrectas responden `401` con un mensaje genérico. El perfil
no incluye la contraseña ni su hash.

### Perfil y permisos

- `GET /api/usuarios/me`: requiere el encabezado `Authorization` con un token
  Bearer válido y devuelve el perfil del usuario autenticado.
- `GET /api/usuarios`: requiere un token válido de un usuario `admin`; devuelve
  únicamente `id`, `nombre`, `email` y `rol` de cada usuario.
- La ruta pública de salud no requiere autenticación.
- Un token ausente, inválido o expirado responde `401`; un usuario autenticado
  sin el rol requerido responde `403`.

### Configurar JWT

Añade estas variables a tu `.env.development` local, que no debe subirse al
repositorio:

```dotenv
JWT_SECRET=<secreto-aleatorio-largo>
JWT_EXPIRES_IN=1h
```

`JWT_SECRET` es obligatorio para firmar y validar tokens. Genera un valor local
aleatorio, por ejemplo, con
`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`;
no compartas ni guardes el resultado en Git. `JWT_EXPIRES_IN` define la duración
aceptada por jsonwebtoken (por ejemplo, `15m` o `1h`) y usa `1h` si no se define.

### Crear el primer administrador

1. Registra una cuenta propia con `POST /api/auth/register` y una contraseña
   elegida por ti; el endpoint público siempre asigna el rol `cliente`.
2. Con una cuenta autorizada, abre **Data Explorer** de MongoDB Atlas y la
   colección `cafeflow.usuarios`.
3. Busca esa cuenta por su email y cambia únicamente su campo `rol` a `admin`.
   Haz esta operación solo como administrador de la base de datos; no habilites
   la asignación pública de roles ni guardes credenciales en el repositorio.

## Pruebas y rendimiento

- Integración, configuración y limitaciones: [`tests/integration/README.md`](./tests/integration/README.md).
- Planes de carga/estrés JMeter, ejecución y reporte: [`performance/jmeter/README.md`](./performance/jmeter/README.md).

## Integración continua (GitHub Actions)

El workflow `.github/workflows/ci.yml` se ejecuta en `pull_request` hacia `main`
y en `push` a `main`, con Node.js 22.x y un servicio MongoDB 8.0 aislado y
efímero. Reutiliza la URI exclusiva `MONGODB_URI_TEST` para integración y para
la API en modo `test`; no requiere secretos de producción ni secretos de
repositorio.

Para reproducir localmente, inicia una instancia local de MongoDB y configura
un archivo `.env.test` (puedes partir de `.env.test.example`), o exporta las
variables en el entorno. En PowerShell:

```powershell
$env:NODE_ENV = "test"
$env:MONGODB_URI_TEST = "mongodb://127.0.0.1:27017/cafeflow_test"
$env:JWT_SECRET = "secreto-local-solo-para-pruebas"
$env:JWT_EXPIRES_IN = "1h"
$env:PORT = "3000"
npm ci
npm run test:unit
npm run test:integration -- --coverage --coverageDirectory=coverage/integration
```

Las pruebas unitarias no requieren MongoDB. Las de integración conectan a
`MONGODB_URI_TEST`, ejecutan registro, login, perfil y permisos con MongoDB real,
y eliminan solamente los usuarios que cada ejecución creó. La colección Newman
crea un usuario con email único que permanece en la base local de pruebas
porque no existe endpoint público de borrado; CI descarta ese usuario al
destruir el servicio MongoDB efímero. Usa siempre una base desechable de pruebas.

En otra terminal, inicia la API y espera a que responda antes de ejecutar la
colección:

```powershell
$env:NODE_ENV = "test"
$env:MONGODB_URI_TEST = "mongodb://127.0.0.1:27017/cafeflow_test"
$env:JWT_SECRET = "secreto-local-solo-para-pruebas"
$env:JWT_EXPIRES_IN = "1h"
$env:PORT = "3000"
node src/server.js
```

En otra terminal, espera por HTTP con el mismo límite de 60 segundos usado por
CI:

```powershell
$deadline = (Get-Date).AddSeconds(60)
$healthy = $false
while ((Get-Date) -lt $deadline) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:3000/api/salud" -TimeoutSec 2
    if ($response.StatusCode -eq 200) { $healthy = $true; break }
  } catch { }
  Start-Sleep -Seconds 1
}
if (-not $healthy) { throw "La API no respondió dentro de 60 segundos." }
```

Una vez que el sondeo responda correctamente, ejecuta en esa misma terminal la
colección unificada `tests/api/cafeflow.postman_collection.json` con Newman:

```powershell
npm run test:api
```

La salida CLI de Newman es el reporte de la suite y puede guardarse localmente
con `Tee-Object -FilePath reports/newman.log`. El log de la API queda en la
terminal donde se inició. No reutilices una base de desarrollo o producción para
estas pruebas.

Los archivos reales `.env.development`, `.env.test` y `.env.production` no se
suben a Git. `MONGODB_URI_TEST` es obligatorio y solo se usa con `NODE_ENV=test`;
la API no cae a `MONGODB_URI` si falta. `MONGODB_URI` y `JWT_SECRET` son
obligatorios para iniciar la API en desarrollo o producción; `JWT_EXPIRES_IN` y
`PORT` son opcionales. En CI, la URI y la clave JWT son valores efímeros y
exclusivos para pruebas, definidos en el workflow, no secretos productivos.

En GitHub, abre **Actions**, el workflow y la ejecución para consultar logs. En
la página de la ejecución descarga el artefacto `cafeflow-ci-reports` para ver
cobertura (`coverage/`), el log de inicio (`reports/api.log`) y el resumen de
Newman (`reports/newman.log`); se publica incluso cuando fallan los pasos de
prueba. No se conserva el cuerpo de respuestas de login en un reporte JSON.

El pipeline falla ante `npm ci`, una suite fallida o ausente, una URI test
inválida, un error de conexión, una API que no responda a `/api/salud` dentro de
60 segundos o una prueba Newman fallida. Newman valida salud, registro, rechazo
de duplicados y datos inválidos, login correcto e incorrecto, perfil autenticado
y denegación de acceso de clientes a la lista administrativa. Las suites
unitarias e integración cubren validaciones y flujos reales contra MongoDB.
