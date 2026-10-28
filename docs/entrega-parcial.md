# Checklist de entrega del parcial

Esta lista distingue las evidencias verificadas de las acciones que requieren
permisos de las cuentas del equipo. No afirma que la hoja SCRUM sea editable ni
que exista una coleccion publica de Postman sin comprobarlo.

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
- [x] Guion cronometrado del video:
  [`guion-video.md`](./guion-video.md).

## Enlaces que deben completarse antes de entregar

- Repositorio GitHub: https://github.com/Marlon1054xD/cafeflow-backend
- PR #10 fusionado:
  https://github.com/Marlon1054xD/cafeflow-backend/pull/10
- Ejecucion CI verde para el commit `6c04e3386a78ec5abddabc0c11325353bd8ed7e6`:
  https://github.com/Marlon1054xD/cafeflow-backend/actions/runs/40729107307
- Hoja SCRUM (el acceso actual permite solo ver; hace falta permiso de edicion
  para actualizarla):
  https://docs.google.com/spreadsheets/d/1uLeyWFG8C-NzjGinBdygrRYZwfu34rs6/edit?usp=sharing&ouid=103795475046358659572&rtpof=true&sd=true
- Tablero Jira:
  https://nightowlsxd.atlassian.net/jira/software/projects/SCRUM/boards/1?filter=&groupBy=none
- Estado observado en Jira: el tablero abierto se titula Sprint 2 y muestra
  SCRUM-15 a SCRUM-21 en Finalizado. No se modificaron historias ni sprints.
- Coleccion publica/compartida de Postman: **publicar desde la cuenta del equipo
  y pegar aqui el enlace**. La sesion Postman no esta autenticada en este
  navegador.
- Reporte HTML JMeter (carga y seguridad JWT):
  [`evidencias/jmeter-rutas-jwt/index.html`](./evidencias/jmeter-rutas-jwt/index.html).
- Video de entrega: pendiente de grabacion por el equipo.

La ejecucion enlazada corresponde al commit fusionado y termino correctamente:
pasaron instalacion, Jest, integracion, preparacion del admin, disponibilidad
de API, Newman y publicacion de artefactos.

## Validacion local realizada

- Jest: 75 pruebas unitarias aprobadas en 11 suites; cobertura de lineas
  reportada por Jest: 98.41 %.
- Integracion: 10 escenarios contra MongoDB real aprobados, ademas de 7 pruebas
  HTTP/configuracion de Jest.
- Newman: 15 solicitudes, 45 aserciones y 0 fallos contra la API local.
- JMeter: 42 muestras, 0 errores; promedio 117.26 ms, P95 437.85 ms,
  throughput 11.61 solicitudes/s. Ver
  [`resumen JMeter`](./evidencias/jmeter-resumen.md).

Los resultados locales se volvieron a ejecutar en la copia actualizada despues
del merge. El run de Actions enlazado verifica el commit fusionado en GitHub.

## Hoja SCRUM

El archivo `scrum-backlog.csv` es una plantilla de sincronizacion. La hoja
enlazada abre en modo Solo ver para la cuenta disponible, por lo que la
importacion/actualizacion no se pudo guardar. Pide permiso de editor al
propietario y despues importa el CSV o copia las filas. El tablero Jira si abre
y ya muestra las historias SCRUM-15 a SCRUM-21 finalizadas, con responsables
asignados; no se cambiaron sus datos.

La consigna compartida contiene una discrepancia: una parte solicita 4 sprints y
otra dice que deben ser 3. El tablero visible actualmente esta en Sprint 2. La
cantidad final de sprints no se puede inferir del estado del tablero: confirma
con el docente si exige 3 o 4 antes de importar el backlog.

## Publicar y ejecutar

1. Solicita permiso de editor sobre la hoja SCRUM, confirma 3 o 4 sprints con el
   docente e importa/sincroniza el CSV con los datos reales del equipo.
2. Desde la cuenta Postman del equipo, importa la coleccion y el ambiente,
   comparte/publica la coleccion y pega el enlace real en esta lista. No
   compartas credenciales ni tokens.
3. Graba un video de hasta 3 minutos siguiendo [`guion-video.md`](./guion-video.md)
   y mostrando la hoja SCRUM, Jira, documento de rutas, ejecucion verde de
   Actions, resultados de pruebas, reporte JMeter y coleccion Postman publicada.
   No muestres secretos en pantalla.

## Guion sugerido para el video (3 minutos)

- `0:00-0:25`: proyecto, equipo y hoja SCRUM/Jira.
- `0:25-0:50`: arquitectura y documento de endpoints.
- `0:50-1:20`: GitHub Actions y pruebas Jest/Newman.
- `1:20-1:50`: conteo de pruebas unitarias y de integracion.
- `1:50-2:30`: reporte JMeter; login, ausencia de token y cinco rutas JWT.
- `2:30-3:00`: coleccion/ambiente Postman compartidos y enlaces de entrega.
