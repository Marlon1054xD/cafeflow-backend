# Pruebas de integración

Ejecuta la suite con:

```powershell
$env:NODE_ENV = "test"
$env:MONGODB_URI_TEST = "mongodb://127.0.0.1:27017/cafeflow_test"
$env:JWT_SECRET = "secreto-local-solo-para-pruebas"
npm run test:integration
```

El comando carga `.env.test` antes de validar configuración. Las variables
exportadas en el entorno (incluidas las de CI) prevalecen sobre ese archivo. Se
niega a ejecutar si falta `MONGODB_URI_TEST` o `JWT_SECRET`, la URI no es
MongoDB o el nombre de la base no incluye explícitamente `test`, `tests` o
`testing` como segmento (`cafeflow_test`, por ejemplo). No imprime la URI ni el
secreto. En CI se usa un servicio MongoDB aislado y efímero, sin credenciales de
desarrollo o producción.

## Cobertura actual

`top-down/salud.test.js` invoca la aplicación Express con Supertest, sin abrir un
puerto, y sustituye `saludService.obtenerEstadoSalud` por un stub. Demuestra la
integración entre HTTP, enrutador y controlador, pero **no** integra la lógica
real del servicio, MongoDB, modelos ni autenticación.

`auth.integration.js` conecta a MongoDB real mediante
`MONGODB_URI_TEST` y cubre registro → login → perfil, hash/roles públicos,
duplicados, validación, credenciales incorrectas y autorización de cliente y
administrador. `uri-safety.test.js` comprueba la validación de la URI de pruebas.

Los drivers que usen MongoDB deben generar identificadores/emails únicos por
ejecución y eliminar solo los documentos que esa ejecución haya creado. No
deben borrar bases ni colecciones, ni considerar mocks de Mongoose como una
integración MongoDB real.
