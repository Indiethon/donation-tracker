let tracker, database;

module.exports.load = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
}

module.exports.fetchAuditLog = (req, res) => {
    database.models['auditLog'].find({}).exec((err, data) => {
        if (err) return res.status(500).send({ error: 'Error retriving audit log data.' })
        return res.status(200).send(data)
    })
}

module.exports.deleteAuditLog = (req, res) => {
    database.models['auditLog'].deleteMany({}, (err) => {
        if (err) return res.status(500).send({ error: 'Could not delete audit log.' })
        return res.status(200).send({});
    });
}