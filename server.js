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
   GUARDAR ITEM COMPLETO (CON INSERT Y UPDATE)
========================= */
app.post('/guardar-item-completo', (req, res) => {
    const item = req.body;
    
    if (item.id) {
        // ACTUALIZAR ITEM EXISTENTE
        const sqlUpdate = `UPDATE items SET 
            modulo_id = ?, 
            item_numero = ?, 
            descripcion = ?, 
            unidad = ?, 
            cantidad = ?, 
            precio_unitario = ?, 
            total = ?, 
            porcentaje_incidencia = ? 
        WHERE id = ?`;
        
        db.query(sqlUpdate, [
            item.modulo_id, item.item_numero, item.descripcion, item.unidad,
            item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia,
            item.id
        ], (err) => {
            if (err) {
                console.error('❌ Error update:', err.message);
                return res.json({ success: false, error: err.message });
            }
            
            // Actualizar OC
            db.query('DELETE FROM ordenes_cambio WHERE item_id = ?', [item.id], () => {
                if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                    item.ordenesCambio.forEach(oc => {
                        db.query(
                            'INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                            [item.id, oc.numero, oc.cantidad, oc.precio, oc.total]
                        );
                    });
                }
            });
            
            // Actualizar CM
            db.query('DELETE FROM contratos_mod WHERE item_id = ?', [item.id], () => {
                if (item.contratosMod && item.contratosMod.length > 0) {
                    item.contratosMod.forEach(cm => {
                        db.query(
                            'INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                            [item.id, cm.numero, cm.cantidad, cm.precio, cm.total]
                        );
                    });
                }
            });
            
            res.json({ success: true, actualizado: true, id: item.id });
        });
    } else {
        // INSERTAR NUEVO ITEM
        const sqlInsert = `INSERT INTO items 
            (modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sqlInsert, [
            item.modulo_id, item.item_numero, item.descripcion, item.unidad,
            item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia
        ], (err, result) => {
            if (err) {
                console.error('❌ Error insert:', err.message);
                return res.json({ success: false, error: err.message });
            }
            
            const nuevoId = result.insertId;
            
            // Insertar OC
            if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                item.ordenesCambio.forEach(oc => {
                    db.query(
                        'INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [nuevoId, oc.numero, oc.cantidad, oc.precio, oc.total]
                    );
                });
            }
            
            // Insertar CM
            if (item.contratosMod && item.contratosMod.length > 0) {
                item.contratosMod.forEach(cm => {
                    db.query(
                        'INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [nuevoId, cm.numero, cm.cantidad, cm.precio, cm.total]
                    );
                });
            }
            
            res.json({ success: true, actualizado: false, id: nuevoId });
        });
    }
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
    db.query('DELETE FROM ordenes_cambio WHERE item_id=?', [id], () => {
        db.query('DELETE FROM contratos_mod WHERE item_id=?', [id], () => {
            db.query('DELETE FROM items WHERE id=?', [id], (err) => {
                if (err) { console.log('Error /eliminar-item:', err.message); return res.json({ success: false }); }
                res.json({ success: true });
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
    datos.forEach(p => {
        db.query(
            "INSERT INTO planillas (numero_planilla, item_id, cantidad, total, avance) VALUES (?, ?, ?, ?, ?)",
            [p.numero_planilla, p.item_id, p.cantidad, p.total, p.avance],
            (err) => { if (err) console.log('Error planillas:', err.message); }
        );
    });
    res.json({ success: true });
});

/* =========================
   OBTENER PLANILLAS
========================= */
app.get('/planillas', (req, res) => {
    db.query('SELECT * FROM planillas', (err, result) => {
        if (err) { console.log('Error /planillas:', err.message); return res.json([]); }
        res.json(result || []);
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

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));