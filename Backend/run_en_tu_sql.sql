CREATE DATABASE IF NOT EXISTS 'dav_home_cloud'
USE 'dav_home_cloud'

-- Creamos la tabla de usuarios

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user', -- Rol del usuario
    is_temporary_password BOOLEAN NOT NULL DEFAULT FALSE, -- Flag para contraseña temporal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Añadimos nuestro user de admin, con una contraseña encriptada ¡¡¡USANDO BCRYPT!!! 

INSERT INTO users (username, password, role) 
VALUES ('davidg', 'metecontraseñaencriptada', 'admin');


-- © Github davidgb.05