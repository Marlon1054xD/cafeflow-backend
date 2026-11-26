# Frontend de CafeFlow

Aplicacion React + Vite para iniciar sesion, consultar el catalogo y crear y
consultar pedidos del backend. Las pruebas de componentes Jest cubren los flujos
principales de autenticacion, catalogo y pedidos (ticket SCRUM-27); Selenium POM
y la regresion general siguen fuera del alcance (SCRUM-28 y SCRUM-29).

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
- Desde una cerveza disponible se puede seleccionar una cantidad entera positiva
  y crear un pedido con `POST /api/pedidos`; el detalle se consulta en
  `/pedidos/:id` con `GET /api/pedidos/:id`. El JWT se envía en ambas rutas y
  permanece solo en memoria.
- Selectores estables para el flujo de pedidos:
  - `[data-testid="pedir-cerveza"]` para elegir una cerveza disponible
  - `#pedido-cantidad` y `#pedido-confirmar` para confirmar la cantidad
  - `[data-testid="pedido-detalle"]` para el contenedor del detalle
  - `[data-testid="pedido-total"]` y `[data-testid="pedido-estado"]` para los
    valores devueltos por la API
  - `[data-testid="pedido-error"]` para errores de creación o consulta

## Pruebas de componentes React (SCRUM-27)

Las pruebas validan comportamientos visibles de la aplicacion mediante Jest,
`jest-environment-jsdom`, `babel-jest`, Babel, React Testing Library,
`@testing-library/jest-dom` y `user-event`. `jsdom` renderiza React en un entorno
de navegador simulado; Vite conserva su configuracion de compilacion. El contexto
real de sesion, las rutas y los componentes no se simulan.

### Instalacion y ejecucion

Desde esta carpeta (`frontend/`), instala las dependencias con `npm ci` y
ejecuta todas las pruebas con:

```powershell
npm test -- --runInBand
```

Tambien puedes ejecutar `npm test` para la ejecucion habitual de Jest.

### Escenarios cubiertos

1. Login con respuesta 401: se presenta el error de credenciales y la ruta
   permanece en `/login`.
2. Login exitoso: el proveedor real conserva el usuario/token en memoria y la
   aplicacion navega a `/catalogo`.
3. Catalogo vacio: se presenta el estado vacio devuelto por `getCervezas()`.
4. Catalogo con productos: se muestran los nombres y los precios COP, y la
   cerveza agotada no puede seleccionarse.
5. Pedido confirmado: se envia el ID, la cantidad elegida y el JWT; se consulta
   el detalle y se comprueba total de 17.000 COP y estado `pendiente`.
6. Cantidad cero: la validacion nativa del campo numerico impide enviar el
   pedido y no se llama a la funcion de creacion.

Los casos se encuentran en `src/__tests__/App.test.jsx`. La configuracion Jest
esta en `jest.config.cjs`, Babel transforma JSX en `babel.config.cjs` y
`src/test/setup.js` inicializa `jest-dom`. Babel reemplaza en el contexto de
pruebas `import.meta.env` de Vite por `process.env`; la compilacion normal sigue
usando el tratamiento de Vite sin cambios.

El mock se limita a `src/api/client.js`, frontera HTTP de la aplicacion. Sus
funciones (`login`, `getCervezas`, `crearPedido` y `getPedido`) devuelven las
estructuras reales que esperan los componentes y `ApiError` conserva `status`
para reproducir el HTTP 401. No se conectan servicios externos y los casos no
requieren backend, MongoDB, cuentas reales ni credenciales reales. Cada prueba
inicia una sesion independiente y limpia los mocks y el almacenamiento web.

### Resultados de verificacion

Verificacion ejecutada desde `frontend/`:

- `npm ci`: correcto; instalo 762 paquetes y audito 763. npm informo 19
  vulnerabilidades en dependencias (1 baja y 18 moderadas).
- `npm test -- --runInBand`: correcto; 1 suite y 6 pruebas pasaron, 0 fallaron.
- `npm run lint`: correcto; Oxlint finalizo sin errores.
- `npm run build`: correcto; Vite 8.3.8 genero `dist/` sin errores.
- Comprobaciones de regresion temporales: las pruebas fallaron como se esperaba
  al mutar el mensaje 401, la cantidad enviada y el total visualizado; las tres
  modificaciones de produccion se revirtieron y la suite limpia paso de nuevo.
