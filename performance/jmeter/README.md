# JMeter: carga y seguridad con JWT

## Plan de cinco rutas privadas

`carga-rutas-privadas-jwt.jmx` verifica en cada iteracion:

1. `GET /api/usuarios/me` sin token devuelve `401`.
2. `POST /api/auth/login` devuelve `200` y un `access_token`.
3. `GET /api/usuarios/me` acepta el JWT.
4. `PATCH /api/usuarios/me` acepta el JWT y actualiza el nombre de la cuenta
   de prueba.
5. `GET /api/usuarios/estadisticas` acepta JWT de admin.
6. `GET /api/usuarios` acepta JWT de admin.
7. `GET /api/usuarios/{id}` acepta JWT de admin y el id extraido del login.

El plan solo usa cuentas, MongoDB y API desechables autorizados. **No lo ejecutes
contra produccion, internet ni servicios de terceros.** El usuario debe tener rol
`admin` en la base de pruebas; el registro publico no asigna ese rol.

## Preparar el entorno local

Instala Java y Apache JMeter 5.6.3 o compatible; `jmeter` debe estar en `PATH`.
Inicia MongoDB en una base desechable y el backend con `NODE_ENV=test`,
`MONGODB_URI_TEST` apuntando a esa base y `JWT_SECRET` solo de pruebas.

1. Registra una cuenta de prueba con `POST /api/auth/register`.
2. Cambia su rol a `admin` directamente en la base de pruebas, por ejemplo con
   `mongosh`:

   ```javascript
   use cafeflow_test
   db.usuarios.updateOne(
     { email: "jmeter-admin@example.test" },
     { $set: { rol: "admin" } }
   )
   ```

3. Confirma que el login funciona. En
   `performance/jmeter/users.local.csv` (archivo ignorado por Git) guarda solo
   esa cuenta:

   ```csv
   email,password
   jmeter-admin@example.test,clave-local-de-pruebas
   ```

   No guardes en el CSV contrasenas reales ni compartas el archivo. JMeter
   recicla las credenciales para iteraciones acotadas. El plan cambia el nombre
   del usuario a `JMeter Test Admin`; crea una cuenta desechable solo para este
   ensayo.

## Prueba de humo recomendada

Desde la raiz del proyecto, ejecuta una iteracion y un usuario. Sustituye la
contrasena del ejemplo en el CSV local; no la pongas en la linea de comandos.

```powershell
New-Item -ItemType Directory -Force performance/jmeter/results | Out-Null
jmeter -n -t performance/jmeter/carga-rutas-privadas-jwt.jmx `
  -Jprotocol=http -Jhost=localhost -Jport=3000 `
  -Jusers=1 -JrampUp=1 -Jloops=1 `
  -JcredentialsFile=performance/jmeter/users.local.csv `
  -l performance/jmeter/results/jwt-smoke.jtl
```

Al terminar, comprueba los siete samplers, que el sampler sin token da el
resultado esperado `401`, y que login y las cinco rutas privadas pasan con cero
assertion failures. La prueba de humo no es un resultado de carga.

## Generar reporte de carga y seguridad

Solo despues de la prueba de humo, ejecuta un perfil pequeno en la base local de
pruebas y aumenta concurrencia gradualmente:

```powershell
jmeter -n -t performance/jmeter/carga-rutas-privadas-jwt.jmx `
  -Jprotocol=http -Jhost=localhost -Jport=3000 `
  -Jusers=5 -JrampUp=10 -Jloops=10 `
  -JcredentialsFile=performance/jmeter/users.local.csv `
  -l performance/jmeter/results/carga-rutas-jwt.jtl `
  -e -o performance/jmeter/results/carga-rutas-jwt-html
```

El directorio HTML de destino debe no existir antes de ejecutar. No hagas prueba
de estres a menos que el docente y el equipo autoricen el perfil y el entorno.
Monitorea API y MongoDB e interrumpe si el entorno se degrada.

El plan produce 7 solicitudes por iteracion (una verificacion de rechazo, login
y cinco rutas privadas). Captura promedio, P95, throughput y errores del HTML.
Guarda el resumen del resultado real y el reporte generado en el repositorio
antes de entregar; `performance/jmeter/results/` se ignora en Git para evitar
subir datos de prueba por accidente. Revisa y publica manualmente un reporte
limpio, sin tokens, contrasenas, correos personales ni datos sensibles.

| Escenario | Promedio | P95 | Throughput | Errores | Estado |
|---|---:|---:|---:|---:|---|
| JWT y 5 rutas privadas | 117.26 ms | 437.85 ms | 11.61 solicitudes/s | 0.00 % | Ejecutado localmente; 42 muestras; [reporte](../../docs/evidencias/jmeter-resumen.md) |
