import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Arca } from "@arcasdk/core";
import pool, { userDataPath } from "../db.js";

// ============================================================
// MUTEX SERIALIZADOR DE EMISIONES AFIP POR COMERCIO
// ============================================================
const fiscalLocks = new Map();

export async function withFiscalLock(comercioId, fn) {
  const current = fiscalLocks.get(comercioId) || Promise.resolve();
  let release;
  const p = new Promise(resolve => { release = resolve; });
  fiscalLocks.set(comercioId, current.then(() => p));
  await current;
  try {
    return await fn();
  } finally {
    release();
    if (fiscalLocks.get(comercioId) === current) {
      fiscalLocks.delete(comercioId);
    }
  }
}

// ============================================================
// FECHA EN ZONA HORARIA DE ARGENTINA (AMERICA/ARGENTINA/BUENOS_AIRES)
// ============================================================
export function getFechaArgentina() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const iso = formatter.format(new Date()); // YYYY-MM-DD
  const afip = iso.replace(/-/g, "");       // YYYYMMDD
  return { iso, afip };
}

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
  let vencimiento = null;
  let cleanCert = null;
  let cleanKey = null;

  if (certText && certText.trim()) {
    cleanCert = certText.trim();
    try {
      const x509 = new crypto.X509Certificate(cleanCert);
      vencimiento = x509.validTo;
    } catch (err) {
      throw new Error("El archivo de certificado (.crt) no tiene un formato X.509 válido: " + err.message);
    }
  }

  if (keyText && keyText.trim()) {
    cleanKey = keyText.trim();
    if (!cleanKey.includes("PRIVATE KEY")) {
      throw new Error("El archivo de clave privada (.key) no contiene un encabezado válido de clave privada.");
    }
    const certToCheck = cleanCert || (fs.existsSync(getCertPath(comercioId)) ? fs.readFileSync(getCertPath(comercioId), "utf8") : null);
    if (certToCheck) {
      try {
        const x509 = new crypto.X509Certificate(certToCheck);
        const privateKey = crypto.createPrivateKey(cleanKey);
        if (typeof x509.checkPrivateKey === "function") {
          const match = x509.checkPrivateKey(privateKey);
          if (!match) {
            throw new Error("La clave privada (.key) no corresponde al certificado digital (.crt) cargado.");
          }
        }
      } catch (keyErr) {
        throw new Error("Validación de clave privada fallida: " + keyErr.message);
      }
    }
  }

  if (cleanCert) {
    fs.writeFileSync(getCertPath(comercioId), cleanCert, "utf8");
  }
  if (cleanKey) {
    fs.writeFileSync(getKeyPath(comercioId), cleanKey, "utf8");
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
      // 1) Intentar prioritariamente con Constancia de Inscripción (ws_sr_constancia_inscripcion)
      // Es el servicio oficial autorizado para consultar datos de padrón e IVA en Homologación y Producción
      if (arca.registerInscriptionProofService) {
        try {
          const detailsProof = await arca.registerInscriptionProofService.getTaxpayerDetails(cuitNum);
          if (detailsProof) return { source: "PROOF", data: detailsProof };
        } catch (eProof) {
          console.warn("[PADRÓN] Constancia de Inscripción no respondió o falló:", eProof.message);
        }
      }

      // 2) Fallback a Padrón Alcance 5 (datos completos de contribuyentes)
      if (arca.registerScopeFiveService) {
        try {
          const detailsA5 = await arca.registerScopeFiveService.getTaxpayerDetails(cuitNum);
          if (detailsA5) return { source: "A5", data: detailsA5 };
        } catch (e5) {
          console.warn("[PADRÓN] Falló Scope 5:", e5.message);
        }
      }

      // 3) Fallback a Scope 4
      if (arca.registerScopeFourService) {
        try {
          const detailsA4 = await arca.registerScopeFourService.getTaxpayerDetails(cuitNum);
          if (detailsA4) return { source: "A4", data: detailsA4 };
        } catch (e4) {
          console.warn("[PADRÓN] Falló Scope 4:", e4.message);
        }
      }

      // 4) Fallback a Scope 13
      if (arca.registerScopeThirteenService) {
        try {
          const detailsA13 = await arca.registerScopeThirteenService.getTaxpayerDetails(cuitNum);
          if (detailsA13) return { source: "A13", data: detailsA13 };
        } catch (e13) {
          console.warn("[PADRÓN] Falló Scope 13:", e13.message);
        }
      }

      return null;
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado al consultar los servidores de AFIP/ARCA (12s).")), 12000)
    );

    const resultado = await Promise.race([consultaPromise, timeoutPromise]);

    if (!resultado || !resultado.data) {
      return {
        ok: false,
        message: "El CUIT no se encuentra en la base de datos de AFIP (o en el entorno de pruebas Homologación). Puede completar los datos del cliente manualmente."
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


// ============================================================
// GENERACIÓN DE CÓDIGO QR OFICIAL AFIP (RG 4291 / RG 4892)
// ============================================================
export async function generarQrAfip({
  fecha,
  cuit,
  ptoVta,
  tipoCmp,
  nroCmp,
  importe,
  tipoDocRec,
  nroDocRec,
  codAut
}) {
  let fStr = String(fecha || "").trim();
  let fechaQr = fStr;
  if (fStr.length === 8 && !fStr.includes("-")) {
    fechaQr = `${fStr.slice(0, 4)}-${fStr.slice(4, 6)}-${fStr.slice(6, 8)}`;
  } else if (fStr.includes("T")) {
    fechaQr = fStr.slice(0, 10);
  }

  const qrObj = {
    ver: 1,
    fecha: fechaQr,
    cuit: parseInt(String(cuit).replace(/\D/g, ""), 10),
    ptoVta: parseInt(ptoVta, 10),
    tipoCmp: parseInt(tipoCmp, 10),
    nroCmp: parseInt(nroCmp, 10),
    importe: parseFloat(Number(importe).toFixed(2)),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: parseInt(tipoDocRec, 10) || 99,
    nroDocRec: parseInt(String(nroDocRec || 0).replace(/\D/g, ""), 10) || 0,
    tipoCodAut: "E",
    codAut: parseInt(String(codAut).replace(/\D/g, ""), 10)
  };

  const jsonStr = JSON.stringify(qrObj);
  const base64 = Buffer.from(jsonStr, "utf8").toString("base64");
  const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64}`;

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 140 });
  } catch (err) {
    console.warn("[FISCAL] No se pudo generar imagen QR offline:", err.message);
  }

  return { qrUrl, qrDataUrl, qrObj };
}

// ============================================================
// DETERMINAR TIPO DE COMPROBANTE SEGÚN EMISOR Y RECEPTOR
// ============================================================
export function determinarTipoComprobante(condicionEmisor, condicionReceptor) {
  const emisorNorm = String(condicionEmisor || "").toLowerCase();
  const receptorNorm = String(condicionReceptor || "").toLowerCase();

  // Monotributistas y Exentos siempre emiten Factura C
  if (emisorNorm.includes("monotribut") || emisorNorm.includes("exento")) {
    return { tipo: 11, nombre: "Factura C", letra: "C" };
  }

  // Responsable Inscripto:
  if (emisorNorm.includes("inscripto")) {
    if (receptorNorm.includes("inscripto")) {
      return { tipo: 1, nombre: "Factura A", letra: "A" };
    }
    // Consumidor final, Monotributista, Exento -> Factura B
    return { tipo: 6, nombre: "Factura B", letra: "B" };
  }

  return { tipo: 11, nombre: "Factura C", letra: "C" };
}

// ============================================================
// EMISIÓN OFICIAL DE FACTURA ELECTRÓNICA CON CAE EN AFIP/ARCA
// ============================================================
export async function emitirComprobanteAfip({
  comercioId,
  clienteId,
  items,
  descuentoPorcentaje = 0,
  totalVenta
}) {
  const arcaInfo = await getArcaClient(comercioId);
  if (!arcaInfo) {
    throw new Error(
      "No hay configuración fiscal o certificados cargados para este comercio. Puede emitir un Ticket común."
    );
  }

  const { arca, config, certStatus } = arcaInfo;

  if (certStatus.expirado) {
    throw new Error(
      "El certificado digital de AFIP se encuentra vencido. Renueve el certificado en Ajustes para poder facturar."
    );
  }

  // Obtener cliente si existe
  let cliente = null;
  if (clienteId) {
    const { rows: cliRows } = await pool.query(
      "SELECT * FROM clientes WHERE id = $1 AND comercio_id = $2",
      [clienteId, comercioId]
    );
    if (cliRows.length > 0) {
      cliente = cliRows[0];
    }
  }

  const condicionReceptor = cliente?.condicion_iva || "Consumidor Final";
  const voucherInfo = determinarTipoComprobante(config.condicion_iva, condicionReceptor);
  const cbteTipo = voucherInfo.tipo;

  // Determinar documento del receptor (CUIT 80, DNI 96, o Consumidor Final 99)
  let docTipo = 99;
  let docNro = 0;

  if (cliente?.cuit || cliente?.documento) {
    const rawDoc = String(cliente.cuit || cliente.documento).replace(/\D/g, "");
    if (rawDoc.length === 11) {
      docTipo = 80; // CUIT
      docNro = parseInt(rawDoc, 10);
    } else if (rawDoc.length >= 7 && rawDoc.length <= 8) {
      docTipo = 96; // DNI
      docNro = parseInt(rawDoc, 10);
    }
  }

  // Mapeo oficial ARCA CondicionIVAReceptorId:
  // 1: Responsable Inscripto, 4: Exento, 5: Consumidor Final, 6: Monotributo
  let condicionIvaReceptorId = 5;
  const condNorm = condicionReceptor.toLowerCase();
  if (condNorm.includes("inscripto")) condicionIvaReceptorId = 1;
  else if (condNorm.includes("exento")) condicionIvaReceptorId = 4;
  else if (condNorm.includes("monotribut")) condicionIvaReceptorId = 6;
  else condicionIvaReceptorId = 5;

  // Validación regulatoria Factura A
  if (cbteTipo === 1 && docTipo !== 80) {
    throw new Error("Para emitir Factura A es obligatorio que el cliente tenga un CUIT válido asignado.");
  }

  // Validación de tope consumidor final sin identificar (RG 5700/2025 y RG 5866/2026: $10.000.000)
  const totalNum = parseFloat(Number(totalVenta).toFixed(2));
  const topeCf = Number(config.tope_consumidor_final) || 10000000;
  if (docTipo === 99 && totalNum >= topeCf) {
    throw new Error(`Para ventas iguales o superiores a ${topeCf.toLocaleString("es-AR")} la resolución de AFIP exige identificar al cliente con CUIT o DNI.`);
  }

  const fechaArg = getFechaArgentina();
  const cbteFch = fechaArg.afip; // YYYYMMDD para AFIP
  const qrFecha = fechaArg.iso;  // YYYY-MM-DD para RG 4291
  const ptoVta = parseInt(config.punto_venta, 10) || 1;

  // Matemática de importes en centavos enteros
  let ImpTotal = totalNum;
  let ImpNeto = totalNum;
  let ImpIVA = 0;
  let IvaList = [];

  if (cbteTipo === 1 || cbteTipo === 6) {
    // Responsable Inscripto discrimina IVA
    const descFactor = 1 - (Number(descuentoPorcentaje) || 0) / 100;
    const gruposIva = {};

    for (const it of items) {
      const itTotal = Math.round(Number(it.precio_unitario) * Number(it.cantidad) * descFactor * 100) / 100;
      const rawAli = (it.alicuota_iva !== undefined && it.alicuota_iva !== null) ? Number(it.alicuota_iva) : 21.0;
      const ali = isNaN(rawAli) ? 21.0 : rawAli;
      let aliId = 5; // 21%
      if (ali === 0) aliId = 3;         // 0% Exento
      else if (ali === 10.5) aliId = 4; // 10.5%
      else if (ali === 27) aliId = 6;   // 27%
      else if (ali === 5) aliId = 8;    // 5%
      else if (ali === 2.5) aliId = 9;  // 2.5%

      const tasa = ali / 100;
      const base = Math.round((itTotal / (1 + tasa)) * 100) / 100;
      const iva = Math.round((itTotal - base) * 100) / 100;

      if (!gruposIva[aliId]) {
        gruposIva[aliId] = { Id: aliId, BaseImp: 0, Importe: 0 };
      }
      gruposIva[aliId].BaseImp += base;
      gruposIva[aliId].Importe += iva;
    }

    let netoAcumulado = 0;
    let ivaAcumulado = 0;
    for (const k of Object.keys(gruposIva)) {
      gruposIva[k].BaseImp = Math.round(gruposIva[k].BaseImp * 100) / 100;
      gruposIva[k].Importe = Math.round(gruposIva[k].Importe * 100) / 100;
      netoAcumulado += gruposIva[k].BaseImp;
      ivaAcumulado += gruposIva[k].Importe;
      IvaList.push(gruposIva[k]);
    }

    // Ajuste fino de redondeo al centavo
    const diff = Math.round((ImpTotal - (netoAcumulado + ivaAcumulado)) * 100) / 100;
    if (diff !== 0 && IvaList.length > 0) {
      IvaList[0].BaseImp = Math.round((IvaList[0].BaseImp + diff) * 100) / 100;
      netoAcumulado = Math.round((netoAcumulado + diff) * 100) / 100;
    }

    ImpNeto = Math.round(netoAcumulado * 100) / 100;
    ImpIVA = Math.round(ivaAcumulado * 100) / 100;
  }

  const nextVoucherPayload = {
    CantReg: 1,
    PtoVta: ptoVta,
    CbteTipo: cbteTipo,
    Concepto: 1, // Productos
    DocTipo: docTipo,
    DocNro: docNro,
    CondicionIVAReceptorId: condicionIvaReceptorId,
    CbteFch: cbteFch,
    ImpTotal: ImpTotal,
    ImpTotConc: 0,
    ImpNeto: ImpNeto,
    ImpOpEx: 0,
    ImpIVA: ImpIVA,
    ImpTrib: 0,
    MonId: "PES",
    MonCotiz: 1,
    ...(IvaList.length > 0 ? { Iva: IvaList } : {})
  };

  // Timeout de 15 segundos con recuperación activa
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TimeoutAFIP")), 15000)
  );

  let voucherResult = null;
  try {
    voucherResult = await Promise.race([
      arca.electronicBillingService.createNextVoucher(nextVoucherPayload),
      timeoutPromise
    ]);
  } catch (err) {
    if (err.message === "TimeoutAFIP") {
      console.warn("[FISCAL] Timeout creando comprobante. Verificando estado en AFIP...");
      try {
        const lastVoucher = await arca.electronicBillingService.getLastVoucher(ptoVta, cbteTipo);
        if (lastVoucher && lastVoucher.cbteNro) {
          const { rows: maxRows } = await pool.query(
            `SELECT MAX(numero_comprobante) as max_nro FROM ventas 
             WHERE comercio_id = $1 AND punto_venta = $2 AND tipo_comprobante = $3 AND cae IS NOT NULL`,
            [comercioId, ptoVta, voucherInfo.nombre]
          );
          const maxLocal = Number(maxRows[0]?.max_nro) || 0;

          if (Number(lastVoucher.cbteNro) > maxLocal) {
            const voucherInfoRecover = await arca.electronicBillingService.getVoucherInfo(
              lastVoucher.cbteNro,
              ptoVta,
              cbteTipo
            );
            if (
              voucherInfoRecover &&
              voucherInfoRecover.codAutorizacion &&
              Math.abs(voucherInfoRecover.impTotal - ImpTotal) < 0.01 &&
              String(voucherInfoRecover.cbteFch) === String(cbteFch) &&
              Number(voucherInfoRecover.docNro) === Number(docNro)
            ) {
              const nroCmp = lastVoucher.cbteNro;
              const caeRec = voucherInfoRecover.codAutorizacion;
              const vtoCaeRec = voucherInfoRecover.fchVto;
              const { qrUrl, qrDataUrl } = await generarQrAfip({
                fecha: qrFecha,
                cuit: config.cuit,
                ptoVta,
                tipoCmp: cbteTipo,
                nroCmp,
                importe: ImpTotal,
                tipoDocRec: docTipo,
                nroDocRec: docNro,
                codAut: caeRec
              });

              return {
                ok: true,
                ambiente: config.ambiente,
                resultado: "A",
                tipo_comprobante: voucherInfo.nombre,
                letra: voucherInfo.letra,
                punto_venta: ptoVta,
                numero_comprobante: nroCmp,
                cae: caeRec,
                vto_cae: vtoCaeRec,
                codigo_qr_afip: qrUrl,
                qr_data_url: qrDataUrl,
                observaciones: "Recuperado tras reintento de conexión."
              };
            }
          }
        }
      } catch (recoverErr) {
        console.error("[FISCAL] Error al recuperar comprobante tras timeout:", recoverErr);
      }

      return {
        ok: false,
        indeterminate: true,
        resultado: "INDETERMINADO",
        error: "AFIP no respondió a tiempo (15s). Se guardará el comprobante en estado 'Indeterminado' para conciliar."
      };
    }
    throw err;
  }

  // Procesar respuesta de AFIP
  const resp = voucherResult.response || {};
  const detResp = resp.FeDetResp?.FECAEDetResponse?.[0] || {};
  const resultadoAfip = detResp.Resultado || (voucherResult.cae ? "A" : "R");

  if (resultadoAfip === "A") {
    const cae = voucherResult.cae || detResp.CAE;
    const vtoCae = voucherResult.caeFchVto || detResp.CAEFchVto;
    const nroCmp = detResp.CbteDesde || 0;

    let obsTexto = "";
    if (detResp.Observaciones?.Obs) {
      const obsArr = Array.isArray(detResp.Observaciones.Obs) ? detResp.Observaciones.Obs : [detResp.Observaciones.Obs];
      obsTexto = obsArr.map(o => `${o.Code || o.Codigo}: ${o.Msg || o.Mensaje}`).join("; ");
    }

    const { qrUrl, qrDataUrl } = await generarQrAfip({
      fecha: qrFecha,
      cuit: config.cuit,
      ptoVta,
      tipoCmp: cbteTipo,
      nroCmp,
      importe: ImpTotal,
      tipoDocRec: docTipo,
      nroDocRec: docNro,
      codAut: cae
    });

    return {
      ok: true,
      ambiente: config.ambiente,
      resultado: "A",
      tipo_comprobante: voucherInfo.nombre,
      letra: voucherInfo.letra,
      punto_venta: ptoVta,
      numero_comprobante: nroCmp,
      cae,
      vto_cae: vtoCae,
      codigo_qr_afip: qrUrl,
      qr_data_url: qrDataUrl,
      observaciones: obsTexto
    };
  } else {
    let motivo = "Rechazado por AFIP";
    if (detResp.Observaciones?.Obs) {
      const obsArr = Array.isArray(detResp.Observaciones.Obs) ? detResp.Observaciones.Obs : [detResp.Observaciones.Obs];
      motivo = obsArr.map(o => `${o.Code || o.Codigo}: ${o.Msg || o.Mensaje}`).join("; ");
    } else if (resp.Errors?.Err) {
      const errArr = Array.isArray(resp.Errors.Err) ? resp.Errors.Err : [resp.Errors.Err];
      motivo = errArr.map(e => `${e.Code || e.Codigo}: ${e.Msg || e.Mensaje}`).join("; ");
    }

    return {
      ok: false,
      resultado: "R",
      error: motivo,
      observaciones: motivo
    };
  }
}
