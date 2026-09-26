);
import { SystemAPI, CajasAPI } from "./api.js";

// (beforeunload quitado temporalmente)

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refresh-db-btn");
  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    const textoOriginal = refreshBtn.textContent;
    refreshBtn.textContent = "⟳ Actualizando...";

    try {
      await SystemAPI.refreshDb();
      alert("Conexión con la base actualizada");
    } catch (error) {
      alert("No se pudo reconectar con la base de datos");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = textoOriginal;
    }
  });
});

// ==========================================
// ATAJOS DE TECLADO GLOBALES
// ==========================================
document.addEventListener("keydown", (e) => {
  // F10: Abrir "Nueva Venta"
  if (e.key === "F10") {
    e.preventDefault();
    const btnNuevaVenta = document.getElementById("btnNuevaVenta");
    if (btnNuevaVenta) {
      btnNuevaVenta.click();
    } else {
      window.location.href = "ventas.html?openModal=true";
    }
  }

  // F9: Hack Desatascador de Foco en Modales (Electron Bug)
  if (e.key === "F9") {
    e.preventDefault();
    const modales = document.querySelectorAll(".app-modal");
    modales.forEach((m) => {
      if (m.style.display === "flex" || m.style.display === "block") {
        const firstVisibleInput = m.querySelector("input:not([type='hidden']), select, textarea");
        if (firstVisibleInput) {
          firstVisibleInput.blur();
          setTimeout(() => firstVisibleInput.focus(), 10);
        }
      }
    });
  }

  // ESC: Cerrar Modales
  if (e.key === "Escape") {
    const modales = document.querySelectorAll(".app-modal");
    modales.forEach((m) => {
      if (m.style.display === "flex") {
        m.style.display = "none";
      }
    });
  }

  // ENTER: Guardar / Confirmar en Modales
  if (e.key === "Enter") {
    const activeId = document.activeElement ? document.activeElement.id : "";
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";

    // Evitar interferir con inputs de búsqueda o lector de código que ya tienen su propio "Enter"
    if (
      activeTag === "textarea" ||
      activeId.toLowerCase().includes("buscar") || 
      activeId.toLowerCase().includes("barcode")
    ) {
      return;
    }

    const modales = document.querySelectorAll(".app-modal");
    let modalActivo = null;
    modales.forEach((m) => {
      if (m.style.display === "flex") {
        modalActivo = m;
      }
    });

    if (modalActivo) {
      // Prevenimos el submit por defecto para evitar doble guardado
      e.preventDefault();
      
      const btnGuardar = modalActivo.querySelector('button[type="submit"], .app-btn-guardar, .app-btn-primary');
      if (btnGuardar) {
        btnGuardar.click();
      }
    }
  }
});


// ==========================================
// ==========================================
// VALIDACIÓN GLOBAL: CAJA ABIERTA PARA VENTAS
// ==========================================
(async () => {
  const session = JSON.parse(localStorage.getItem("session"));
  const comercioId = session?.comercio_id;
  
  if (comercioId) {
    const ventasLink = document.querySelector("#tab-ventas a");

    if (ventasLink) {
      try {
        const cajaActual = await CajasAPI.getHoy(comercioId);
        if (!cajaActual || cajaActual.estado !== "abierta") {
          // Bloquear visualmente en el menú global
          
          
          ventasLink.innerHTML = "Ventas \uD83D\uDD12";
          ventasLink.title = "Debes abrir la caja para acceder a Ventas";
        } else {
          // Si por algún motivo estaba bloqueado y se abre (por ej. recarga manual)
          ventasLink.innerHTML = "Ventas";
          ventasLink.title = "";
          // Removemos estilos inline para que herede del CSS
          ventasLink.style.backgroundColor = "";
          ventasLink.style.color = "";
        }
      } catch (err) {
        console.error("Error global verificando estado de caja:", err);
      }
    }
  }
})(