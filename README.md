# CaféFlow Backend

Backend de CaféFlow construido con Node.js y Express, organizado para separar la
configuración, las rutas y la lógica de la aplicación.

## Instalación

```bash
npm install
```

## Configurar MongoDB Atlas

1. Crea una cuenta o inicia sesión en [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Crea un cluster y espera a que termine de aprovisionarse.
3. En **Database Access**, crea un usuario de base de datos y asígnale el rol
   `readWrite` sobre la base de datos `cafeflow`.
4. En **Network Access**, agrega tu dirección IP actual. Para desarrollo local,
   usa la opción **Add Current IP Address**.
5. En **Database**, selecciona **Connect**, elige **Drivers** y copia la URI de
   conexión. Comprueba que la base de datos de la URI sea `cafeflow` y sustituye
   los marcadores de usuario, contraseña y cluster por los valores de Atlas.
6. Copia el archivo de ejemplo a `.env` desde la raíz del proyecto:

   ```bash
   cp .env.example .env
   ```

   En Windows PowerShell, usa `Copy-Item .env.example .env`.
7. Abre `.env` localmente y reemplaza el valor de `MONGODB_URI` con la URI
   obtenida en Atlas. No compartas ese archivo: contiene credenciales.

## Ejecución

```bash
npm start
```

La aplicación carga las variables de `.env`, conecta a MongoDB y solo entonces
inicia Express. El servidor escucha en el puerto indicado por `PORT` o, si no
está definido, en el puerto `3000`. Si `MONGODB_URI` falta o la conexión falla,
el proceso informa el problema sin mostrar credenciales y termina con un código
de error, sin iniciar el servidor.

## Estructura

- `src/config`: configuración de la aplicación.
- `src/routes`: definición de rutas HTTP.
- `src/controllers`: manejo de solicitudes y respuestas.
- `src/services`: lógica de negocio.
- `src/models`: modelos de datos.
