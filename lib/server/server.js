let path = require('path');
let prizes = require('../prizes/prizes')
let mongoose = require('mongoose')

module.exports = async (tracker, database) => {

    let app = tracker.server;

    // Redirect to HTTPS (if SSL is enabled)
    if (tracker.config.ssl.enabled) {
        app.use((req, res, next) => {
            if (req.secure) return next();
            return res.redirect('https://' + req.headers.host + req.url);
        })
    }

    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store')
        next()
    })

    // Basic routes.
    app.get('/login', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/login.html')));
    app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/admin/admin/admin.html')));
    app.get('/volunteer/dashboard', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/volunteer/volunteer/volunteer.html')));

    if (!tracker.config.frontend.useDefault) return;
    app.get("/donate", (req, res) => res.sendFile(path.join(__rootdir, 'pages/donate/donate.html')));
    app.get("/donate/:short", async (req, res) => {
        if (req.params.short === 'success') return res.sendFile(path.join(__rootdir, 'pages/donate/success.html'));
        else if (req.params.short === 'error') return res.sendFile(path.join(__rootdir, 'pages/donate/error.html'));
        let event = await database.models['event'].findOne({ short: req.params.short });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect(`/home/${req.params.short}`)
        res.redirect('/donate')
    });

    app.get("/home/:short", async (req, res) => {
        let event = await database.models['event'].findOne({ short: req.params.short });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
        res.sendFile(path.join(__rootdir, 'pages/home.html'))
    });
    app.get('/home', (req, res) => res.sendFile(path.join(__rootdir, 'pages/home.html')));
    app.get("/", (req, res) => res.redirect('/home'));


    app.get('/incentives', async (req, res) => {
        let event = await database.models['event'].findOne({ active: true });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect('/incentives/all')
        res.redirect(`/incentives/${event.short}`);
    })
    app.get("/incentives/:short", async (req, res) => {
        let event = await database.models['event'].findOne({ short: req.params.short });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
        res.sendFile(path.join(__rootdir, 'pages/incentives.html'))
    });

    app.get('/prizes', async (req, res) => {
        let event = await database.models['event'].findOne({ active: true });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect('/prizes/all')
        res.redirect(`/prizes/${event.short}`);
    })
    app.get("/prizes/:short", async (req, res) => {
        let event = await database.models['event'].findOne({ short: req.params.short });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
        res.sendFile(path.join(__rootdir, 'pages/prizes.html'))
    });

    app.get('/donations', async (req, res) => {
        let event = await database.models['event'].findOne({ active: true });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect('/donations/all')
        res.redirect(`/donations/${event.short}`);
    })
    app.get("/donations/:short", async (req, res) => {
        let event = await database.models['event'].findOne({ short: req.params.short });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
        res.sendFile(path.join(__rootdir, 'pages/donations.html'))
    });

    app.get('/runs', async (req, res) => {
        let event = await database.models['event'].findOne({ active: true });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect('/runs/all')
        res.redirect(`/runs/${event.short}`);
    })
    app.get("/runs/:short", async (req, res) => {
        switch (mongoose.isValidObjectId(req.params.short)) {
            case true: let run = await database.models['run'].findOne({ _id: req.params.short });
                if (run === null || run === undefined) return res.status(404).send('Page not found.');
                res.sendFile(path.join(__rootdir, 'pages/details/runs.html'));
                break;
            case false: let event = await database.models['event'].findOne({ short: req.params.short });
                if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
                res.sendFile(path.join(__rootdir, 'pages/runs.html'));
                break;
        }
    });

    app.get("/prize/claim/:encryptedData", (req, res) => prizes.claimPrize(req, res));
    app.get("/prize/forfeit/:encryptedData", (req, res) => prizes.forfeitPrize(req, res));

    app.get('*', (req, res) => res.status(404).send('Page not found.'));
};