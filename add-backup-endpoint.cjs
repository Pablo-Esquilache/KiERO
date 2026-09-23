const fs = require('fs');

let js = fs.readFileSync('backend/controllers/exportarController.js', 'utf8');

const backupLogic = `
/* ==========================
   GET - EXPORTAR BACKUP SQL
   ========================== */
export const exportarBackupSQL = async (req, res) => {
  const { comercio_id } = req.query;
  if (!comercio_id) return res.status(400).json({ error: "comercio_id requerido" });

  try {
    const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cajas_movimientos"];
    let sqlDump = \`-- Backup generado automáticamente\\n-- Fecha: \${new Date().toISOString()}\\n-- Comercio ID: \${comercio_id}\\n\\n\`;

    for (const tabla of tablas) {
      const { rows } = await db.query(\`SELECT * FROM \${tabla} WHERE comercio_id = $1\`, [comercio_id]);
      if (rows.length === 0) continue;

      sqlDump += \`-- Tabla: \${tabla}\\n\`;
      
      rows.forEach(row => {
        const keys = Object.keys(row);
        const values = keys.map(k => {
          const val = row[k];
          if (val === null) return "NULL";
          if (typeof val === "string") return "'" + val.replace(/'/g, "''") + "'";
          if (val instanceof Date) return "'" + val.toISOString() + "'";
          return val;
        });
        
        sqlDump += \`INSERT INTO \${tabla} (\${keys.join(", ")}) VALUES (\${values.join(", ")});\\n\`;
      });
      sqlDump += "\\n";
    }

    res.setHeader("Content-Disposition", \`attachment; filename=backup_kiero_\${new Date().toISOString().split('T')[0]}.sql\`);
    res.setHeader("Content-Type", "application/sql");
    res.send(sqlDump);
  } catch (error) {
    console.error("Error generando Backup SQL:", error);
    res.status(500).json({ error: "Error al generar Backup" });
  }
};
`;

fs.writeFileSync('backend/controllers/exportarController.js', js + backupLogic);
console.log('Added exportarBackupSQL to exportarController.js');
