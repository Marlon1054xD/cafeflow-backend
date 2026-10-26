# CaféFlow Backend
EXCEL CAFEFLOW-PLATILLA-SCRUM
https://docs.google.com/spreadsheets/d/1uLeyWFG8C-NzjGinBdygrRYZwfu34rs6/edit?usp=sharing&ouid=103795475046358659572&rtpof=true&sd=true

Backend de CaféFlow construido con Node.js y Express, organizado para separar la
configuración, las rutas y la lógica de la aplicación.

## Instalación

```bash
npm install
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
6. Copia el archivo de ejemplo a `.env` desde la raíz del proyecto:

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell, usa `Copy-Item .env.example .env`.
7. Abre `.env` localmente y reemplaza el valor de `MONGODB_URI` con la URI
   obtenida en Atlas. No compartas ese archivo: contiene credenciales.

## Ejecución

```bash
npm start
```

La aplicación carga las variables de `.env`, conecta a MongoDB y solo entonces
inicia Express. El servidor escucha en el puerto indicado por `PORT` o, si no
está definido, en el puerto `3000`. Si `MONGODB_URI` falta o la conexión falla,
el proceso informa el problema sin mostrar credenciales y termina con un código
de error, sin iniciar el servidor.

## Estructura

- `src/config`: configuración de la aplicación.
- `src/routes`: definición de rutas HTTP.
- `src/controllers`: manejo de solicitudes y respuestas.
- `src/services`: lógica de negocio.
- `src/models`: modelos de datos.

## Pruebas unitarias (SCRUM-17)

Instala dependencias con `npm install` y ejecuta:

```bash
npm run test:unit
```

Jest genera cobertura en consola y en `coverage/`, incluyendo todos los
archivos `src/**/*.js`, también los que aún no son ejecutados. Las pruebas
actuales verifican el middleware JSON de Express y el conector de MongoDB con
`mongoose.connect` simulado; no abren conexión a MongoDB. Todavía no existen
servicios de autenticación ni middleware JWT/roles, por lo que las pruebas de
registro, duplicados, login, tokens y permisos dependen de la implementación
de esas piezas.

## Pruebas de API con Postman y Newman (SCRUM-19)

Importa en Postman:

- Colección: `postman/CafeFlow.postman_collection.json`
- Ambiente de ejemplo sin credenciales reales:
  `postman/CafeFlow.postman_environment.json`

La colección prepara registro con email único, registro duplicado, datos
inválidos, login correcto e incorrecto, y `/api/usuarios/me` sin token, con
token inválido, vencido y válido. Todos esos casos están desactivados y
claramente etiquetados como pendientes: este backend aún no tiene esos
endpoints. El caso de token vencido requiere un token firmado y expirado de un
ambiente local de pruebas. No hay un endpoint de permisos insuficientes ni de
salud documentado, por eso no se inventan solicitudes para esos casos.

Cuando los endpoints existan, configura un ambiente de prueba, arranca el
backend con `npm start` y ejecuta Newman desde PowerShell:

```powershell
$env:API_BASE_URL = 'http://localhost:3000'
$env:POSTMAN_ENVIRONMENT = 'postman/CafeFlow.postman_environment.json'
$env:MAX_RESPONSE_TIME_MS = '2000'
npm run test:api
```

`API_BASE_URL` es opcional (por defecto `http://localhost:3000`).
`POSTMAN_ENVIRONMENT` puede apuntar a otro archivo de ambiente de Postman.
`MAX_RESPONSE_TIME_MS` es el umbral inicial (por defecto 2000 ms), no un SLA;
ajústalo con mediciones reales. Los scripts de colección verifican tiempo de
respuesta, JSON y ausencia de claves de contraseña/hash. El login captura
automáticamente `access_token` en `accessToken`.

El runner sale con código 2 e indica que las pruebas están pendientes si no
hay solicitudes habilitadas; así una colección vacía no parece aprobada.
Confirma con Luis/equipo los códigos HTTP sugeridos en los casos antes de
habilitarlos.

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
