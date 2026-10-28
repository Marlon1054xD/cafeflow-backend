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

El registro publico siempre crea rol `cliente`; no acepta asignar privilegios.
Para probar rutas de administrador, prepara una cuenta admin exclusivamente
en una base desechable de pruebas. Nunca uses contrasenas, tokens o datos de
produccion en Postman, JMeter ni en los reportes.

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
```
