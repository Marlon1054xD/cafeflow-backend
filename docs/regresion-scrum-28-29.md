# Regresión CaféFlow — SCRUM-28 y SCRUM-29

## Entorno reproducible en Windows / PowerShell

Requisitos: Node.js 20.19 o posterior, npm, Chrome o Chromium y MongoDB local.
La base debe ser desechable y su nombre debe incluir `test`; no apuntes las
variables de prueba a datos de desarrollo compartidos o producción.

Desde la raíz del repositorio, instala las dependencias y crea la configuración
de prueba local:

```powershell
npm ci
Set-Location frontend
npm ci
Set-Location ..
Copy-Item .env.test.example .env.test
notepad .env.test
```

En `.env.test`, configura `MONGODB_URI_TEST` (por defecto
`mongodb://127.0.0.1:27017/cafeflow_test`), `JWT_SECRET` local y
`CORS_ORIGINS=http://localhost:5173`. El archivo no se versiona. Comprueba que
MongoDB esté escuchando en el puerto `27017` antes de iniciar las suites:

```powershell
Test-NetConnection 127.0.0.1 -Port 27017
```

Abre tres terminales PowerShell, todas desde la raíz del repositorio.

Terminal 1 — API Express real en `http://localhost:3000`:

```powershell
$env:NODE_ENV = 'test'
$env:PORT = '3000'
$env:CORS_ORIGINS = 'http://localhost:5173'
npm start
```

Terminal 2 — Vite en `http://localhost:5173`, apuntando a la API de prueba:

```powershell
Set-Location frontend
$env:VITE_API_BASE_URL = 'http://localhost:3000'
npm run dev -- --host localhost --port 5173
```

Terminal 3 — suites backend, API, frontend y navegador:

```powershell
Set-Location 'C:\ruta\cafeflow-backend'
$env:NODE_ENV = 'test'
$env:API_BASE_URL = 'http://localhost:3000'
$env:FRONTEND_BASE_URL = 'http://localhost:5173'
$env:TEST_ADMIN_EMAIL = 'admin-e2e@example.test'
$env:TEST_ADMIN_PASSWORD = '<clave-local-de-al-menos-8-caracteres>'

npm run test:unit
npm run test:integration
npm run seed:test-admin
npm run test:api
Set-Location frontend
npm test -- --runInBand
npm run lint
npm run build
Set-Location ..
npm run test:e2e
```

`test:integration` lee `.env.test` y verifica la URI antes de conectarse. Para
Newman, `seed:test-admin` crea/actualiza el admin exclusivamente en esa base y
`test:api` consume `API_BASE_URL`. El frontend también puede tener sus Jest,
lint y build ejecutados por separado sin servicios externos.

`npm run test:e2e` es el comando único para los escenarios Selenium; necesita
ambos servidores activos y acepta:

| Variable | Predeterminado | Uso |
|---|---|---|
| `API_BASE_URL` | `http://localhost:3000` | Origen de la API; el runner comprueba `/api/salud` y CORS. |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | Origen de React/Vite. |
| `VITE_API_BASE_URL` | `http://localhost:3000` en `.env.example` | Origen que usa React al llamar al backend. |
| `MONGODB_URI_TEST` | `mongodb://127.0.0.1:27017/cafeflow_test` | Base aislada de fixtures E2E. |
| `CORS_ORIGINS` | Sin valor | Debe incluir el origen exacto de Vite. |
| `E2E_HEADLESS` | `true` | Usa `false` para mostrar Chrome. |

El runner crea un cliente con email y clave aleatorios y una cerveza única
`Lager Selenium …`, disponible a 8.500 COP. No requiere admin para estos
fixtures. Luego de ejecutar los casos, borra pedidos relacionados con el usuario
y la cerveza de esa ejecución, además de esos dos documentos, por sus IDs. No
vacía colecciones ni toca otros datos. Si la ejecución se interrumpe antes del
bloque `finally`, elimina únicamente esos documentos manualmente por sus IDs o
descarta la base de pruebas.

Los casos automatizados usan únicamente la UI para login, selección de cerveza,
cantidad y consulta del pedido. El runner falla de forma explícita si la API,
Vite o CORS no están disponibles. Si falla un caso con Chrome abierto, guarda
una captura PNG en `reports/e2e/`; las contraseñas no se escriben en logs ni en
el reporte.

## Cobertura Selenium

- Login válido y navegación a `/catalogo`.
- Tarjeta de la Lager fixture a 8.500 COP, pedido de 2 unidades y navegación a
  `/pedidos/:id`.
- Detalle visible con nombre, cantidad 2, total 17.000 COP y estado `pendiente`.
- Contraseña incorrecta: error visible y permanencia en `/login`.
- Los Page Objects contienen los selectores `By.id`, `By.css` y `By.xpath`,
  esperas explícitas y acciones del navegador; las aserciones residen en los
  archivos de prueba.

## Reporte de ejecución

Fecha: 2026-11-27. Entorno: Windows, Node.js 22.20.0, npm 10.9.3, Chrome
158.0.8127.37. Rama: `feature/SCRUM-28-29-selenium-regresion`; base de trabajo
`155ca1484a570733f9d00a3ae68f4899aed12bea`.

| Suite | Resultado |
|---|---|
| Backend unitarias (`npm run test:unit`) | PASÓ — 11 suites, 77 pruebas. |
| Backend integración (`npm run test:integration`) | BLOQUEADA parcialmente — 7 pruebas pasaron y 2 suites fallaron al conectar con `127.0.0.1:27017` (`ECONNREFUSED`); MongoDB no estaba disponible y `.env.test` no estaba configurado. |
| Newman (`npm run test:api`) | BLOQUEADA — 39 solicitudes y 117 aserciones fallaron al conectar con `127.0.0.1:3000`; la API no estaba activa. |
| Jest frontend (`npm test -- --runInBand`) | PASÓ — 1 suite, 6 pruebas. |
| Oxlint (`npm run lint`) | PASÓ — sin errores. |
| Build frontend (`npm run build`) | PASÓ — Vite 8.3.8. |
| Selenium (`npm run test:e2e`) | BLOQUEADA en preflight: `API_BASE_URL` no responde en `http://localhost:3000/api/salud`. Los escenarios UI no se ejecutaron y no se generó captura de un caso; el runner termina antes de abrir Chrome. La comprobación aislada de Chrome WebDriver headless sí pasó. |

Commit funcional probado: `05c80468148382f1185841d86a036b2910084c6a`
(SCRUM-28/29). Defectos funcionales: no determinables sin MongoDB y los
servicios activos. Bloqueos reproducibles:
iniciar MongoDB, configurar `.env.test`, arrancar la API y Vite con las variables
de esta guía, y repetir integración, Newman y `npm run test:e2e`. El fallo de
Selenium fue de precondiciones del entorno, no de un caso de navegador; por ello
no hay evidencia visual del flujo ni resultados que respalden el cierre de
SCRUM-24, SCRUM-25 o SCRUM-26.
