# JMeter: carga y estrés

Los cuatro planes separan carga/estrés de login y del único endpoint crítico
disponible hoy (`GET /api/salud`):

- `carga-login.jmx` y `estres-login.jmx`: `POST /api/auth/login`.
- `carga-salud.jmx` y `estres-salud.jmx`: `GET /api/salud`.

Los planes de login están preparados según el contrato acordado, pero no se
pueden ejecutar hasta que el endpoint exista. No se deben dirigir a producción,
ni a servicios de terceros: usa únicamente un backend local o de pruebas
autorizado y comienza con los valores bajos predeterminados.

## Preparar las credenciales

En un archivo local ignorado por Git llamado
`performance/jmeter/users.local.csv`, guarda una cabecera y una fila por cuenta
de prueba válida:

```csv
email,password
usuario1@example.test,contraseña-local-1
usuario2@example.test,contraseña-local-2
```

No uses credenciales reales ni agregues este archivo al repositorio. El plan
comparte las filas entre los usuarios virtuales, no las recicla y detiene cada
hilo al agotarlas. Para `users=10` y `loops=20`, prepara al menos 200 filas con
credenciales aceptadas por el entorno; así cada solicitud usa una cuenta
válida distinta en lugar de contaminar las métricas con errores esperados.

## Ejecución no gráfica y reporte HTML

Requiere Apache JMeter instalado (`jmeter` en `PATH`) y el backend local activo.
PowerShell: los resultados se escriben en carpetas locales ignoradas por Git; el
directorio destino del reporte debe no existir antes de ejecutar.

Carga de salud:

```powershell
jmeter -n -t performance/jmeter/carga-salud.jmx -Jprotocol=http -Jhost=127.0.0.1 -Jport=3000 -Jusers=5 -JrampUp=30 -Jduration=120 -Jloops=20 -l performance/jmeter/results/carga-salud.jtl -e -o performance/jmeter/results/carga-salud-html
```

Estrés gradual de salud:

```powershell
jmeter -n -t performance/jmeter/estres-salud.jmx -Jprotocol=http -Jhost=127.0.0.1 -Jport=3000 -Jusers=10 -JrampUp=60 -Jduration=120 -Jloops=20 -l performance/jmeter/results/estres-salud.jtl -e -o performance/jmeter/results/estres-salud-html
```

Carga de login (después de desplegar el endpoint y preparar suficientes
credenciales válidas):

```powershell
jmeter -n -t performance/jmeter/carga-login.jmx -Jprotocol=http -Jhost=127.0.0.1 -Jport=3000 -Jusers=5 -JrampUp=30 -Jduration=120 -Jloops=20 -JcredentialsFile=performance/jmeter/users.local.csv -l performance/jmeter/results/carga-login.jtl -e -o performance/jmeter/results/carga-login-html
```

Estrés gradual de login:

```powershell
jmeter -n -t performance/jmeter/estres-login.jmx -Jprotocol=http -Jhost=127.0.0.1 -Jport=3000 -Jusers=10 -JrampUp=60 -Jduration=120 -Jloops=20 -JcredentialsFile=performance/jmeter/users.local.csv -l performance/jmeter/results/estres-login.jtl -e -o performance/jmeter/results/estres-login-html
```

`protocol`, `host`, `port`, `users`, `rampUp` y `duration` son parámetros
JMeter; `loops` limita las iteraciones y `credentialsFile` selecciona el CSV de
login. Salud mantiene solicitudes hasta alcanzar `duration`; login termina al
completar `loops` o al agotarse el CSV (duration es un límite máximo). Los valores
predeterminados de los planes son conservadores. Aumenta
usuarios o duración solo gradualmente, con autorización, y supervisa el backend
y MongoDB; interrumpe la prueba si el entorno se degrada. No ejecutes carga de
estrés contra el entorno compartido sin acordarlo antes con Esteban.

## Resultados y lectura

Registra para cada plan el entorno (máquina, versión Node/JMeter y base aislada),
fecha, parámetros, **promedio**, **percentil 95**, **throughput** (solicitudes/s)
y **porcentaje de errores**. El reporte HTML de JMeter muestra estadísticas por
sampler y el archivo JTL conserva las muestras. Compara los planes con los
mismos recursos y configuración, y distingue respuestas fallidas por bugs de
credenciales/configuración de fallos bajo carga. No hay métricas reportadas aún:
JMeter no está instalado en este equipo y la autenticación no existe todavía.

| Escenario | Promedio | P95 | Throughput | Errores | Estado |
|---|---:|---:|---:|---:|---|
| Carga - salud | pendiente | pendiente | pendiente | pendiente | No ejecutado |
| Estrés - salud | pendiente | pendiente | pendiente | pendiente | No ejecutado |
| Carga - login | pendiente | pendiente | pendiente | pendiente | Endpoint pendiente |
| Estrés - login | pendiente | pendiente | pendiente | pendiente | Endpoint pendiente |
