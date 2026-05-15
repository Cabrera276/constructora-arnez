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
   GUARDAR ITEMS (CORREGIDO)
========================= */
app.post('/guardar-item', (req, res) => {
    const items = req.body;
    
    console.log('📦 Recibidos:', items.length, 'ítems');
    
    if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, mensaje: 'No hay datos' });
    }

    const sql = "INSERT INTO items (modulo_id, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia, imagen, descripcion_imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    let guardados = 0;
    let pendientes = items.length;

    items.forEach(item => {
        const valores = [
            item.modulo_id || 1,
            item.descripcion || '',
            item.unidad || '',
            item.cantidad || 0,
            item.precio_unitario || 0,
            item.total || 0,
            item.porcentaje_incidencia || '0%',
            item.imagen || '',
            item.descripcion_imagen || ''
        ];
        
        db.query(sql, valores, (err, result) => {
            if (err) {
                console.error('❌ Error INSERT:', err.message);
            } else {
                guardados++;
                const itemId = result.insertId;
                console.log('✅ Insertado ID:', itemId);
                
                // Guardar OC si tiene
                if (item.ordenesCambio && item.ordenesCambio.length > 0) {
                    item.ordenesCambio.forEach(oc => {
                        db.query(
                            "INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)",
                            [itemId, oc.numero, oc.cantidad, oc.precio, oc.total],
                            (err) => { if (err) console.log('Error OC:', err.message); }
                        );
                    });
                }
                
                // Guardar CM si tiene
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
                console.log(`✅ Total guardados: ${guardados}`);
                res.json({ success: true, mensaje: `${guardados} ítems guardados` });
            }
        });
    });
});

/* =========================
   OBTENER ITEMS
========================= */
app.get('/items', (req, res) => {
    db.query("SELECT * FROM items ORDER BY modulo_id ASC, id ASC", (err, result) => {
        if (err) {
            console.log('Error /items:', err.message);
            return res.json([]);
        }
        res.json(result || []);
    });
});

/* =========================
   OBTENER ORDENES CAMBIO
========================= */
app.get('/ordenes-cambio', (req, res) => {
    db.query("SELECT * FROM ordenes_cambio ORDER BY id ASC", (err, result) => {
        if (err) {
            console.log('Error /ordenes-cambio:', err.message);
            return res.json([]);
        }
        res.json(result || []);
    });
});

/* =========================
   OBTENER CONTRATOS MOD
========================= */
app.get('/contratos-mod', (req, res) => {
    db.query("SELECT * FROM contratos_mod ORDER BY id ASC", (err, result) => {
        if (err) {
            console.log('Error /contratos-mod:', err.message);
            return res.json([]);
        }
        res.json(result || []);
    });
});

/* =========================
   EDITAR ITEM
========================= */
app.put('/editar-item/:id', (req, res) => {
    const { descripcion, unidad, cantidad, precio_unitario, total } = req.body;
    db.query(
        "UPDATE items SET descripcion=?, unidad=?, cantidad=?, precio_unitario=?, total=? WHERE id=?",
        [descripcion, unidad, cantidad, precio_unitario, total, req.params.id],
        (err) => {
            if (err) {
                console.log('Error /editar-item:', err.message);
                return res.json({ success: false });
            }
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
                if (err) {
                    console.log('Error /eliminar-item:', err.message);
                    return res.json({ success: false });
                }
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
        if (err) {
            console.log('Error /planillas:', err.message);
            return res.json([]);
        }
        res.json(result || []);
    });
});

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));