let tracker, database;
const unsecuredModels = ['event', 'run', 'incentive', 'prize', 'donation', 'runner', 'donation'];
const modelsToSort = ['run', 'incentive', 'donation', 'event'];

module.exports = (_tracker, _database) => {
    tracker = _tracker;
    database = _database;
};

module.exports.parseMessage = (msg, client) => {
    let req;
    try {
        req = JSON.parse(msg.toString());
    } catch {
        return tracker.sendWsMessage({ type: 'jsonParseError', code: 404, data: { error: 'Invalid JSON' } }, client)
    }
    switch (req.type) {
        case 'databaseData':
            if (req.data.model === 'blurb') req.data.model = 'ad';
            switch (req.data.method) {
                case 'GET': GET(req.data, client); break;
                case 'POST': POST(req.data, client); break;
                case 'DELETE': DELETE(req.data, client); break;
            }
            break;
        case 'statsData': stats(req.data, client); break;
        case 'paginateData': paginate(req.data, client); break;
    }
}

// GET Request
async function GET(req, client) {
    if (!client.secure && !unsecuredModels.includes(req.model)) return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 401, data: { error: 'Unauthorized' } }, client)
    let populate = req.populate;
    delete req.populate;
    for (const prop in req.populate) {
        if (req.query[prop] === 'true') req.query[prop] = true;
        else if (req.query[prop] === 'false') req.query[prop] = false;
    }
    if (typeof populate === 'string') populate = populate.split(',');
    try {
        let data;
        if (!req.query) data = await database.findAll(req.model, populate);
        else data = await database.find(req.model, req.query, populate);
        if (data.length > 1 && modelsToSort.includes(req.model)) data = await sortData(req.model, data);
        return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 200, data: data }, client)
    } catch (err) {
        return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 500, data: err }, client)
    }
}

// POST Request
async function POST(req, client) {
    if (!client.secure) return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 401, data: { error: 'Unauthorized' } }, client)
    let status, data;
    if (Object.keys(req.query).length === 0) [status, data] = await database.create(req.model, req.body);
    else[status, data] = await database.update(req.model, req.query, req.body)
    if (status) {
        let errorList = [];
        if (data.errors) {
            for (const error in data.errors) {
                if (data.errors[error].message.includes('Cast to')) data.errors[error].message = `${req.model.charAt(0).toUpperCase() + req.model.slice(1)} is invalid.`
                errorList.push({ item: error, code: data.errors[error].message.charAt(0).toUpperCase() + data.errors[error].message.slice(1) })
            }
        }
        return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 409, data: { error: 'Invalid input.', errorCodes: errorList } }, client)
    }
    return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 200, data: data }, client)
}

// DELETE Request
async function DELETE(req, client) {
    if (!client.secure) return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 401, data: { error: 'Unauthorized' } }, client)
    if (!req.query || !req.query._id) return res.status(400).send({ error: "One or multiple id's must be specified." })
    try {
        if (typeof req.query._id === 'string') await database.deleteOne(req.model, req.query._id);
        else await database.deleteMany(req.model, req.query._id);
        return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 200, data: {} }, client)
    } catch (err) {
        return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 500, data: err }, client)
    }
}

// Get stats.
async function stats(req, client) {
    if (!client.secure && !unsecuredModels.includes(req.model)) return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 401, data: { error: 'Unauthorized' } }, client)
    let populate = req.populate;
    delete req.populate;
    for (const prop in req.query) {
        if (req.query[prop] === 'true') req.query[prop] = true;
        else if (req.query[prop] === 'false') req.query[prop] = false;
    }
    if (typeof populate === 'string') populate = populate.split(',');
    console.log(req.query)
    try {
        let data = await database.find(req.model, req.query, populate);
        if (data.length > 1 && modelsToSort.includes(req.model)) data = await sortData(req.model, data);
        for (let i = 0; i < data.length; i++) {
            data[i].stats = await database.getStats(req.model, data[i]);
        }
        return tracker.sendWsMessage({ type: 'statsReturn', code: 200, data: data }, client)
    } catch (err) {
        return tracker.sendWsMessage({ type: 'statsReturn', code: 500, data: err }, client)
    }
}

// Pagination.
async function paginate(req, client) {
    if (!client.secure && !unsecuredModels.includes(req.model)) return tracker.sendWsMessage({ type: 'databaseDataReturn', code: 401, data: { error: 'Unauthorized' } }, client)
    let populate = req.populate;
    let pagination = { limit: (req.paginate.limit) ? parseInt(req.paginate.limit) : 49, page: (req.paginate.page) ? parseInt(req.paginate.page - 1) : 0 };
    delete req.paginate.limit;
    delete req.paginate.page;
    delete req.populate;
    for (const prop in req.query) {
        if (req.query[prop] === 'true') req.query[prop] = true;
        else if (req.query[prop] === 'false') req.query[prop] = false;
    }
    if (typeof populate === 'string') populate = populate.split(',');
    try {
        let data = await database.find(req.model, req.query, populate);
        if (data.length > 1 && modelsToSort.includes(req.model)) data = await sortData(req.model, data);
        let totalPages = Math.floor(data.length / pagination.limit) + 1;
        if (pagination.page > totalPages) pagination.page = totalPages;
        let paginatedData = data.slice((pagination.limit * pagination.page), (pagination.limit * pagination.page) + pagination.limit);
        let response = {
            total: data.length,
            count: paginatedData.length,
            indexStart: pagination.limit * pagination.page,
            indexEnd: ((pagination.limit * pagination.page) + pagination.limit > data.length) ? data.length : (pagination.limit * pagination.page) + pagination.limit,
            page: pagination.page,
            totalPages: totalPages,
            data: paginatedData,
        }
        return tracker.sendWsMessage({ type: 'paginateReturn', code: 200, data: response }, client)
    } catch (err) {
        return tracker.sendWsMessage({ type: 'paginateReturn', code: 500, data: err }, client)
    }
}

// Sort data.
async function sortData(model, data) {
    return new Promise(async (resolve, reject) => {
        let sortedData;
        switch (true) {
            case (model === 'run' || model === 'event' || model === 'incentive'): sortedData = await data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); break;
            case (model === 'donation'): sortedData = await data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); break;
        }
        resolve(sortedData)
    })
}