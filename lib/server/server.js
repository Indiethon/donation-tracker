module.exports = (tracker, database) => {
    
    let app = tracker.server;

    // Basic routes.
    app.get('/login', (req, res) => res.render('admin/login', { apiUrl: tracker.url }))
    app.get("/donate", (req, res) => res.render('donate/index', { useSandbox: tracker.config.paypal.useSandbox, apiUrl: tracker.url }));
    app.get('/donate/process', (req, res) => {
        if (req.query.st === 'Completed') res.redirect('https://tracker.indiethon.live/donate/success');
    })

    app.get("/donate/success", (req, res) => res.sendFile(path.join(__dirname, '/pages/donate/success.html')));

    app.get('*', (req, res) => res.status(404).send('Page not found.'));
};