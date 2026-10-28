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

## Enlaces que deben completarse antes de entregar

- Repositorio GitHub: https://github.com/Marlon1054xD/cafeflow-backend
- Ejecucion exitosa de GitHub Actions:
  https://github.com/Marlon1054xD/cafeflow-backend/actions
- Hoja SCRUM del equipo: usar el enlace existente en el README y confirmar
  acceso de lectura para el docente.
- Tablero Jira:
  https://nightowlsxd.atlassian.net/jira/software/projects/SCRUM/boards/1?filter=&groupBy=none
- Coleccion publica/compartida de Postman: **publicar desde la cuenta del equipo
  y pegar aqui el enlace**.
- Reporte HTML JMeter (carga y seguridad JWT):
  [`evidencias/jmeter-rutas-jwt/index.html`](./evidencias/jmeter-rutas-jwt/index.html).

Los enlaces a GitHub Actions abren la lista de ejecuciones, no prueban por si
mismos un resultado exitoso. Copia el enlace de una ejecucion verde despues de
subir los cambios y de que termine el workflow.

## Validacion local realizada

- Jest: 75 pruebas unitarias aprobadas en 11 suites; cobertura de lineas
  reportada por Jest: 98.41 %.
- Integracion: 10 escenarios contra MongoDB real aprobados, ademas de 7 pruebas
  HTTP/configuracion de Jest.
- Newman: 15 solicitudes, 45 aserciones y 0 fallos contra la API local.
- JMeter: 42 muestras, 0 errores; promedio 117.26 ms, P95 437.85 ms,
  throughput 11.61 solicitudes/s. Ver
  [`resumen JMeter`](./evidencias/jmeter-resumen.md).

Estos resultados son locales; no son evidencia de que los cambios ya esten
publicados ni de que el workflow remoto de GitHub haya pasado.

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
