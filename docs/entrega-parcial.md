# Checklist de entrega del parcial

Esta lista distingue los archivos que se pueden verificar en el repositorio de
los enlaces que requieren publicar o compartir recursos con las cuentas del
equipo. No afirma que haya una ejecucion remota de CI o una coleccion publica
hasta que se compruebe en esas plataformas.

## Evidencias en el repositorio

- [x] API REST Node.js/Express y MongoDB/Mongoose con arquitectura por capas.
- [x] Contrato de endpoints: [`rutas-api.md`](./rutas-api.md).
- [x] Suite Jest: `npm run test:unit`.
- [x] Integracion con MongoDB real: `npm run test:integration`.
- [x] GitHub Actions ejecuta pruebas unitarias, integracion y Newman:
  [workflow](../.github/workflows/ci.yml).
- [x] Ejecucion verde de CI confirmada antes de estos cambios (28 de octubre
  de 2026):
  https://github.com/Marlon1054xD/cafeflow-backend/actions/runs/40766759536.
- [x] Coleccion y ambiente de ejemplo Postman con rutas de cliente y admin:
  [`CafeFlow.postman_collection.json`](../postman/CafeFlow.postman_collection.json)
  y [`CafeFlow.postman_environment.json`](../postman/CafeFlow.postman_environment.json).
- [x] Plan JMeter JWT y cinco rutas privadas:
  [`carga-rutas-privadas-jwt.jmx`](../performance/jmeter/carga-rutas-privadas-jwt.jmx).
- [x] Reporte HTML y resumen medido de JMeter:
  [`reporte HTML`](./evidencias/jmeter-rutas-jwt/index.html) y
  [`resumen de métricas`](./evidencias/jmeter-resumen.md).
- [x] Backlog inicial importable a la hoja SCRUM:
  [`scrum-backlog.csv`](./scrum-backlog.csv).

## Enlaces y accesos externos pendientes de verificar

- Repositorio GitHub: https://github.com/Marlon1054xD/cafeflow-backend
- URL publica/compartida de Postman: **pendiente de publicar y confirmar**.
- Jira y permisos del equipo: **pendiente de verificar**:
  https://nightowlsxd.atlassian.net/jira/software/projects/SCRUM/boards/1?filter=&groupBy=none
- Acceso del equipo a MongoDB Atlas: **pendiente de verificar**. Las pruebas
  locales de este cierre usan una base MongoDB desechable local.
- Video de entrega: **pendiente de grabar y compartir**.
- Hoja SCRUM del equipo: confirmar acceso externo de lectura; la plantilla
  local `CafeFlow-Plantilla-Scrum.xlsx` contiene HE-01 y SCRUM-6 a SCRUM-9.
- Reporte HTML JMeter (carga y seguridad JWT):
  [`evidencias/jmeter-rutas-jwt/index.html`](./evidencias/jmeter-rutas-jwt/index.html).

La ejecucion enlazada es una ejecucion verde anterior a estos cambios; no es
evidencia de que esta rama haya pasado CI. Verifica una nueva ejecucion al
publicar una solicitud de cambios.

## Validacion local de `feature/cierre-sprint-2`

- `npm ci`: completado. npm reporto 39 avisos de auditoria en dependencias
  instaladas (24 moderados, 14 altos, 1 critico); no se aplicaron upgrades
  automaticos fuera del alcance.
- `npm run test:unit`: 77 pruebas aprobadas en 11 suites.
- `npm run test:integration`: 9 pruebas Jest aprobadas; incluye 10 escenarios
  existentes contra MongoDB y los nuevos drivers Bottom-up y Supertest, todos
  ejecutados contra una instancia MongoDB local desechable.
- `npm run test:api`: Newman aprobo 39 solicitudes y 117 aserciones, sin fallos,
  contra la API local y la misma base aislada.
- JMeter: el perfil local acotado no se ejecuto porque el comando `jmeter` no
  esta disponible en `PATH`. No se generaron nuevas metricas. Se conserva el
  reporte JWT anterior (42 muestras, 0 errores, P95 437.85 ms, throughput
  11.61 solicitudes/s) en [`resumen JMeter`](./evidencias/jmeter-resumen.md).

Son resultados locales de esta rama; no demuestran que los cambios hayan sido
publicados ni que una ejecucion remota de CI los haya validado.

## Hoja SCRUM

Importa `scrum-backlog.csv` en Google Sheets y sincroniza sus historias con el
tablero Jira, asignando personas, prioridad, fechas y estado reales del equipo.
No se inventan responsables ni fechas en esta plantilla.

La consigna compartida contiene una discrepancia: una parte solicita 4 sprints y
otra dice que deben ser 3. La plantilla usa cuatro porque la metodologia de
entregas progresivas especifica 4; si el docente confirma que son 3, ajusta las
asignaciones antes de entregar.

## Publicar y ejecutar

1. En Postman importa la coleccion y el ambiente de ejemplo. Publica/compartela
   desde tu cuenta y pega el enlace resultante en esta lista. Define `adminEmail`
   y `adminPassword` con una cuenta admin de pruebas; nunca guardes credenciales
   verdaderas en Git.
2. Ejecuta `npm run test:unit` y `npm run test:integration` contra una base
   MongoDB aislada. Guarda los resultados que emita la terminal.
3. En JMeter revisa el reporte HTML ya generado y, si necesitas repetirlo,
   crea `performance/jmeter/users.local.csv` ignorado por Git con una cuenta
   admin exclusiva de pruebas; sigue el README de JMeter.
4. Sube la documentacion, planes y pruebas al repositorio. Confirma que el
   workflow de GitHub Actions finalice correctamente y copia el enlace de esa
   ejecucion.
5. Graba un video de hasta 3 minutos mostrando la hoja SCRUM, Jira, documento
   de rutas, ejecucion verde de Actions, resultados de pruebas, reporte JMeter
   y enlace compartido de Postman. No muestres secretos en pantalla.

## Guion sugerido para el video (3 minutos)

- `0:00-0:25`: proyecto, equipo y hoja SCRUM/Jira.
- `0:25-0:50`: arquitectura y documento de endpoints.
- `0:50-1:20`: GitHub Actions y pruebas Jest/Newman.
- `1:20-1:50`: conteo de pruebas unitarias y de integracion.
- `1:50-2:30`: reporte JMeter; login, ausencia de token y cinco rutas JWT.
- `2:30-3:00`: coleccion/ambiente Postman compartidos y enlaces de entrega.
