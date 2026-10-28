# Guion de video de entrega (maximo 3 minutos)

El video no se puede grabar desde este repositorio. Usa este guion para grabarlo
con tu equipo. Comparte pantalla completa y evita mostrar contrasenas, tokens,
archivos `.env` o datos privados.

## 0:00-0:25 — Proyecto y SCRUM

**Mostrar:** repositorio CafeFlow y hoja SCRUM real, una vez que el equipo pueda
editarla. Si el docente todavia no aclara si son 3 o 4 sprints, no afirmes una
cantidad como definitiva.

**Decir:** “Este es CafeFlow, un backend REST para gestionar usuarios y
autenticacion. Organizamos el trabajo con historias de usuario, responsables y
seguimiento por sprints.”

## 0:25-0:45 — Jira y endpoints

**Mostrar:** tablero Jira del equipo y despues
[`rutas-api.md`](./rutas-api.md), desplazandote por las rutas publicas y
protegidas.

**Decir:** “En Jira se registran las tareas del equipo. El documento del repo
describe metodo, ruta, permisos y respuestas. Los endpoints privados usan JWT y
los administrativos requieren rol admin.”

## 0:45-1:15 — Repositorio y CI

**Mostrar:** PR #10 fusionado y la ejecucion verde de GitHub Actions:
https://github.com/Marlon1054xD/cafeflow-backend/pull/10
https://github.com/Marlon1054xD/cafeflow-backend/actions/runs/40729107307

**Decir:** “El workflow instala dependencias y ejecuta Jest, la integracion con
MongoDB y Newman. Esta es la ejecucion exitosa asociada al cambio fusionado.”

## 1:15-1:45 — Pruebas

**Mostrar:** resumen de los comandos ejecutados, no valores secretos de
terminal.

**Decir:** “La suite tiene 75 pruebas unitarias aprobadas, diez escenarios de
integracion contra MongoDB real y Newman valida quince solicitudes con 45
aserciones.”

## 1:45-2:25 — JMeter y JWT

**Mostrar:** [`reporte JMeter`](./evidencias/jmeter-rutas-jwt/index.html) y el
[`resumen de metricas`](./evidencias/jmeter-resumen.md).

**Decir:** “El plan primero confirma que una solicitud sin token recibe 401.
Despues inicia sesion, extrae el JWT y prueba cinco rutas privadas. La medicion
local tuvo 42 muestras y cero errores; es una prueba corta, no un SLA.”

## 2:25-2:50 — Postman

**Mostrar:** la coleccion compartida desde la cuenta del equipo y las variables
de entorno sin revelar contrasenas ni tokens.

**Decir:** “Esta es la coleccion Postman compartida; Newman ejecuta sus
solicitudes en CI.” No grabes este segmento hasta contar con el enlace publicado.

## 2:50-3:00 — Cierre

**Mostrar:** README y checklist de entrega.

**Decir:** “El codigo, las pruebas y las evidencias estan documentados en el
repositorio. Gracias.”
