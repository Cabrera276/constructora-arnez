// GUARDAR ITEMS BATCH (CREAR O ACTUALIZAR)
app.post('/guardar-items-batch', async (req, res) => {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
        return res.json({ success: false, mensaje: 'No hay datos' });
    }
    
    try {
        for (const item of items) {
            if (item.id) {
                // Actualizar item existente
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
                    [item.modulo_id, item.item_numero, item.descripcion, item.unidad,
                     item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia, item.id]
                );
                
                // Actualizar OC
                await db.promise().query('DELETE FROM ordenes_cambio WHERE item_id = ?', [item.id]);
                for (const oc of item.ordenesCambio) {
                    await db.promise().query(
                        'INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [item.id, oc.numero, oc.cantidad, oc.precio, oc.total]
                    );
                }
                
                // Actualizar CM
                await db.promise().query('DELETE FROM contratos_mod WHERE item_id = ?', [item.id]);
                for (const cm of item.contratosMod) {
                    await db.promise().query(
                        'INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [item.id, cm.numero, cm.cantidad, cm.precio, cm.total]
                    );
                }
            } else {
                // Insertar nuevo item
                const [result] = await db.promise().query(
                    `INSERT INTO items 
                        (modulo_id, item_numero, descripcion, unidad, cantidad, precio_unitario, total, porcentaje_incidencia) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [item.modulo_id, item.item_numero, item.descripcion, item.unidad,
                     item.cantidad, item.precio_unitario, item.total, item.porcentaje_incidencia]
                );
                const nuevoId = result.insertId;
                
                for (const oc of item.ordenesCambio) {
                    await db.promise().query(
                        'INSERT INTO ordenes_cambio (item_id, numero_oc, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [nuevoId, oc.numero, oc.cantidad, oc.precio, oc.total]
                    );
                }
                
                for (const cm of item.contratosMod) {
                    await db.promise().query(
                        'INSERT INTO contratos_mod (item_id, numero_cm, cantidad, precio, total) VALUES (?, ?, ?, ?, ?)',
                        [nuevoId, cm.numero, cm.cantidad, cm.precio, cm.total]
                    );
                }
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, error: error.message });
    }
});