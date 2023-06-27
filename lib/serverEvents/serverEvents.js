let tracker;
let detabase;
let clients = [];

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.currentRunEvent = (req, res) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    res.write('data: {}\n\n');

    const clientId = Date.now();

    const newClient = {
        id: clientId,
        res
    };

    clients.push(newClient);

    request.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
}

module.exports.sendRunEvent = (data) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`))
  }