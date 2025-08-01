# ☁️ MiNubeEnCasa - Nube Personal con Angular y Node.js

Este es un proyecto full-stack que transforma una ruta de tu ordenador en un servidor de almacenamiento en la nube privado, con un explorador de archivos web moderno y seguro. Esta pensado para hogares, nada a gran escala. Si quieres dockerizarlo usa Debian 12.

## ✨ Características

- **Explorador de Archivos:** Navega por carpetas, sube y descarga archivos.
- **Gestión Completa:** Crea nuevas carpetas y borra archivos o carpetas.
- **Autenticación Segura:** Sistema de Login y Registro con tokens JWT para proteger el acceso.
- **Interfaz Moderna:** Desarrollada con Angular, con un layout de tipo dashboard.

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js & Express.js:** Para construir la API RESTful.
- **MySQL:** Como base de datos para la gestión de usuarios.
- **JSON Web Tokens (JWT):** Para la autenticación stateless.
- **bcrypt.js:** Para el hasheo seguro de contraseñas.
- **Multer:** Para gestionar la subida de archivos.

### Frontend
- **Angular:** Utilizando componentes Standalone y enrutamiento.
- **RxJS:** Para la gestión de estado y datos asíncronos.
- **TypeScript:** Para un código robusto y tipado.

## 🚀 Cómo Ponerlo en Marcha

### Prerrequisitos
- Node.js y npm
- Angular CLI (`npm install -g @angular/cli`)
- Un servidor MySQL

### Backend
1.  Navega a la carpeta `Backend`.
2.  Crea el directorio `uploads`, ahi iran los archivos que se suban 
3.  Crea un archivo `.env` basado en el `.env.example` (que deberías crear) con tus credenciales. Tal que asi:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=dav_home_cloud
JWT_SECRET=secret_token

4.  Ejecuta `npm install`.
5.  Modifica `run_en_tu_sql.sql` y cambia los datos del usuario administrador, recuerda poner la contraseña encriptada con bcrypt, usar `hashear.js`
6.  Ejecuta el script SQL para crear la tabla `users`.
7.  Inicia el servidor: `node app.js`.

### Frontend
1.  Navega a la carpeta `Frontend/MyCloud`.
2.  Ejecuta `npm install`.
3.  Inicia el servidor de desarrollo: `ng serve`.
4.  Abre tu navegador en `http://localhost:4200`.

### Imagenes 

![Login page](.github/images/login.png)

![Vista principal del explorador de archivos](.github/images/explorador.png)

![Dialogos](.github/images/dinamico.png)

![Panel de Gestion](.github/images/admin.png)

![Settings Page](.github/images/settings.png)

---
*Este proyecto fue desarrollado como un ejercicio de aprendizaje profundo en tecnologías full-stack. © Davgarbla11*

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
