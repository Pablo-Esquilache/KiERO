import db from "../db.js";
import XLSX from "xlsx";

/* ==========================
   GET - EXPORTAR TABLA A EXCEL
   ========================== */
export const exportarExcel = async (req, res) => {
  const { tabla, comercio_id } = req.query;
  if (!comercio_id) return res.status(400).json({ error: "comercio_id requerido" });

  if (!tabla) return res.status(400).json({ error: "tabla requerida" });

  let query;
  switch (tabla) {
    case "ventas":
      query = "SELECT * FROM ventas WHERE comercio_id = $1";
      break;
    case "clientes":
      query = "SELECT * FROM clientes WHERE comercio_id = $1";
      break;
    case "productos":
      query = "SELECT * FROM productos WHERE comercio_id = $1";
      break;
    case "gastos":
      query = "SELECT * FROM gastos WHERE comercio_id = $1";
      break;
    default:
      return res.status(400).json({ error: "Tabla no válida" });
  }

  try {
    const { rows } = await db.query(query, [comercio_id]);

    // Generar libro y hoja de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, tabla);

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename=${tabla}.xlsx`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buf);
  } catch (error) {
    console.error("Error generando Excel:", error);
    res.status(500).json({ error: "Error al generar Excel" });
  }
};

/* ==========================
   GET - EXPORTAR BACKUP SQL
   ========================== */
export const exportarBackupSQL = async (req, res) => {
  const { comercio_id } = req.query;
  if (!comercio_id) return res.status(400).json({ error: "comercio_id requerido" });

  try {
    const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cajas_movimientos"];
    let sqlDump = `-- Backup generado automáticamente\n-- Fecha: ${new Date().toISOString()}\n-- Comercio ID: ${comercio_id}\n\n`;

    for (const tabla of tablas) {
      let queryStr = `SELECT * FROM ${tabla} WHERE comercio_id = $1`;
      
      // If table doesn't have comercio_id directly, join with parent
      if (tabla === 'ventas_detalle') {
        queryStr = `SELECT vd.* FROM ventas_detalle vd JOIN ventas v ON v.id = vd.venta_id WHERE v.comercio_id = $1`;
      } else if (tabla === 'devoluciones_detalle') {
        queryStr = `SELECT dd.* FROM devoluciones_detalle dd JOIN devoluciones d ON d.id = dd.devolucion_id WHERE d.comercio_id = $1`;
      } else if (tabla === 'cajas_movimientos') {
        queryStr = `SELECT cm.* FROM cajas_movimientos cm JOIN cajas c ON c.id = cm.caja_id WHERE c.comercio_id = $1`;
      }
      
      const { rows } = await db.query(queryStr, [comercio_id]);
      if (rows.length === 0) continue;

      sqlDump += `-- Tabla: ${tabla}\n`;
      
      rows.forEach(row => {
        const keys = Object.keys(row);
        const values = keys.map(k => {
          const val = row[k];
          if (val === null) return "NULL";
          if (typeof val === "string") return "'" + val.replace(/'/g, "''") + "'";
          if (val instanceof Date) return "'" + val.toISOString() + "'";
          return val;
        });
        
        sqlDump += `INSERT INTO ${tabla} (${keys.join(", ")}) VALUES (${values.join(", ")});\n`;
      });
      sqlDump += "\n";
    }

    res.setHeader("Content-Disposition", `attachment; filename=backup_kiero_${new Date().toISOString().split('T')[0]}.sql`);
    res.setHeader("Content-Type", "application/sql");
    res.send(sqlDump);
  } catch (error) {
    console.error("Error generando Backup SQL:", error);
    res.status(500).json({ error: "Error al generar Backup" });
  }
};
