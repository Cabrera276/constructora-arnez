const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

/* CONFIGURACION */

app.use(cors());
app.use(express.json());

/* CONEXION MYSQL */

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12714883',
    database: 'constructora_arnez'
});

/* CONECTAR MYSQL */

db.connect((err) => {

    if(err){

        console.log('Error conexion MySQL:', err);
        return;

    }

    console.log('MySQL conectado');

});

/* RUTA PRINCIPAL */

app.get('/', (req, res) => {

    res.send('Servidor funcionando');

});

/* LOGIN */

app.post('/login', (req, res) => {

    const { usuario, password } = req.body;

    if(!usuario || !password){

        return res.json({
            success:false,
            mensaje:'Complete todos los campos'
        });

    }

    const sql = `
        SELECT * FROM usuarios
        WHERE usuario = ?
        AND password = ?
    `;

    db.query(sql, [usuario, password], (err, result) => {

        if(err){

            console.log(err);

            return res.status(500).json({
                success:false,
                mensaje:'Error del servidor'
            });

        }

        if(result.length > 0){

            res.json({
                success:true,
                mensaje:'Login correcto',
                usuario: result[0]
            });

        }else{

            res.json({
                success:false,
                mensaje:'Usuario o contraseña incorrectos'
            });

        }

    });

});

/* =========================
   GUARDAR ITEMS
========================= */

app.post('/guardar-item', (req, res) => {

    const items = req.body;

    if(!Array.isArray(items)){

        return res.status(400).json({
            success:false,
            mensaje:'Formato incorrecto'
        });

    }

    /* LIMPIAR TABLAS */

    db.query("DELETE FROM ordenes_cambio");
    db.query("DELETE FROM contratos_mod");
    db.query("DELETE FROM items");

    const sql = `
       INSERT INTO items (

    modulo_id,
    descripcion,
    unidad,

    cantidad,
    precio_unitario,
    total,

    porcentaje_incidencia,

    imagen,
    descripcion_imagen

)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    items.forEach(item => {

        db.query(

            sql,

            [

                item.modulo_id,
                item.descripcion,
                item.unidad,

                item.cantidad,
                item.precio_unitario,
                item.total,

                item.porcentaje_incidencia,

                item.imagen,
                item.descripcion_imagen

            ],

            (err, result) => {

                if(err){

                    console.log(err);
                    return;

                }

                const itemId = result.insertId;

                /* ORDENES CAMBIO */

                item.ordenesCambio.forEach(oc => {

                    db.query(

                        `
                        INSERT INTO ordenes_cambio (

                            item_id,
                            numero_oc,
                            cantidad,
                            precio,
                            total

                        )

                        VALUES (?, ?, ?, ?, ?)
                        `,

                        [

                            itemId,
                            oc.numero,
                            oc.cantidad,
                            oc.precio,
                            oc.total

                        ]

                    );

                });

                /* CONTRATOS MOD */

                item.contratosMod.forEach(cm => {

                    db.query(

                        `
                        INSERT INTO contratos_mod (

                            item_id,
                            numero_cm,
                            cantidad,
                            precio,
                            total

                        )

                        VALUES (?, ?, ?, ?, ?)
                        `,

                        [

                            itemId,
                            cm.numero,
                            cm.cantidad,
                            cm.precio,
                            cm.total

                        ]

                    );

                });

            }

        );

    });

    res.json({

        success:true,
        mensaje:'Items guardados'

    });

});

/* =========================
   OBTENER ITEMS
========================= */

app.get('/items', (req, res) => {

    const sql = `
        SELECT * FROM items
        ORDER BY modulo_id ASC, id ASC
    `;

    db.query(sql, (err, result) => {

        if(err){

            console.log(err);
            return res.status(500).json(err);

        }

        res.json(result);

    });

});

/* =========================
   OBTENER ORDENES CAMBIO
========================= */

app.get('/ordenes-cambio', (req, res) => {

    const sql = `
        SELECT * FROM ordenes_cambio
        ORDER BY id ASC
    `;

    db.query(sql, (err, result) => {

        if(err){

            console.log(err);
            return res.status(500).json(err);

        }

        res.json(result);

    });

});

/* =========================
   OBTENER CONTRATOS MOD
========================= */

app.get('/contratos-mod', (req, res) => {

    const sql = `
        SELECT * FROM contratos_mod
        ORDER BY id ASC
    `;

    db.query(sql, (err, result) => {

        if(err){

            console.log(err);
            return res.status(500).json(err);

        }

        res.json(result);

    });

});

/* =========================
   ELIMINAR ITEM
========================= */

app.delete('/eliminar-item/:id', (req,res)=>{

const id = req.params.id;

db.query(

'DELETE FROM ordenes_cambio WHERE item_id=?',

[id],

(err)=>{

if(err){

console.log(err);
return res.status(500).json(err);

}

db.query(

'DELETE FROM contratos_mod WHERE item_id=?',

[id],

(err)=>{

if(err){

console.log(err);
return res.status(500).json(err);

}

db.query(

'DELETE FROM items WHERE id=?',

[id],

(err)=>{

if(err){

console.log(err);
return res.status(500).json(err);

}

res.json({
success:true
});

}

);

}

);

}

);

});

/* =========================
   EDITAR ITEM
========================= */

app.put('/editar-item/:id', (req,res)=>{

const id = req.params.id;

const {

descripcion,
unidad,
cantidad,
precio_unitario,
total

} = req.body;

db.query(

`UPDATE items
SET
descripcion=?,
unidad=?,
cantidad=?,
precio_unitario=?,
total=?
WHERE id=?`,

[
descripcion,
unidad,
cantidad,
precio_unitario,
total,
id
],

(err)=>{

if(err){

console.log(err);
return res.status(500).json(err);

}

res.json({
success:true
});

}

);

});

/* =========================
   INICIAR SERVIDOR
========================= */

app.listen(3000, () => {

    console.log('Servidor corriendo en puerto 3000');

});