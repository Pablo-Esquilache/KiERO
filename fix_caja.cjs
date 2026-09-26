const fs = require('fs');
let c = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

if (!c.includes('import { DateTime } from "luxon";')) {
    c = c.replace('import pool from "../db.js";', 'import pool from "../db.js";\nimport { DateTime } from "luxon";');
}

c = c.replace(/const hoy = new Date\(\);\s*hoy\.setHours\(0,0,0,0\);\s*startTime = hoy\.toISOString\(\);/, 'startTime = DateTime.now().setZone("America/Argentina/Buenos_Aires").startOf("day").toUTC().toISO();');

fs.writeFileSync('backend/controllers/cajasController.js', c);
