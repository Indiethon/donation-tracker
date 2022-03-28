const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

//console.log(apiKeys[0]);

module.exports = (tracker, database) => {

    // Replicants
    //const currentUsers = tracker.Replicant('currentUsers');

    // Unsecured API routes.
    tracker.server.get('/api/donation/create', (req, res) => createDonationID(req, res))
    tracker.server.post('/api/donation/ipn', (req, res) => tracker.modules.donation.verifyIPN(req, res))
    tracker.server.post('/api/login', (req, res) => login(req, res));

    // Authentication middleware.
    // app.use((req, res, next) => {
    //     if (unsecurePath.includes(req.path)) { next(); return; }
    //     if (!req.headers.authorization) return res.status(401).send({ error: 'No token provided.' })
    //     var username = jwt.verify(req.headers.authorization.split(' ')[1], tracker.config.tracker.passwordHash, (error, data) => {
    //         if (error) { res.status(403).send({ error: 'Invalid token.' }); return; }
    //         if (currentUsers.value.includes(data.data.session)) {
    //             res.locals.username = data.data.username;
    //             res.locals.id = data.data.id;
    //             res.locals.session = data.data.session;
    //             next();
    //             return;
    //         }
    //         //else if (!playerDatabase.value[data.data.id]) res.status(404).send({ error: 'User not found.' })
    //         else res.status(401).send({ error: 'Invalid session.' })
    //     });
    // });

    // Secured API endpoints.
    function login(req, res) {
        database.find('tracker', 'user', { username: req.body.username }, (error, result) => {
            if (error) return res.status(404).send({ error: 'User not found.' })
            bcrypt.compare(req.body.password, result[0].password, (err, match) => {
                if (match) {
                    let session = uuid();
                    let token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + 86400000,
                        data: {
                            username: result[0].username,
                            id: result[0].id,
                            session: session,
                        }
                    }, tracker.config.tracker.passwordHash);
                    //currentUsers.value.push(session)
                    return res.status(200).send({ username: result[0].username, id: result[0].id, token: token })
                }
                return res.status(401).send({ error: 'Incorrect password.' })
            });
        });
        // bcrypt.compare(req.body.password, playerDatabase.value[id].password, (err, result) => {
        //     if (result) {
        //         let session = uuid();
        //         let token = jwt.sign({
        //             exp: Math.floor(Date.now() / 1000) + 86400000,
        //             data: {
        //                 username: req.body.username,
        //                 id: id,
        //                 session: session,
        //             }
        //         }, nodecg.bundleConfig.jwtSecret)
        //         currentUsers.value.push(session);
        //         nodecg.log.info(`Signed in ${req.body.username} on ${createDateString()}`);

        //     }

        // });
    }

    function createDonationID(req, res) {
        let donationId = uuid();
        //tracker.modules.donation.pendingDonations.push(donationId)
        res.status(200).send({ donationId: donationId });
    }
}