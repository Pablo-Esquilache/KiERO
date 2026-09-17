// En entorno nube (Supabase), los backups se hacen solos.
export const getBackupDirectory = () => {
    return "/tmp/backups";
};

export const createBackup = (req, res, callback) => {
    console.log("Backup solicitado (ignorado en la nube porque Supabase lo hace solo)");
    if (res) {
        return res.json({ ok: true, message: "Los backups están a cargo de la nube automáticamente." });
    }
    if (callback) {
        return callback(null, "/tmp/backups/virtual");
    }
};
