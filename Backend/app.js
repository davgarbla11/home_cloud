// app.js
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const archiver = require('archiver');

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN PRINCIPAL ---
const BASE_STORAGE_PATH = path.resolve(__dirname, 'uploads');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if (!fs.existsSync(BASE_STORAGE_PATH)) {
  fs.mkdirSync(BASE_STORAGE_PATH, { recursive: true });
}

// --- MIDDLEWARE GENERAL ---
app.use(cors());
app.use(express.json());


// =================================================================
// === SECCIÓN DE AUTENTICACIÓN (RUTAS PÚBLICAS) ===
// =================================================================
const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const user = rows[0];

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    
    if (user.is_temporary_password) {
      const changePasswordToken = jwt.sign({ ...tokenPayload, action: 'change-password' }, process.env.JWT_SECRET, { expiresIn: '15m' });
      return res.json({ status: 'changePasswordRequired', changePasswordToken });
    }
    
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ status: 'success', accessToken, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor durante el login.' });
  }
});

app.use('/api/auth', authRouter);


// =================================================================
// === MIDDLEWARE DE SEGURIDAD (TOKEN Y ROL) ===
// =================================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.action) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// --- NUEVO --- Middleware específico para verificar el token de cambio de contraseña
const verifyChangePasswordToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.action !== 'change-password') {
      return res.status(403).json({ message: 'Token no válido para esta acción.' });
    }
    req.user = user;
    next();
  });
};


// =================================================================
// === RUTA PARA CAMBIAR CONTRASEÑA (CORREGIDA) ===
// =================================================================

// --- MODIFICADO --- Usamos el nuevo middleware 'verifyChangePasswordToken' en lugar de 'authenticateToken'
app.post('/api/user/change-password', verifyChangePasswordToken, async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE users SET password = ?, is_temporary_password = FALSE WHERE id = ?', 
            [hashedPassword, userId]
        );
        await connection.end();
        res.json({ message: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar la contraseña.' });
    }
});


// =================================================================
// === RUTAS DEL PANEL DE ADMIN (PROTEGIDAS POR TOKEN Y ROL) ===
// =================================================================
const adminRouter = express.Router();
adminRouter.use(isAdmin);
adminRouter.get('/users', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  const [users] = await connection.execute('SELECT id, username, role, created_at, is_temporary_password FROM users');
  await connection.end();
  res.json(users);
});
adminRouter.post('/users', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Se requiere usuario y contraseña temporal.' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('INSERT INTO users (username, password, is_temporary_password) VALUES (?, ?, TRUE)', [username, hashedPassword]);
    await connection.end();
    res.status(201).json({ message: 'Usuario creado con contraseña temporal.' });
  } catch(error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    console.error(error);
    res.status(500).json({ message: 'Error al crear usuario.' });
  }
});
adminRouter.delete('/users/:id', async (req, res) => {
  const userIdToDelete = req.params.id;
  if (Number(userIdToDelete) === req.user.id) {
    return res.status(400).json({ message: 'No puedes borrar tu propia cuenta de administrador.' });
  }
  const connection = await mysql.createConnection(dbConfig);
  await connection.execute('DELETE FROM users WHERE id = ?', [userIdToDelete]);
  await connection.end();
  res.json({ message: 'Usuario borrado con éxito.' });
});
app.use('/api/admin', authenticateToken, adminRouter);


// =================================================================
// === RUTAS DE GESTIÓN DE ARCHIVOS (PROTEGIDAS POR TOKEN) ===
// =================================================================
const fileRouter = express.Router();
fileRouter.use(authenticateToken);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const cloudBasePath = req.body.path || '';
    
    // El nombre del archivo ahora viene codificado, ej: 'SO--!!--archivo.iso'
    const encodedPath = file.originalname;
    
    // Definimos el mismo separador que en el frontend
    const SEPARATOR = '--!!--';
    
    const parts = encodedPath.split(SEPARATOR);
    // El nombre real del archivo es el último elemento
    const filename = parts.pop(); 
    // La estructura de directorios es el resto de los elementos unidos por una barra real
    const directoryStructure = parts.join(path.sep);

    const finalDestination = path.join(BASE_STORAGE_PATH, cloudBasePath, directoryStructure);

    console.log(`[Backend] Path Recibido: ${encodedPath}`);
    console.log(`[Backend] Directorio a crear: ${directoryStructure}`);
    console.log(`[Backend] Destino final: ${finalDestination}`);

    fs.mkdir(finalDestination, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, finalDestination);
    });
  },
  filename: function (req, file, cb) {
    const encodedPath = file.originalname;
    const SEPARATOR = '--!!--';
    const parts = encodedPath.split(SEPARATOR);
    const finalFilename = parts[parts.length - 1]; // El nombre es el último elemento
    
    console.log(`[Backend] Nombre de archivo final: ${finalFilename}`);
    cb(null, finalFilename);
  }
});

const upload = multer({ storage: storage });

fileRouter.get('/browse/:path(*)?', (req, res) => {
    const currentRelativePath = req.params.path || '';
    const fullPath = path.join(BASE_STORAGE_PATH, currentRelativePath);
    if (!fullPath.startsWith(BASE_STORAGE_PATH)) {
        return res.status(403).json({ message: 'Acceso prohibido' });
    }
    fs.readdir(fullPath, { withFileTypes: true }, (err, items) => {
        if (err) {
            return res.status(404).json({ message: 'Ruta no encontrada' });
        }
        res.json(items.map(item => ({ name: item.name, isDirectory: item.isDirectory() })));
    });
});
fileRouter.post('/upload', upload.single('file'), (req, res) => {
    res.json({ message: `Archivo '${req.file.originalname}' subido correctamente.` });
});
fileRouter.post('/create-folder', (req, res) => {
    const { path: newFolderPath } = req.body;
    if (!newFolderPath) return res.status(400).json({ message: 'No se proporcionó la ruta' });
    const fullPath = path.join(BASE_STORAGE_PATH, newFolderPath);
    if (!fullPath.startsWith(BASE_STORAGE_PATH)) return res.status(403).json({ message: 'Acceso prohibido' });
    fs.mkdir(fullPath, { recursive: true }, (err) => {
        if (err) return res.status(500).json({ message: 'Error al crear la carpeta' });
        res.status(201).json({ message: 'Carpeta creada con éxito' });
    });
});
fileRouter.delete('/delete', (req, res) => {
    const { path: itemPath } = req.body;
    if (!itemPath) return res.status(400).json({ message: 'No se proporcionó la ruta' });
    const fullPath = path.join(BASE_STORAGE_PATH, itemPath);
    if (!fullPath.startsWith(BASE_STORAGE_PATH)) return res.status(403).json({ message: 'Acceso prohibido' });
    fs.rm(fullPath, { recursive: true, force: true }, (err) => {
        if (err) return res.status(500).json({ message: 'Error al borrar' });
        res.json({ message: 'Elemento borrado con éxito' });
    });
});

fileRouter.post('/download-multiple', (req, res) => {
  const { filesToZip } = req.body;

  if (!filesToZip || filesToZip.length === 0) {
    return res.status(400).json({ message: 'No se proporcionaron archivos para comprimir.' });
  }

  // Creamos el archivo zip
  const archive = archiver('zip', {
    zlib: { level: 9 } // Nivel de compresión máximo
  });

  // Cuando archiver termina, lo indicamos.
  archive.on('end', () => {
    console.log('Archivo ZIP creado y enviado.');
  });
  
  // Si hay un error, lo enviamos como respuesta
  archive.on('error', (err) => {
    res.status(500).send({ error: err.message });
  });

  // Le decimos al navegador que la respuesta es un archivo zip para descargar
  res.attachment('dav-cloud-download.zip');

  // "Conectamos" la salida del archiver directamente a la respuesta HTTP
  archive.pipe(res);

  // Iteramos sobre la lista de archivos que nos pidió el frontend
  for (const relativePath of filesToZip) {
    const fullPath = path.join(BASE_STORAGE_PATH, relativePath);
    
    // Medida de seguridad
    if (fullPath.startsWith(BASE_STORAGE_PATH) && fs.existsSync(fullPath)) {
      // Añadimos cada archivo al zip, manteniendo su ruta relativa
      archive.file(fullPath, { name: relativePath });
    }
  }

  // Finalizamos el proceso. Esto le dice a archiver que no se añadirán más archivos.
  archive.finalize();
});

fileRouter.get('/download/:path(*)', (req, res) => {
    const fullPath = path.join(BASE_STORAGE_PATH, req.params.path);
    if (!fullPath.startsWith(BASE_STORAGE_PATH)) return res.status(403).json({ message: 'Acceso prohibido' });
    res.download(fullPath, (err) => {
        if (err && !res.headersSent) res.status(404).send('Archivo no encontrado.');
    });
});
app.use('/api/files', fileRouter);

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🗂️  Almacenamiento en: ${BASE_STORAGE_PATH}`);
});