# Pruebas de integración

Ejecuta la suite con:

```powershell
$env:MONGODB_URI_TEST = "mongodb://127.0.0.1:27017/cafeflow_test"
npm run test:integration
```

El comando se niega a ejecutar Jest si falta `MONGODB_URI_TEST`, la URI no es
MongoDB o el nombre de la base no incluye explícitamente `test`, `tests` o
`testing` como segmento (`cafeflow_test`, por ejemplo). No se imprime la URI.
En CI, configura `MONGODB_URI_TEST` como secreto que apunte a una base aislada
de pruebas; no uses la URI de desarrollo ni producción.

## Top-down

`top-down/salud.test.js` invoca la aplicación Express con Supertest, sin abrir un
puerto, y sustituye `saludService.obtenerEstadoSalud` por un stub. Demuestra la
integración entre HTTP, enrutador y controlador, pero **no** integra la lógica
real del servicio, MongoDB, modelos ni autenticación.

## Bottom-up y flujo completo

No se agregan pruebas bottom-up simuladas. El `main` actualizado solo contiene
`GET /api/salud`; no están disponibles los endpoints de registro, login y perfil,
ni servicios o modelos de usuarios. Por eso todavía no existe un driver que
ejecute servicios/modelos reales contra MongoDB ni se puede demostrar el flujo
completo sin stubs. El trabajo queda bloqueado hasta integrar esas capas y
confirmar con Karen la configuración Jest acordada y con Esteban la base aislada
y el secreto `MONGODB_URI_TEST` de CI.

Al estar disponibles los endpoints y las capas, deben cubrirse el registro
correcto, email duplicado, login correcto/incorrecto, perfil con token válido,
ausencia/token inválido y errores con `{ "message": "..." }`. Un driver de flujo
completo debe ejecutar registro → login → perfil sin stubs.

Al añadir esos endpoints, los drivers bottom-up deben importar los servicios y
modelos reales, generar identificadores/emails únicos por ejecución y eliminar
solo los documentos que esa ejecución haya creado. No deben borrar bases ni
colecciones, ni considerar mocks de Mongoose como una integración MongoDB real.
