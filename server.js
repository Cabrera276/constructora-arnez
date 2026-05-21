const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

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
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== LOGIN =====
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

// ===== ITEMS =====
app.post('/guardar-item-completo', (req, res) => {
    const item = req.body;
    
    if (item.id) {
        const sqlUpdate = `UPDATE items SET 
            modulo_id = ?, item_numero = ?, descripcion = ?, unidad = ?, 
            cantidad = ?, precio_unitario = ?, total = ?, porcentaje_incidencia = ? 
        WHERE id = ?`;
        
        db.query(sqlUpdate, [
            item.modulo_id, item.item_numero, item.descripcion, item.unidad,
            item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia,
            item.id
        ], (err) => {
            if (err) return res.json({ success: false, error: err.message });
            
            db.query('DELETE FROM ordenes_cambio WHERE item_id = ?', [item.id]);
            if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                item.ordenesCambio.forEach(oc => {
                    db.query('INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [item.id, oc.numero, oc.cantidad, oc.precio, oc.total]);
                });
            }
            
            db.query('DELETE FROM contratos_mod WHERE item_id = ?', [item.id]);
            if (item.contratosMod && item.contratosMod.length > 0) {
                item.contratosMod.forEach(cm => {
                    db.query('INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [item.id, cm.numero, cm.cantidad, cm.precio, cm.total]);
                });
            }
            
            res.json({ success: true, actualizado: true, id: item.id });
        });
    } else {
        const sqlInsert = `INSERT INTO items 
            (modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sqlInsert, [
            item.modulo_id, item.item_numero, item.descripcion, item.unidad,
            item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia
        ], (err, result) => {
            if (err) return res.json({ success: false, error: err.message });
            
            const nuevoId = result.insertId;
            
            if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                item.ordenesCambio.forEach(oc => {
                    db.query('INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [nuevoId, oc.numero, oc.cantidad, oc.precio, oc.total]);
                });
            }
            
            if (item.contratosMod && item.contratosMod.length > 0) {
                item.contratosMod.forEach(cm => {
                    db.query('INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [nuevoId, cm.numero, cm.cantidad, cm.precio, cm.total]);
                });
            }
            
            res.json({ success: true, actualizado: false, id: nuevoId });
        });
    }
});

app.get('/items', (req, res) => {
    db.query("SELECT * FROM items ORDER BY modulo_id ASC, id ASC", (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

app.get('/ordenes-cambio', (req, res) => {
    db.query("SELECT * FROM ordenes_cambio ORDER BY id ASC", (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

app.get('/contratos-mod', (req, res) => {
    db.query("SELECT * FROM contratos_mod ORDER BY id ASC", (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

app.delete('/eliminar-item/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM ordenes_cambio WHERE item_id=?', [id], () => {
        db.query('DELETE FROM contratos_mod WHERE item_id=?', [id], () => {
            db.query('DELETE FROM items WHERE id=?', [id], (err) => {
                if (err) return res.json({ success: false });
                res.json({ success: true });
            });
        });
    });
});

// ===== PLANILLAS =====
app.post('/guardar-planillas', (req, res) => {
    const datos = req.body;
    if (!Array.isArray(datos)) return res.json({ success: false });
    
    let pendientes = datos.length;
    if (pendientes === 0) return res.json({ success: true });
    
    datos.forEach(p => {
        db.query(
            'SELECT id FROM planillas WHERE item_id = ? AND numero_planilla = ?',
            [p.item_id, p.numero_planilla],
            (err, result) => {
                if (err) {
                    console.log('Error verificando:', err);
                    pendientes--;
                    if (pendientes === 0) res.json({ success: false });
                    return;
                }
                
                if (result && result.length > 0) {
                    db.query(
                        'UPDATE planillas SET cantidad = ?, total = ?, avance = ? WHERE item_id = ? AND numero_planilla = ?',
                        [p.cantidad, p.total, p.avance, p.item_id, p.numero_planilla],
                        (err) => {
                            if (err) console.log('Error update:', err.message);
                            pendientes--;
                            if (pendientes === 0) res.json({ success: true });
                        }
                    );
                } else {
                    db.query(
                        'INSERT INTO planillas (numero_planilla, item_id, cantidad, total, avance) VALUES (?, ?, ?, ?, ?)',
                        [p.numero_planilla, p.item_id, p.cantidad, p.total, p.avance],
                        (err) => {
                            if (err) console.log('Error insert:', err.message);
                            pendientes--;
                            if (pendientes === 0) res.json({ success: true });
                        }
                    );
                }
            }
        );
    });
});

app.get('/planillas', (req, res) => {
    db.query('SELECT * FROM planillas', (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

// ===== AMPLIACIONES (CORREGIDO) =====
app.post('/guardar-ampliaciones', (req, res) => {
    const datos = req.body;
    if (!Array.isArray(datos)) return res.json({ success: false });
    
    let pendientes = datos.length;
    if (pendientes === 0) return res.json({ success: true });
    
    datos.forEach(d => {
        if (d.id && d.id > 0) {
            db.query(
                `UPDATE ampliaciones SET descripcion = ?, inicio = ?, fin = ?, plazo = ?, acumulado = ? WHERE id = ?`,
                [d.descripcion, d.inicio, d.fin, d.plazo, d.acumulado, d.id],
                (err) => {
                    if (err) console.log('Error update:', err.message);
                    pendientes--;
                    if (pendientes === 0) res.json({ success: true });
                }
            );
        } else {
            db.query(
                `INSERT INTO ampliaciones (descripcion, inicio, fin, plazo, acumulado) VALUES (?, ?, ?, ?, ?)`,
                [d.descripcion, d.inicio, d.fin, d.plazo, d.acumulado],
                (err) => {
                    if (err) console.log('Error insert:', err.message);
                    pendientes--;
                    if (pendientes === 0) res.json({ success: true });
                }
            );
        }
    });
});

app.get('/ampliaciones', (req, res) => {
    db.query("SELECT * FROM ampliaciones ORDER BY id ASC", (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

// ===== ELIMINAR AMPLIACIÓN POR ID (NUEVO) =====
app.delete('/eliminar-ampliacion/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM ampliaciones WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.log('Error al eliminar ampliación:', err.message);
            return res.json({ success: false, error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.json({ success: false, message: 'No se encontró el registro' });
        }
        res.json({ success: true, message: 'Eliminado correctamente' });
    });
});

// ===== EVIDENCIAS CON BASE64 =====
app.get('/evidencias', (req, res) => {
    db.query('SELECT id, item_id, url_imagen, descripcion, fecha_subida, orden FROM evidencias ORDER BY orden ASC', (err, result) => {
        if (err) {
            console.log('Error /evidencias:', err.message);
            return res.json([]);
        }
        res.json(result || []);
    });
});

app.post('/subir-evidencia', (req, res) => {
    console.log('📸 POST /subir-evidencia - Guardando Base64 en BD');
    
    try {
        const { item_id, descripcion, orden, imagen_base64 } = req.body;
        
        if (!imagen_base64) {
            return res.status(400).json({ success: false, error: 'No se recibió imagen' });
        }
        
        db.query(
            'INSERT INTO evidencias (item_id, url_imagen, descripcion, orden, fecha_subida) VALUES (?, ?, ?, ?, NOW())',
            [item_id, imagen_base64, descripcion || '', orden || 0],
            (err, result) => {
                if (err) {
                    console.log('Error insertando:', err.message);
                    return res.status(500).json({ success: false, error: err.message });
                }
                console.log('✅ Imagen guardada en BD como Base64');
                res.json({ success: true, id: result.insertId });
            }
        );
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/guardar-evidencia', (req, res) => {
    const { id, descripcion, orden } = req.body;
    db.query('UPDATE evidencias SET descripcion = ?, orden = ? WHERE id = ?', [descripcion || '', orden || 0, id], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

app.post('/actualizar-evidencia-imagen', (req, res) => {
    try {
        const { evidencia_id, imagen_base64 } = req.body;
        
        if (!imagen_base64) {
            return res.status(400).json({ success: false });
        }
        
        db.query('UPDATE evidencias SET url_imagen = ?, fecha_subida = NOW() WHERE id = ?', [imagen_base64, evidencia_id], (err) => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        });
    } catch (error) {
        res.json({ success: false });
    }
});

app.post('/eliminar-evidencia', (req, res) => {
    const { evidencia_id } = req.body;
    db.query('DELETE FROM evidencias WHERE id = ?', [evidencia_id], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));