// js/utils/toast.js
function crearContenedor() {
  const c = document.createElement("div");
  c.id = "toast-container";
  c.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px";
  document.body.appendChild(c);
  return c;
}

export function toast(msg, tipo = "error") {
  const colores = { error: "#c0392b", ok: "#27ae60", info: "#2980b9", warning: "#f39c12" };
  const el = document.createElement("div");
  el.textContent = msg; 
  el.style.cssText = \`background:\${colores[tipo]};color:#fff;padding:12px 18px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transition:opacity 0.3s ease, transform 0.3s ease;transform:translateY(20px);\`;
  
  const container = document.getElementById("toast-container") || crearContenedor();
  container.appendChild(el);
  
  // Animar entrada
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    // Animar salida
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

export const toastError = (m) => toast(m, "error");
export const toastOk    = (m) => toast(m, "ok");
export const toastInfo  = (m) => toast(m, "info");
export const toastWarning = (m) => toast(m, "warning");
