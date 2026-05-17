const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Carpeta uploads creada');
}

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'evidencia-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    },
    fileFilter: function (req, file, cb) {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'));
        }
    }
});

// Conexión a MySQL
const db = mysql.createConnection({
    host: 'roundhouse.proxy.rlwy.net',
    user: 'root',
    password: 'agLkZoAxCzRvHkmLFpKBSMDpSTgAmNoH',
    database: 'railway',
    port: 49780,
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) {
        console.log('❌ Error MySQL:', err.message);
        return;
    }
    console.log('✅ MySQL conectado');
    crearTablas();
});

// Crear tablas necesarias
function crearTablas() {
    // Tabla evidencias
    db.query(`
        CREATE TABLE IF NOT EXISTS evidencias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_id INT NOT NULL,
            url_imagen VARCHAR(500) NOT NULL,
            descripcion TEXT,
            fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            orden INT DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => {
        if (err) {
            console.log('⚠️ Error creando tabla evidencias:', err.message);
        } else {
            console.log('✅ Tabla evidencias verificada');
        }
    });

    // Verificar/modificar tabla planillas para agregar precio_unitario
    db.query("SHOW COLUMNS FROM planillas LIKE 'precio_unitario'", (err, result) => {
        if (err) {
            console.log('⚠️ Error verificando planillas:', err.message);
            return;
        }
        if (result.length === 0) {
            db.query("ALTER TABLE planillas ADD COLUMN precio_unitario DECIMAL(10,2) DEFAULT 0 AFTER cantidad", (err2) => {
                if (err2) {
                    console.log('⚠️ Columna precio_unitario ya existe o error:', err2.message);
                } else {
                    console.log('✅ Columna precio_unitario agregada a planillas');
                }
            });
        } else {
            console.log('✅ Tabla planillas verificada');
        }
    });

    // Tabla ampliaciones
    db.query(`
        CREATE TABLE IF NOT EXISTS ampliaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            descripcion TEXT,
            inicio DATE,
            fin DATE,
            plazo INT,
            acumulado INT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => {
        if (err) {
            console.log('⚠️ Error creando tabla ampliaciones:', err.message);
        } else {
            console.log('✅ Tabla ampliaciones verificada');
        }
    });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* =========================
   LOGIN
========================= */
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
        return res.json({ success: false, mensaje: 'Complete todos los campos' });
    }
    db.query("SELECT * FROM usuarios WHERE usuario = ? AND password = ?", [usuario, password], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        if (result.length > 0) {
            res.json({ success: true, usuario: { id: result[0].id, usuario: result[0].usuario } });
        } else {
            res.json({ success: false, mensaje: 'Credenciales incorrectas' });
        }
    });
});

/* =========================
   AGREGAR COLUMNA item_numero
========================= */
app.get('/migrar-agregar-item-numero', (req, res) => {
    db.query("ALTER TABLE items ADD COLUMN item_numero VARCHAR(10) DEFAULT '' AFTER modulo_id", (err) => {
        if (err) {
            console.log('⚠️ La columna ya existe o error:', err.message);
            res.json({ success: false, mensaje: err.message });
        } else {
            console.log('✅ Columna item_numero agregada');
            res.json({ success: true, mensaje: 'Columna item_numero agregada' });
        }
    });
});

/* =========================
   GUARDAR ITEMS
========================= */
app.post('/guardar-item', (req, res) => {
    const items = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, mensaje: 'No hay datos' });
    }

    let guardados = 0;
    let pendientes = items.length;
    const idsRetornados = [];

    items.forEach(item => {
        db.query(
            "SELECT id FROM items WHERE modulo_id = ? AND descripcion = ?",
            [item.modulo_id, item.descripcion],
            (err, result) => {
                if (err) {
                    console.error('❌ Error al verificar:', err.message);
                    pendientes--;
                    if (pendientes === 0) {
                        res.json({ success: guardados > 0, ids: idsRetornados });
                    }
                    return;
                }
                
                if (result.length > 0) {
                    const itemId = result[0].id;
                    db.query(
                        `UPDATE items SET 
                            item_numero = ?, 
                            unidad = ?, 
                            cantidad = ?, 
                            precio_unitario = ?, 
                            total = ?, 
                            porcentaje_incidencia = ?
                         WHERE id = ?`,
                        [
                            item.item_numero || '',
                            item.unidad || '',
                            item.cantidad || 0,
                            item.precio_unitario || 0,
                            item.total || 0,
                            item.porcentaje_incidencia || '0%',
                            itemId
                        ],
                        (err) => {
                            if (err) console.error('❌ Error update:', err.message);
                            guardados++;
                            idsRetornados.push(itemId);
                            pendientes--;
                            if (pendientes === 0) {
                                res.json({ success: true, ids: idsRetornados });
                            }
                        }
                    );
                } else {
                    db.query(
                        `INSERT INTO items 
                            (modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.modulo_id || 1,
                            item.item_numero || '',
                            item.descripcion || '',
                            item.unidad || '',
                            item.cantidad || 0,
                            item.precio_unitario || 0,
                            item.total || 0,
                            item.porcentaje_incidencia || '0%'
                        ],
                        (err, result) => {
                            if (err) {
                                console.error('❌ Error insert:', err.message);
                            } else {
                                guardados++;
                                const itemId = result.insertId;
                                idsRetornados.push(itemId);
                                
                                if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                                    item.ordenesCambio.forEach(oc => {
                                        db.query(
                                            "INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)",
                                            [itemId, oc.numero, oc.cantidad, oc.precio, oc.total],
                                            (err) => { if (err) console.log('Error OC:', err.message); }
                                        );
                                    });
                                }
                                
                                if (item.contratosMod && item.contratosMod.length > 0) {
                                    item.contratosMod.forEach(cm => {
                                        db.query(
                                            "INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)",
                                            [itemId, cm.numero, cm.cantidad, cm.precio, cm.total],
                                            (err) => { if (err) console.log('Error CM:', err.message); }
                                        );
                                    });
                                }
                            }
                            pendientes--;
                            if (pendientes === 0) {
                                console.log(`✅ ${guardados} ítems procesados`);
                                res.json({ success: true, ids: idsRetornados });
                            }
                        }
                    );
                }
            }
        );
    });
});

/* =========================
   GUARDAR ITEMS BATCH
========================= */
app.post('/guardar-items-batch', (req, res) => {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, mensaje: 'No hay datos' });
    }

    let procesados = 0;
    let exitos = 0;

    items.forEach(async (item) => {
        try {
            if (item.id) {
                await db.promise().query(
                    `UPDATE items SET 
                        modulo_id = ?, 
                        item_numero = ?, 
                        descripcion = ?, 
                        unidad = ?, 
                        cantidad = ?, 
                        precio_unitario = ?, 
                        total = ?, 
                        porcentaje_incidencia = ?
                     WHERE id = ?`,
                    [
                        item.modulo_id, item.item_numero, item.descripcion, item.unidad,
                        item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia,
                        item.id
                    ]
                );
                
                await db.promise().query('DELETE FROM ordenes_cambio WHERE item_id = ?', [item.id]);
                if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                    for (const oc of item.ordenesCambio) {
                        await db.promise().query(
                            'INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                            [item.id, oc.numero, oc.cantidad, oc.precio, oc.total]
                        );
                    }
                }
                
                await db.promise().query('DELETE FROM contratos_mod WHERE item_id = ?', [item.id]);
                if (item.contratosMod && item.contratosMod.length > 0) {
                    for (const cm of item.contratosMod) {
                        await db.promise().query(
                            'INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                            [item.id, cm.numero, cm.cantidad, cm.precio, cm.total]
                        );
                    }
                }
                exitos++;
            } else {
                const [result] = await db.promise().query(
                    `INSERT INTO items 
                        (modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.modulo_id, item.item_numero, item.descripcion, item.unidad,
                        item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia
                    ]
                );
                const nuevoId = result.insertId;
                
                if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                    for (const oc of item.ordenesCambio) {
                        await db.promise().query(
                            'INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                            [nuevoId, oc.numero, oc.cantidad, oc.precio, oc.total]
                        );
                    }
                }
                
                if (item.contratosMod && item.contratosMod.length > 0) {
                    for (const cm of item.contratosMod) {
                        await db.promise().query(
                            'INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                            [nuevoId, cm.numero, cm.cantidad, cm.precio, cm.total]
                        );
                    }
                }
                exitos++;
            }
        } catch (error) {
            console.error('Error procesando item:', error);
        }
        
        procesados++;
        if (procesados === items.length) {
            res.json({ success: exitos > 0, procesados: exitos });
        }
    });
});

/* =========================
   OBTENER ITEMS
========================= */
app.get('/items', (req, res) => {
    db.query("SELECT * FROM items ORDER BY modulo_id ASC, id ASC", (err, result) => {
        if (err) { console.log('Error /items:', err.message); return res.json([]); }
        res.json(result || []);
    });
});

/* =========================
   OBTENER ORDENES CAMBIO
========================= */
app.get('/ordenes-cambio', (req, res) => {
    db.query("SELECT * FROM ordenes_cambio ORDER BY id ASC", (err, result) => {
        if (err) { console.log('Error /ordenes-cambio:', err.message); return res.json([]); }
        res.json(result || []);
    });
});

/* =========================
   OBTENER CONTRATOS MOD
========================= */
app.get('/contratos-mod', (req, res) => {
    db.query("SELECT * FROM contratos_mod ORDER BY id ASC", (err, result) => {
        if (err) { console.log('Error /contratos-mod:', err.message); return res.json([]); }
        res.json(result || []);
    });
});

/* =========================
   EDITAR ITEM
========================= */
app.put('/editar-item/:id', (req, res) => {
    const { modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia } = req.body;
    db.query(
        `UPDATE items SET 
            modulo_id = ?, 
            item_numero = ?, 
            descripcion = ?, 
            unidad = ?, 
            cantidad = ?, 
            precio_unitario = ?, 
            total = ?, 
            porcentaje_incidencia = ? 
         WHERE id = ?`,
        [modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia, req.params.id],
        (err) => {
            if (err) { console.log('Error /editar-item:', err.message); return res.json({ success: false }); }
            res.json({ success: true });
        }
    );
});

/* =========================
   ELIMINAR ITEM
========================= */
app.delete('/eliminar-item/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM evidencias WHERE item_id=?', [id], () => {
        db.query('DELETE FROM ordenes_cambio WHERE item_id=?', [id], () => {
            db.query('DELETE FROM contratos_mod WHERE item_id=?', [id], () => {
                db.query('DELETE FROM planillas WHERE item_id=?', [id], () => {
                    db.query('DELETE FROM items WHERE id=?', [id], (err) => {
                        if (err) { console.log('Error /eliminar-item:', err.message); return res.json({ success: false }); }
                        res.json({ success: true });
                    });
                });
            });
        });
    });
});

/* =========================
   GUARDAR PLANILLAS
========================= */
app.post('/guardar-planillas', (req, res) => {
    const datos = req.body;
    if (!Array.isArray(datos)) return res.json({ success: false });
    
    // Primero eliminar planillas existentes
    const numerosPlanilla = [...new Set(datos.map(d => d.numero_planilla))];
    
    db.query('DELETE FROM planillas WHERE numero_planilla IN (?)', [numerosPlanilla], (err) => {
        if (err) {
            console.log('Error limpiando planillas:', err.message);
        }
        
        let pendientes = datos.length;
        if (pendientes === 0) return res.json({ success: true });
        
        datos.forEach(p => {
            db.query(
                "INSERT INTO planillas (numero_planilla, item_id, cantidad, precio_unitario, total, avance) VALUES (?, ?, ?, ?, ?, ?)",
                [p.numero_planilla, p.item_id, p.cantidad, p.precio_unitario || 0, p.total, p.avance || '100%'],
                (err) => {
                    if (err) console.log('Error planillas:', err.message);
                    pendientes--;
                    if (pendientes === 0) res.json({ success: true });
                }
            );
        });
    });
});

/* =========================
   OBTENER PLANILLAS
========================= */
app.get('/planillas', (req, res) => {
    db.query('SELECT * FROM planillas ORDER BY numero_planilla ASC, item_id ASC', (err, result) => {
        if (err) { console.log('Error /planillas:', err.message); return res.json([]); }
        res.json(result || []);
    });
});

/* =========================
   EVIDENCIAS - GESTOR MULTIMEDIA
========================= */

// OBTENER TODAS LAS EVIDENCIAS
app.get('/evidencias', (req, res) => {
    db.query(
        'SELECT * FROM evidencias ORDER BY item_id ASC, orden ASC, id ASC',
        (err, result) => {
            if (err) {
                console.error('❌ Error /evidencias:', err.message);
                return res.json([]);
            }
            res.json(result || []);
        }
    );
});

// OBTENER EVIDENCIAS POR ITEM
app.get('/evidencias/:item_id', (req, res) => {
    db.query(
        'SELECT * FROM evidencias WHERE item_id = ? ORDER BY orden ASC, id ASC',
        [req.params.item_id],
        (err, result) => {
            if (err) {
                console.error('❌ Error /evidencias/:item_id:', err.message);
                return res.json([]);
            }
            res.json(result || []);
        }
    );
});

// SUBIR MÚLTIPLES IMÁGENES DE EVIDENCIA
app.post('/subir-evidencias', upload.array('imagenes', 10), (req, res) => {
    const { item_id } = req.body;
    
    if (!item_id) {
        return res.json({ success: false, error: 'Se requiere item_id' });
    }
    
    if (!req.files || req.files.length === 0) {
        return res.json({ success: false, error: 'No se subieron imágenes' });
    }
    
    const evidencias = [];
    let pendientes = req.files.length;
    
    req.files.forEach((file, index) => {
        const url_imagen = '/uploads/' + file.filename;
        
        db.query(
            'INSERT INTO evidencias (item_id, url_imagen, orden) VALUES (?, ?, ?)',
            [item_id, url_imagen, index],
            (err, result) => {
                if (err) {
                    console.error('❌ Error insertando evidencia:', err.message);
                } else {
                    evidencias.push({
                        id: result.insertId,
                        item_id: parseInt(item_id),
                        url_imagen: url_imagen,
                        descripcion: '',
                        orden: index
                    });
                }
                
                pendientes--;
                if (pendientes === 0) {
                    res.json({ 
                        success: true, 
                        evidencias: evidencias,
                        mensaje: evidencias.length + ' imágenes subidas exitosamente'
                    });
                }
            }
        );
    });
});

// REEMPLAZAR IMAGEN DE EVIDENCIA
app.put('/reemplazar-evidencia', upload.single('imagen'), (req, res) => {
    const { evidencia_id } = req.body;
    
    if (!evidencia_id || !req.file) {
        return res.json({ success: false, error: 'Faltan datos requeridos' });
    }
    
    const nuevaUrl = '/uploads/' + req.file.filename;
    
    db.query('SELECT url_imagen FROM evidencias WHERE id = ?', [evidencia_id], (err, result) => {
        if (err || result.length === 0) {
            return res.json({ success: false, error: 'Evidencia no encontrada' });
        }
        
        const urlAntigua = result[0].url_imagen;
        
        db.query(
            'UPDATE evidencias SET url_imagen = ? WHERE id = ?',
            [nuevaUrl, evidencia_id],
            (err) => {
                if (err) {
                    console.error('❌ Error reemplazando:', err.message);
                    return res.json({ success: false, error: err.message });
                }
                
                // Eliminar archivo antiguo
                const archivoAntiguo = path.join(__dirname, urlAntigua);
                fs.unlink(archivoAntiguo, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.log('⚠️ No se pudo eliminar archivo antiguo:', err.message);
                    }
                });
                
                res.json({ 
                    success: true, 
                    url_imagen: nuevaUrl,
                    mensaje: 'Imagen reemplazada exitosamente'
                });
            }
        );
    });
});

// GUARDAR/ACTUALIZAR DESCRIPCIÓN DE EVIDENCIA
app.put('/evidencias/:id/descripcion', (req, res) => {
    const { descripcion } = req.body;
    const id = req.params.id;
    
    if (!id) {
        return res.json({ success: false, error: 'ID de evidencia requerido' });
    }
    
    db.query(
        'UPDATE evidencias SET descripcion = ? WHERE id = ?',
        [descripcion || '', id],
        (err) => {
            if (err) {
                console.error('❌ Error guardando descripción:', err.message);
                return res.json({ success: false, error: err.message });
            }
            
            res.json({ 
                success: true, 
                mensaje: 'Descripción guardada exitosamente' 
            });
        }
    );
});

// ELIMINAR EVIDENCIA
app.delete('/evidencias/:id', (req, res) => {
    const id = req.params.id;
    
    if (!id) {
        return res.json({ success: false, error: 'ID de evidencia requerido' });
    }
    
    db.query('SELECT url_imagen FROM evidencias WHERE id = ?', [id], (err, result) => {
        if (err || result.length === 0) {
            return res.json({ success: false, error: 'Evidencia no encontrada' });
        }
        
        const urlImagen = result[0].url_imagen;
        
        db.query('DELETE FROM evidencias WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('❌ Error eliminando evidencia:', err.message);
                return res.json({ success: false, error: err.message });
            }
            
            const archivo = path.join(__dirname, urlImagen);
            fs.unlink(archivo, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.log('⚠️ No se pudo eliminar archivo:', err.message);
                }
            });
            
            res.json({ 
                success: true, 
                mensaje: 'Evidencia eliminada exitosamente' 
            });
        });
    });
});

/* =========================
   GUARDAR AMPLIACIONES
========================= */
app.post('/guardar-ampliaciones', (req, res) => {
    const datos = req.body;
    if (!Array.isArray(datos)) return res.json({ success: false });
    
    db.query("DELETE FROM ampliaciones", () => {
        const sql = "INSERT INTO ampliaciones (descripcion, inicio, fin, plazo, acumulado) VALUES (?, ?, ?, ?, ?)";
        let pendientes = datos.length;
        
        datos.forEach(d => {
            db.query(sql, [d.descripcion, d.inicio, d.fin, d.plazo, d.acumulado], (err) => {
                if (err) console.log('Error:', err);
                pendientes--;
                if (pendientes === 0) res.json({ success: true });
            });
        });
        
        if (datos.length === 0) res.json({ success: true });
    });
});

/* =========================
   OBTENER AMPLIACIONES
========================= */
app.get('/ampliaciones', (req, res) => {
    db.query("SELECT * FROM ampliaciones ORDER BY id ASC", (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

// Manejo de errores de multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.json({ success: false, error: 'Archivo demasiado grande. Máximo 10MB' });
        }
        return res.json({ success: false, error: err.message });
    }
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en puerto ' + PORT);
    console.log('📁 Archivos estáticos desde: ' + __dirname);
    console.log('📸 Uploads en: ' + uploadsDir);
});