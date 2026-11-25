# Rutas y endpoints de CafeFlow

Base local: `http://localhost:3000`. Las solicitudes con cuerpo usan JSON.
Los JWT se envian como `Authorization: Bearer <token>`.

| Metodo | Ruta | Acceso | Funcion y respuestas principales |
|---|---|---|---|
| `GET` | `/api/salud` | Publico | Estado de la API. `200`. |
| `POST` | `/api/auth/register` | Publico | Crea una cuenta cliente. `201`, `400` datos invalidos, `409` email duplicado. |
| `POST` | `/api/auth/login` | Publico | Valida credenciales y devuelve JWT. `200`, `400` datos incompletos, `401` credenciales invalidas. |
| `GET` | `/api/usuarios/me` | Cliente o admin con JWT | Devuelve el perfil propio. `200`, `401` sin token o token invalido. |
| `PATCH` | `/api/usuarios/me` | Cliente o admin con JWT | Actualiza solo `nombre` o `email` propios. `200`, `400` campos no permitidos/invalidos, `401`, `409` email duplicado. |
| `GET` | `/api/usuarios/estadisticas` | Admin con JWT | Totales de clientes y administradores. `200`, `401`, `403` rol insuficiente. |
| `GET` | `/api/usuarios` | Admin con JWT | Lista perfiles publicos, sin contrasenas. `200`, `401`, `403`. |
| `GET` | `/api/usuarios/:id` | Admin con JWT | Devuelve un perfil publico por MongoDB ObjectId. `200`, `400` id invalido, `401`, `403`, `404`. |
| `GET` | `/api/cervezas` | Publico | Lista cervezas con precio entero en COP y disponibilidad. `200`. |
| `GET` | `/api/cervezas/:id` | Publico | Consulta una cerveza. `200`, `400` id invalido, `404`. |
| `POST` | `/api/cervezas` | Admin con JWT | Crea una cerveza. `201`, `400` datos invalidos, `401`, `403`. |
| `PATCH` | `/api/cervezas/:id` | Admin con JWT | Actualiza campos permitidos de la cerveza. `200`, `400`, `401`, `403`, `404`. |
| `POST` | `/api/pedidos` | Cliente o admin con JWT | Crea un pedido pendiente; el usuario, precio unitario y total se determinan en el servidor. `201`, `400` datos invalidos/vacios, `401`, `404` cerveza inexistente, `409` cerveza no disponible. |
| `GET` | `/api/pedidos` | Cliente o admin con JWT | El cliente consulta solo sus pedidos; el admin consulta todos. `200`, `401`. |
| `GET` | `/api/pedidos/pendientes` | Admin con JWT | Lista pedidos pendientes del mas antiguo al mas reciente. `200`, `401`, `403`. |
| `GET` | `/api/pedidos/:id` | Propietario con JWT o admin con JWT | Consulta el detalle propio o cualquier pedido si es admin. `200`, `400` id invalido, `401`, `404` inexistente o ajeno. |
| `PATCH` | `/api/pedidos/:id/estado` | Admin con JWT | Cambia el estado si la transicion esta permitida. `200`, `400` id/estado invalido, `401`, `403`, `404`, `409` transicion no permitida. |

El registro publico siempre crea rol `cliente`; no acepta asignar privilegios.
Para probar rutas de administrador, prepara una cuenta admin exclusivamente
en una base desechable de pruebas. Nunca uses contrasenas, tokens o datos de
produccion en Postman, JMeter ni en los reportes.

## Catalogo y pedidos

Las cervezas usan `{id, nombre, descripcion, precio, disponible}`. `precio`
debe ser un entero positivo en COP. La creacion requiere los cuatro campos; la
actualizacion acepta uno o mas de esos campos. No se aceptan campos adicionales.

Un pedido usa `{id, usuario, items, total, estado, creadoEn}`. Cada elemento
contiene `{cervezaId, nombre, cantidad, precioUnitario}`. El cliente solo envia
`items: [{cervezaId, cantidad}]`; no puede elegir el usuario, el precio ni el
total. Se validan todos los productos y disponibilidades antes de guardar el
pedido, y las cantidades deben ser enteros positivos. No se permiten productos
repetidos dentro de la misma solicitud.

La plantilla Scrum `HE-01` define que cada cambio de estado avance un solo paso:

```text
pendiente -> en_preparacion -> listo -> entregado
```

`entregado` es terminal. Un cambio que omita un paso o intente avanzar desde
`entregado` responde `409` y no modifica el pedido.

Ejemplo de creacion de catalogo (solo admin):

```http
POST /api/cervezas
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{"nombre":"Lager React Selenium","descripcion":"Cerveza de prueba automatizada","precio":8500,"disponible":true}
```

Ejemplo de pedido autenticado:

```http
POST /api/pedidos
Authorization: Bearer <access_token>
Content-Type: application/json

{"items":[{"cervezaId":"<beer_id>","cantidad":2}]}
```

La respuesta incluye `estado: "pendiente"`, `precioUnitario: 8500` y `total: 17000`
si el precio del catalogo es 8500 COP. El precio queda como instantanea aunque
el admin cambie el catalogo despues.

## Flujo para React y Selenium

Usa una base desechable y datos de prueba, nunca cuentas reales. Para el flujo
reproducible, registra `react-selenium@example.test` con password
`react-selenium-password`, inicia sesion y conserva `access_token` en memoria.
Prepara con un admin la cerveza `Lager React Selenium` (8500 COP, disponible).
React/Selenium pueden recorrer:

1. `POST /api/auth/login` con `{"email":"react-selenium@example.test","password":"react-selenium-password"}`; conservar `access_token`.
2. `GET /api/cervezas`; elegir la cerveza de prueba disponible.
3. `POST /api/pedidos` con `Authorization: Bearer <access_token>` y `{"items":[{"cervezaId":"<beer_id>","cantidad":2}]}`; comprobar `201`, `estado: "pendiente"` y `total: 17000`.
4. `GET /api/pedidos/<id>` con el mismo JWT; comprobar que `items`, `precioUnitario` y `total` coinciden con la respuesta de creacion.

El cliente obtiene solo sus pedidos con `GET /api/pedidos`; los endpoints de
administracion requieren un JWT cuyo rol actual en la base sea `admin`.

## CORS local

`CORS_ORIGINS` es una lista separada por comas de origenes exactos, por ejemplo
`http://localhost:5173,http://127.0.0.1:5173`. Cada origen debe incluir esquema,
host y puerto (sin ruta). Solo se habilitan `Authorization` y `Content-Type`;
no se habilitan cookies ni credenciales de navegador. Sin la variable no se
aceptan origenes cruzados.

## Ejemplos

Registro:

```http
POST /api/auth/register
Content-Type: application/json

{"nombre":"Prueba","email":"prueba@example.test","password":"clave-local-de-pruebas"}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json

{"email":"prueba@example.test","password":"clave-local-de-pruebas"}
```

Perfil y actualizacion:

```http
GET /api/usuarios/me
Authorization: Bearer <access_token>

PATCH /api/usuarios/me
Authorization: Bearer <access_token>
Content-Type: application/json

{"nombre":"Nombre actualizado"}
```

Rutas de administrador:

```http
GET /api/usuarios/estadisticas
Authorization: Bearer <admin_access_token>

GET /api/usuarios
Authorization: Bearer <admin_access_token>

GET /api/usuarios/<user_id>
Authorization: Bearer <admin_access_token>

GET /api/pedidos/pendientes
Authorization: Bearer <admin_access_token>

PATCH /api/pedidos/<order_id>/estado
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{"estado":"en_preparacion"}
```
