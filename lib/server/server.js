let path = require('path');
let prizes = require('../prizes/prizes');
let mongoose = require('mongoose');

module.exports = async (tracker, database) => {

    let app = tracker.server;

    const details = {            
        name: tracker.config.tracker.name,
        description: tracker.config.frontend.description,
        homepage: tracker.config.tracker.homepage,
        privacyPolicy: tracker.config.legal.privacyPolicy,
        sweepstakesRules: tracker.config.legal.sweepstakesRules,
        currency: tracker.config.paypal.currency,
        currencySymbol: tracker.currencies[tracker.config.paypal.currency],
        donationSuccessMessage: tracker.config.frontend.donationSuccessMessage,
        donationErrorMessage: tracker.config.frontend.donationErrorMessage,
        prizeClaimMessage: tracker.config.prizes.prizeClaimMessage,
        prizeForfeitMessage: tracker.config.prizes.prizeForfeitMessage,
        prizeErrorMessage: tracker.config.prizes.prizeErrorMessage,
        analyticsMeasurmentId: (tracker.config.googleAnalytics.enabled) ? tracker.config.googleAnalytics.measurmentId : null,
    }

    // Redirect to HTTPS (if SSL is enabled)
    if (tracker.config.ssl.enabled) {
        app.use((req, res, next) => {
            if (req.secure) return next();
            return res.redirect('https://' + req.headers.host + req.url);
        })
    }

    app.use(async (req, res, next) => {
        res.set('Cache-Control', 'no-store');

        res.locals.details = details;
        res.locals.details.eventList = tracker.cache.get('eventList');
        res.locals.details.activeEvent = tracker.cache.get('activeEvent');

        next()
    })

    // Basic routes.
    app.get('/login', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/login.html')));
    app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/admin/admin/admin.html')));
    app.get('/volunteer/dashboard', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/volunteer/volunteer/volunteer.html')));

    if (!tracker.config.frontend.useDefault) return;
    // app.get("/donate", (req, res) => res.sendFile(path.join(__rootdir, 'pages/donate/donate.html')));
    // app.get("/donate/:short", async (req, res) => {
    //     if (req.params.short === 'success') return res.sendFile(path.join(__rootdir, 'pages/donate/success.html'));
    //     else if (req.params.short === 'error') return res.sendFile(path.join(__rootdir, 'pages/donate/error.html'));
    //     let event = await database.models['event'].findOne({ short: req.params.short });
    //     if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect(`/home/${req.params.short}`)
    //     res.redirect('/donate')
    // });

    //app.get("/*", (req, res) => res.redirect('/home'))

    app.get('/robots.txt', (req, res) => res.sendFile(path.join(__rootdir, 'frontend/static/robots.txt' )))
    
    app.get("/prize/claim", (req, res) => prizes.claimPrize(req, res));
    app.get("/prize/forfeit", (req, res) => prizes.forfeitPrize(req, res));

    app.get("/*", (req, res) => {
        if (req.path === '/') return res.redirect('/home')
        res.render(path.join(__rootdir, 'frontend/views/index.ejs'))
        //res.sendFile(path.join(__rootdir, 'frontend/static/index.html'));
    })


    // app.get('/home', (req, res) => res.render('home'));
    // app.get("/", (req, res) => {
    //     if (tracker.cache.get('activeEvent')) res.redirect(`/home?event=${tracker.cache.get('activeEvent').short}`)
    //     else res.redirect('/home')
    // });

    // app.get('/incentives', async (req, res) => res.render('incentives'))
    // app.get('/prizes', async (req, res) => res.render('prizes'))
    // app.get('/runs', async (req, res) => res.render('runs'))
    // app.get('/donations', async (req, res) => res.render('donations'))

    // app.get('/test', (req, res) => res.render('./partials/nav'));



    // app.get('/runs', async (req, res) => {
    //     let event = await database.models['event'].findOne({ active: true });
    //     if (req.params.short !== 'all' && event === null || event === undefined) return res.redirect('/runs/all')
    //     res.redirect(`/runs/${event.short}`);
    // })
    // app.get("/runs/:short", async (req, res) => {
    //     switch (mongoose.isValidObjectId(req.params.short)) {
    //         case true: let run = await database.models['run'].findOne({ _id: req.params.short });
    //             if (run === null || run === undefined) return res.status(404).send('Page not found.');
    //             res.sendFile(path.join(__rootdir, 'pages/details/runs.html'));
    //             break;
    //         case false: let event = await database.models['event'].findOne({ short: req.params.short });
    //             if (req.params.short !== 'all' && event === null || event === undefined) return res.status(404).send('Page not found.');
    //             res.sendFile(path.join(__rootdir, 'pages/runs.html'));
    //             break;
    //     }
    // });

    app.get('*', (req, res) => res.status(404).send('Page not found.'));
};