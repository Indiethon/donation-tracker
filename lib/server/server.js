let path = require('path')

module.exports = async (tracker, database) => {

    let app = tracker.server;

    // Redirect to HTTPS (if SSL is enabled)
    if (tracker.config.ssl.enabled) {
        app.use((req, res, next) => {
            if (req.secure && req.get('x-forwarded-proto') === 'https') return next();
            return res.redirect('https://' + req.headers.host + req.url);
        })
    }

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
        let event = await database.models['event'].findOne({ short: req.params.short });
        if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
        res.sendFile(path.join(__rootdir, 'pages/runs.html'))
    });

    app.get('*', (req, res) => res.status(404).send('Page not found.'));
};