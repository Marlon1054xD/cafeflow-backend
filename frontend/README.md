# Frontend de CafeFlow

Aplicacion React + Vite para iniciar sesion y consultar el catalogo del backend.
La rama entrega `/login` y `/catalogo`; pedidos, Jest y Selenium POM quedan fuera
de este alcance.

## Requisitos

- Node.js 20.19 o posterior (en el proyecto se recomienda Node.js 22.x).
- MongoDB local o una base desechable de pruebas para ejecutar el backend.

## Configuracion y ejecucion local

1. En la raiz del repositorio, prepara `.env.development` a partir del ejemplo.
   Define una base local y un secreto JWT propio; no subas el archivo:

   ```powershell
   Copy-Item .env.development.example .env.development
   ```

   Configura `MONGODB_URI`, `JWT_SECRET` y `CORS_ORIGINS` en el backend. Para el
   origen local de Vite, `CORS_ORIGINS=http://localhost:5173`. Si tambien usas
   `127.0.0.1` en el navegador, agrega ese origen exacto separado por coma.

2. Instala y arranca la API en una terminal, desde la raiz del repositorio:

   ```powershell
   npm ci
   npm start
   ```

   La API escucha en `http://localhost:3000` por defecto. Consulta
   [`docs/rutas-api.md`](../docs/rutas-api.md) para el contrato y CORS.

3. En otra terminal, desde `frontend/`, crea tu archivo local de variables,
   instala dependencias y levanta Vite:

   ```powershell
   Copy-Item .env.example .env.local
   npm ci
   npm run dev
   ```

   `frontend/.env.example` configura `VITE_API_BASE_URL=http://localhost:3000`.
   Cambia ese valor solo si el backend escucha en otra URL. Vite sirve la app en
   `http://localhost:5173`.

Los archivos `.env.development` y `frontend/.env.local` son locales e ignorados
por Git. No incluyas secretos ni tokens en variables `VITE_*`: se publican en el
bundle del navegador. La sesion JWT se conserva unicamente en memoria y se
limpia al cerrar sesion o recargar la pagina.

## Datos de prueba

Usa una base desechable, nunca una base ni cuentas de produccion. Para el flujo
de integracion de React/Selenium descrito en
[`docs/rutas-api.md`](../docs/rutas-api.md), registra
`react-selenium@example.test` con la contrasena de prueba `react-selenium-password`.
La API publica admite `POST /api/auth/register`; el registro crea un cliente.

Para probar con la base desechable, crea `.env.test` desde `.env.test.example`,
define `MONGODB_URI_TEST`, `JWT_SECRET` y
`CORS_ORIGINS=http://localhost:5173`, y arranca la API en modo test:

```powershell
Copy-Item .env.test.example .env.test
$env:NODE_ENV = 'test'
npm start
```

La ruta de alta de cervezas requiere admin. En otra terminal PowerShell con la
misma configuracion de base y credenciales solo de prueba, prepara un
administrador:

```powershell
$env:NODE_ENV = 'test'
$env:MONGODB_URI_TEST = 'mongodb://127.0.0.1:27017/cafeflow_test'
$env:JWT_SECRET = 'secreto-local-solo-para-pruebas'
$env:TEST_ADMIN_EMAIL = 'admin-local@example.test'
$env:TEST_ADMIN_PASSWORD = 'reemplazar-por-clave-local'
npm run seed:test-admin
```

Autentica al admin en `POST /api/auth/login` y usa su `access_token` para crear
una cerveza de prueba en `POST /api/cervezas` con:

```json
{
  "nombre": "Lager React Selenium",
  "descripcion": "Cerveza de prueba automatizada",
  "precio": 8500,
  "disponible": true
}
```

Envia el encabezado `Authorization: Bearer <access_token>` y `Content-Type:
application/json`. Mantén las contraseñas y tokens solo en el entorno local.
El catálogo es público y puede cargarse sin autenticar; el formulario usa
`POST /api/auth/login`.

## Integracion para el equipo

- `src/api/client.js` exporta `apiRequest`, `login`, `getCervezas` y `ApiError`.
  Acepta `token` como opcion para enviar `Authorization: Bearer ...` en futuras
  llamadas protegidas, por ejemplo pedidos.
- `src/auth/SessionContext.jsx` expone `useSession()` con `session`, `login` y
  `logout`. No escribe JWT en `localStorage`, cookies ni `sessionStorage`.
- Selectores estables para Selenium:
  - `#login-email`, `#login-password`, `#login-submit`
  - `[data-testid="login-error"]` para errores de credenciales/API
  - `[data-testid="catalogo"]` para la vista de catálogo
  - `[data-testid="cerveza-card"]` para cada producto; cada tarjeta tambien
    expone `data-cerveza-id="<id>"` y muestra su identificador.
- `/catalogo` requiere sesion en memoria; al cerrar sesion se vuelve a `/login`.
