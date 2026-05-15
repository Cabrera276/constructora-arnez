const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

/* CONFIGURACION */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

/* CONEXION MYSQL */
const db = mysql.createConnection({
    host: 'roundhouse.proxy.rlwy.net',
    user: 'root',
    password: 'agLkZoAxCzRvHkmLFpKBSMDpSTgAmNoH',
    database: 'railway',
    port: 49780,
    ssl: {
        rejectUnauthorized: false
    }
});

/* CONECTAR MYSQL */
db.connect((err) => {
    if (err) {
        console.log('❌ Error conexion MySQL:', err.message);
        return;
    }
    console.log('✅ MySQL conectado correctamente');
    
    // Verificar que la tabla usuarios existe
    db.query("SHOW TABLES LIKE 'usuarios'", (err, result) => {
        if (err) console.log('Error verificando tabla:', err);
        else if (result.length === 0) console.log('⚠️ Tabla "usuarios" NO existe');
        else console.log('✅ Tabla "usuarios" encontrada');
    });
});

/* RUTA PRINCIPAL */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* =========================
   LOGIN
========================= */
app.post('/login', (req, res) => {
    console.log('📩 Login recibido:', req.body);
    
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        console.log('⚠️ Campos vacíos');
        return res.json({
            success: false,
            mensaje: 'Complete todos los campos'
        });
    }

    const sql = `SELECT * FROM usuarios WHERE usuario = ? AND password = ?`;
    
    console.log('🔍 Buscando usuario:', usuario);
    
    db.query(sql, [usuario, password], (err, result) => {
        if (err) {
            console.log('❌ Error SQL:', err.message);
            return res.status(500).json({
                success: false,
                mensaje: 'Error del servidor: ' + err.message
            });
        }

        console.log('📊 Resultados encontrados:', result.length);

        if (result.length > 0) {
            console.log('✅ Login exitoso para:', usuario);
            res.json({
                success: true,
                mensaje: 'Login correcto',
                usuario: { id: result[0].id, usuario: result[0].usuario }
            });
        } else {
            console.log('❌ Credenciales incorrectas para:', usuario);
            res.json({
                success: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }
    });
});

/* =========================
   GUARDAR ITEMS
========================= */
/* =========================
   GUARDAR ITEMS (VERSIÓN SIMPLE)
========================= */
app.post('/guardar-item', async (req, res) => {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, mensaje: 'No hay datos para guardar' });
    }

    console.log('📦 Recibidos', items.length, 'ítems para guardar');

    const sql = `
        INSERT INTO items (
            modulo_id, descripcion, unidad, cantidad,
            precio_unitario, total, porcentaje_incidencia,
            imagen, descripcion_imagen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let guardados = 0;
    let errores = 0;

    for (const item of items) {
        try {
            await new Promise((resolve, reject) => {
                db.query(sql, [
                    item.modulo_id || 1,
                    item.descripcion || '',
                    item.unidad || '',
                    item.cantidad || 0,
                    item.precio_unitario || 0,
                    item.total || 0,
                    item.porcentaje_incidencia || '0%',
                    item.imagen || '',
                    item.descripcion_imagen || ''
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            guardados++;
        } catch (err) {
            console.error('Error guardando item:', err.message);
            errores++;
        }
    }

    console.log(`✅ ${guardados} guardados, ❌ ${errores} errores`);
    res.json({ 
        success: true, 
        mensaje: `${guardados} ítems guardados correctamente` 
    });
});

/* =========================
   OBTENER ITEMS
========================= */
app.get('/items', (req, res) => {
    db.query("SELECT * FROM items ORDER BY modulo_id ASC, id ASC", (err, result) => {
        if (err) {
            console.log('Error en /items:', err);
            return res.json([]); // ✅ CORREGIDO: devuelve array vacío
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
            console.log('Error en /ordenes-cambio:', err);
            return res.json([]); // ✅ CORREGIDO: devuelve array vacío
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
            console.log('Error en /contratos-mod:', err);
            return res.json([]); // ✅ CORREGIDO: devuelve array vacío
        }
        res.json(result || []);
    });
});

/* =========================
   EDITAR ITEM
========================= */
app.put('/editar-item/:id', (req, res) => {
    const id = req.params.id;
    const { descripcion, unidad, cantidad, precio_unitario, total } = req.body;
    db.query(
        `UPDATE items SET descripcion=?, unidad=?, cantidad=?, precio_unitario=?, total=? WHERE id=?`,
        [descripcion, unidad, cantidad, precio_unitario, total, id],
        (err) => {
            if (err) {
                console.log('Error en /editar-item:', err);
                return res.json({ success: false, error: err.message }); // ✅ CORREGIDO
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
                    console.log('Error en /eliminar-item:', err);
                    return res.json({ success: false, error: err.message }); // ✅ CORREGIDO
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
    const sql = `INSERT INTO planillas (numero_planilla, item_id, cantidad, total, avance) VALUES (?, ?, ?, ?, ?)`;
    datos.forEach(p => db.query(sql, [p.numero_planilla, p.item_id, p.cantidad, p.total, p.avance]));
    res.json({ success: true });
});

/* =========================
   OBTENER PLANILLAS
========================= */
app.get('/planillas', (req, res) => {
    db.query('SELECT * FROM planillas', (err, result) => {
        if (err) {
            console.log('Error en /planillas:', err);
            return res.json([]); // ✅ CORREGIDO: devuelve array vacío
        }
        res.json(result || []);
    });
});

/* =========================
   INICIAR SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});