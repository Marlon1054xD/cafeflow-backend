# Resultado de JMeter: autenticacion JWT y rutas privadas

Reporte HTML completo: [`jmeter-rutas-jwt/index.html`](./jmeter-rutas-jwt/index.html).

## Entorno y perfil medido

- Fecha local: 28 de octubre de 2026.
- JMeter: 5.6.3; Java: OpenJDK 21.
- API local con Node.js 24.20.0 y MongoDB 8.2.6 en base desechable de pruebas.
- 2 usuarios virtuales, rampa de 3 segundos, 3 iteraciones por usuario.
- 7 solicitudes por iteracion: control de rechazo sin token, login y cinco rutas
  privadas; 42 muestras totales (6 por sampler).
- Admin y credenciales creados solo para esta prueba local. No se usaron datos
  productivos.

## Resultado agregado

| Metrica | Resultado |
|---|---:|
| Solicitudes | 42 |
| Promedio | 117.26 ms |
| P95 | 437.85 ms |
| Throughput | 11.61 solicitudes/s |
| Errores JMeter | 0 / 0.00 % |
| Verificacion de acceso sin JWT | 6 respuestas HTTP 401 esperadas, sin errores |

Cada uno de los cinco endpoints privados respondio HTTP 200 con el token
obtenido por login. La verificacion sin token devolvio HTTP 401 como se esperaba.

Esta es una carga local corta para evidenciar el flujo y verificar el plan; seis
muestras por endpoint no constituyen una prueba de capacidad ni un SLA. Repite
la medicion con el perfil que autorice el docente y el equipo, conserva el
entorno/configuracion junto al resultado y no ejecutes estres contra produccion.
