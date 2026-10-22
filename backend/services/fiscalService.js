import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Arca } from "@arcasdk/core";
import pool, { userDataPath } from "../db.js";

// ============================================================
// VALIDACIÓN OFICIAL CUIT - MÓDULO 11 (100% OFFLINE)
// ============================================================
export function validarCuit(cuitRaw) {
  if (!cuitRaw) {
    return { valid: false, error: "CUIT vacío" };
  }

  const clean = String(cuitRaw).replace(/\D/g, "");
  if (clean.length !== 11) {
    return { valid: false, error: "El CUIT debe contener exactamente 11 dígitos numéricos." };
  }

  const prefijo = clean.slice(0, 2);
  const prefijosValidos = ["20", "23", "24", "27", "30", "33", "34"];
  if (!prefijosValidos.includes(prefijo)) {
    return { valid: false, error: `Prefijo '${prefijo}' no es válido para CUIT argentino.` };
  }

  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += parseInt(clean[i], 10) * multiplicadores[i];
  }

  const mod = 11 - (suma % 11);
  let digitoVerificadorEsperado = mod;
  if (mod === 11) digitoVerificadorEsperado = 0;
  else if (mod === 10) digitoVerificadorEsperado = 9;

  const digitoVerificadorReal = parseInt(clean[10], 10);
  if (digitoVerificadorReal !== digitoVerificadorEsperado) {
    return {
      valid: false,
      error: `Dígito verificador inválido (se esperaba ${digitoVerificadorEsperado}, se recibió ${digitoVerificadorReal}).`
    };
  }

  return {
    valid: true,
    cuit: clean,
    formatted: `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
  };
}

// ============================================================
// GESTIÓN DE CARPETAS Y CERTIFICADOS LOCALES (userData/fiscal)
// ============================================================
export function getFiscalDir() {
  const fiscalDir = path.join(userDataPath, "fiscal");
  const ticketsDir = path.join(fiscalDir, "tickets");

  if (!fs.existsSync(fiscalDir)) {
    fs.mkdirSync(fiscalDir, { recursive: true });
  }
  if (!fs.existsSync(ticketsDir)) {
    fs.mkdirSync(ticketsDir, { recursive: true });
  }

  return { fiscalDir, ticketsDir };
}

export function getCertPath(comercioId) {
  const { fiscalDir } = getFiscalDir();
  return path.join(fiscalDir, `cert_${comercioId}.crt`);
}

export function getKeyPath(comercioId) {
  const { fiscalDir } = getFiscalDir();
  return path.join(fiscalDir, `key_${comercioId}.key`);
}

export function checkCertificates(comercioId) {
  const certPath = getCertPath(comercioId);
  const keyPath = getKeyPath(comercioId);

  const hasCert = fs.existsSync(certPath);
  const hasKey = fs.existsSync(keyPath);

  let vencimiento = null;
  let expirado = false;

  if (hasCert) {
    try {
      const certContent = fs.readFileSync(certPath, "utf8");
      const x509 = new crypto.X509Certificate(certContent);
      vencimiento = x509.validTo;
      if (new Date(vencimiento) < new Date()) {
        expirado = true;
      }
    } catch (e) {
      console.warn(`[FISCAL] Error leyendo vencimiento de certificado para comercio ${comercioId}:`, e.message);
    }
  }

  return { hasCert, hasKey, certPath, keyPath, vencimiento, expirado };
}

export function saveCertificates(comercioId, certText, keyText) {
  const { fiscalDir } = getFiscalDir();
  let vencimiento = null;

  if (certText && certText.trim()) {
    try {
      const cleanCert = certText.trim();
      const x509 = new crypto.X509Certificate(cleanCert);
      vencimiento = x509.validTo;
      const certPath = getCertPath(comercioId);
      fs.writeFileSync(certPath, cleanCert, "utf8");
    } catch (err) {
      throw new Error("El archivo de certificado (.crt) no tiene un formato X.509 válido: " + err.message);
    }
  }

  if (keyText && keyText.trim()) {
    const cleanKey = keyText.trim();
    if (!cleanKey.includes("PRIVATE KEY")) {
      throw new Error("El archivo de clave privada (.key) no contiene un encabezado válido de clave privada.");
    }
    const keyPath = getKeyPath(comercioId);
    fs.writeFileSync(keyPath, cleanKey, "utf8");
  }

  return {
    certPath: getCertPath(comercioId),
    keyPath: getKeyPath(comercioId),
    vencimiento
  };
}

// ============================================================
// INSTANCIACIÓN DE ARCA SDK DIRECTO (SIN DEPENDENCIAS SAAS)
// ============================================================
export async function getArcaClient(comercioId) {
  const { rows } = await pool.query(
    `SELECT * FROM configuracion_fiscal WHERE comercio_id = $1`,
    [comercioId]
  );

  if (rows.length === 0 || !rows[0].cuit) {
    return null;
  }

  const config = rows[0];
  const certStatus = checkCertificates(comercioId);

  if (!certStatus.hasCert || !certStatus.hasKey) {
    return null;
  }

  const certContent = fs.readFileSync(certStatus.certPath, "utf8");
  const keyContent = fs.readFileSync(certStatus.keyPath, "utf8");
  const { ticketsDir } = getFiscalDir();

  const isProduction = config.ambiente === "produccion";
  const cuitNum = parseInt(config.cuit.replace(/\D/g, ""), 10);

  const arca = new Arca({
    cuit: cuitNum,
    cert: certContent,
    key: keyContent,
    production: isProduction,
    ticketPath: ticketsDir
  });

  return { arca, config, certStatus };
}

// ============================================================
// CONSULTA AL PADRÓN AFIP/ARCA (CON TIMEOUT DE SEGURIDAD 8s)
// ============================================================
export async function consultarPadron(comercioId, cuitAConsultar) {
  // 1. Validación offline obligatoria de Módulo 11
  const validacion = validarCuit(cuitAConsultar);
  if (!validacion.valid) {
    return {
      ok: false,
      error: validacion.error
    };
  }

  // 2. Verificar si el comercio emisor tiene credenciales fiscales cargadas
  let arcaClientInfo = null;
  try {
    arcaClientInfo = await getArcaClient(comercioId);
  } catch (err) {
    return {
      ok: false,
      configured: false,
      message: `Error al inicializar certificados fiscales: ${err.message}. Puede completar los datos manualmente.`
    };
  }

  if (!arcaClientInfo) {
    return {
      ok: false,
      configured: false,
      message: "No hay certificados de AFIP/ARCA configurados en Ajustes > Configuración Fiscal. Puede ingresar los datos del cliente manualmente."
    };
  }

  if (arcaClientInfo.certStatus.expirado) {
    return {
      ok: false,
      configured: true,
      message: "El certificado digital de AFIP configurado se encuentra vencido. Puede ingresar los datos manualmente o renovar el certificado."
    };
  }

  const { arca } = arcaClientInfo;
  const cuitNum = parseInt(validacion.cuit, 10);

  // 3. Consulta con timeout de seguridad de 8 segundos (evita congelamiento si la red de AFIP no responde)
  try {
    const consultaPromise = (async () => {
      // Intentar primero con Padrón Alcance 5 (datos completos de contribuyentes)
      try {
        const detailsA5 = await arca.registerScopeFiveService.getTaxpayerDetails(cuitNum);
        if (detailsA5) return { source: "A5", data: detailsA5 };
      } catch (e5) {
        console.warn("[PADRÓN] Falló Scope 5, probando Scope 4 / 13...", e5.message);
      }

      // Fallback a Scope 4
      try {
        const detailsA4 = await arca.registerScopeFourService.getTaxpayerDetails(cuitNum);
        if (detailsA4) return { source: "A4", data: detailsA4 };
      } catch (e4) {
        console.warn("[PADRÓN] Falló Scope 4, probando Scope 13...", e4.message);
      }

      // Fallback a Scope 13 (Constancia de Inscripción)
      try {
        const detailsA13 = await arca.registerScopeThirteenService.getTaxpayerDetails(cuitNum);
        if (detailsA13) return { source: "A13", data: detailsA13 };
      } catch (e13) {
        console.warn("[PADRÓN] Falló Scope 13:", e13.message);
      }

      return null;
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado al consultar los servidores de AFIP/ARCA (8s).")), 8000)
    );

    const resultado = await Promise.race([consultaPromise, timeoutPromise]);

    if (!resultado || !resultado.data) {
      return {
        ok: false,
        message: "AFIP no devolvió datos para el CUIT consultado. Puede completar los datos manualmente."
      };
    }

    const d = resultado.data;
    const datosGenerales = d.datosGenerales || {};

    // Determinar Razón Social o Nombre
    let razonSocial = datosGenerales.razonSocial || "";
    if (!razonSocial && (datosGenerales.apellido || datosGenerales.nombre)) {
      razonSocial = [datosGenerales.apellido, datosGenerales.nombre].filter(Boolean).join(" ");
    }

    // Determinar Condición frente al IVA
    let condicionIva = "Consumidor Final";
    if (d.datosMonotributo) {
      condicionIva = "Monotributo";
    } else if (d.datosRegimenGeneral) {
      // Verificar impuestos activos
      const impuestos = d.datosRegimenGeneral.impuesto || [];
      const listaImpuestos = Array.isArray(impuestos) ? impuestos : [impuestos];
      const tieneIva = listaImpuestos.some((imp) => Number(imp.idImpuesto || imp) === 30);
      const tieneExento = listaImpuestos.some((imp) => Number(imp.idImpuesto || imp) === 32);

      if (tieneIva) {
        condicionIva = "Responsable Inscripto";
      } else if (tieneExento) {
        condicionIva = "Exento";
      } else {
        condicionIva = "Responsable Inscripto";
      }
    }

    // Determinar Domicilio Fiscal y Localidad
    let domicilioFiscal = "";
    let localidad = "";
    const dom = datosGenerales.domicilioFiscal;
    if (dom) {
      domicilioFiscal = dom.direccion || "";
      localidad = dom.localidad || dom.descripcionProvincia || "";
    }

    return {
      ok: true,
      datos: {
        cuit: validacion.formatted,
        cuit_raw: validacion.cuit,
        razon_social: razonSocial.trim(),
        condicion_iva: condicionIva,
        domicilio_fiscal: domicilioFiscal.trim(),
        localidad: localidad.trim()
      }
    };
  } catch (error) {
    console.error("[PADRÓN] Error en consulta AFIP/ARCA:", error);
    return {
      ok: false,
      message: `No se pudo conectar con AFIP/ARCA (${error.message}). Puede ingresar los datos manualmente.`
    };
  }
}

// ============================================================
// VERIFICAR ESTADO Y CONEXIÓN CON SERVIDORES AFIP/ARCA
// ============================================================
export async function verificarEstadoAfip(comercioId) {
  try {
    const arcaInfo = await getArcaClient(comercioId);
    if (!arcaInfo) {
      return {
        ok: false,
        message: "No hay certificados cargados para este comercio."
      };
    }

    const { arca, config, certStatus } = arcaInfo;

    // Consultar estado de servidor WSFE
    const serverStatus = await arca.electronicBillingService.getServerStatus();

    return {
      ok: true,
      ambiente: config.ambiente,
      cuit: config.cuit,
      punto_venta: config.punto_venta,
      vencimiento: certStatus.vencimiento,
      servidores: serverStatus
    };
  } catch (error) {
    return {
      ok: false,
      message: `Error al probar conexión con AFIP: ${error.message}`
    };
  }
}
