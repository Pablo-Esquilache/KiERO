const fs = require('fs');

const backupListener = `
// ==========================================
// Botón de Copia de Seguridad Manual (SQL)
// ==========================================
const backupBtn = document.getElementById("backup-btn");
if (backupBtn) {
  backupBtn.addEventListener("click", async () => {
    try {
      backupBtn.disabled = true;
      const originalText = backupBtn.textContent;
      backupBtn.textContent = "⏳ Generando...";

      const session = JSON.parse(localStorage.getItem("session"));
      const comercioId = session?.comercio_id;

      const res = await fetch(\`/api/exportar-tabla/sql?comercio_id=\${comercioId}\`);
      if (!res.ok) throw new Error("Error al descargar backup");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`backup_kiero_\${new Date().toISOString().split('T')[0]}.sql\`;
      a.click();
      URL.revokeObjectURL(url);
      
      if (typeof Swal !== "undefined") {
          Swal.fire({
              icon: "success",
              title: "Copia Resguardada",
              text: "El archivo .sql se ha descargado exitosamente.",
              timer: 3000,
              showConfirmButton: false
          });
      } else {
          alert("Backup descargado exitosamente.");
      }
    } catch (err) {
      console.error(err);
      if (typeof Swal !== "undefined") {
          Swal.fire({
              icon: "error",
              title: "Error al generar backup",
              text: "Hubo un problema. Intente nuevamente más tarde.",
          });
      } else {
          alert("Error al generar copia de seguridad.");
      }
    } finally {
      backupBtn.disabled = false;
      backupBtn.textContent = "💾 Descargar Backup";
    }
  });
}
`;

fs.appendFileSync('frontend/js/ajustes.js', backupListener);
console.log('Appended backup listener to ajustes.js');
