# CaféFlow Backend

Backend de CaféFlow construido con Node.js y Express, organizado para separar la
configuración, las rutas y la lógica de la aplicación.

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start
```

El servidor escucha en el puerto indicado por `PORT` o, si no está definido, en
el puerto `3000`.

## Estructura

- `src/config`: configuración de la aplicación.
- `src/routes`: definición de rutas HTTP.
- `src/controllers`: manejo de solicitudes y respuestas.
- `src/services`: lógica de negocio.
- `src/models`: modelos de datos.

La integración con MongoDB y la ruta de prueba están pendientes; todavía no hay
rutas HTTP implementadas.
