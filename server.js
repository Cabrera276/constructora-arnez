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

/* LOGIN */
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

/* GUARDAR ITEMS */
app.post('/guardar-item', (req, res) => {
    const items = req.body;
    
    console.log('📦 Recibido:', JSON.stringify(items).substring(0, 200));
    
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
                console.log('✅ Insertado ID:', result.insertId);
            }
            
            pendientes--;
            if (pendientes === 0) {
                console.log(`✅ Total guardados: ${guardados}`);
                res.json({ success: true, mensaje: `${guardados} ítems guardados` });
            }
        });
    });
});

/* OBTENER ITEMS */
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

app.put('/editar-item/:id', (req, res) => {
    const { descripcion, unidad, cantidad, precio_unitario, total } = req.body;
    db.query("UPDATE items SET descripcion=?, unidad=?, cantidad=?, precio_unitario=?, total=? WHERE id=?",
        [descripcion, unidad, cantidad, precio_unitario, total, req.params.id],
        (err) => res.json({ success: !err })
    );
});

app.delete('/eliminar-item/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM ordenes_cambio WHERE item_id=?', [id], () => {
        db.query('DELETE FROM contratos_mod WHERE item_id=?', [id], () => {
            db.query('DELETE FROM items WHERE id=?', [id], (err) => {
                res.json({ success: !err });
            });
        });
    });
});

app.post('/guardar-planillas', (req, res) => {
    const datos = req.body;
    if (!Array.isArray(datos)) return res.json({ success: false });
    datos.forEach(p => {
        db.query("INSERT INTO planillas (numero_planilla, item_id, cantidad, total, avance) VALUES (?, ?, ?, ?, ?)",
            [p.numero_planilla, p.item_id, p.cantidad, p.total, p.avance]
        );
    });
    res.json({ success: true });
});

app.get('/planillas', (req, res) => {
    db.query('SELECT * FROM planillas', (err, result) => {
        if (err) return res.json([]);
        res.json(result || []);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));