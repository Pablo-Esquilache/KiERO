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
