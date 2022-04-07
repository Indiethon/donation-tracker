module.exports = (tracker, database) => {
    
    let app = tracker.server;

    // Basic routes.
    app.get('/login', (req, res) => res.render('dashboard/login', { apiUrl: tracker.url }))
    app.get('/admin/dashboard', (req, res) => res.render('dashboard/admin/admin', { apiUrl: tracker.url }))
    app.get("/donate", (req, res) => res.render('donate/index'));
    app.get('/donate/process', (req, res) => {
        if (req.query.st === 'Completed') res.redirect('https://tracker.indiethon.live/donate/success');
    })

    app.get("/donate/success", (req, res) => res.render('donate/success'));

    app.get('*', (req, res) => res.status(404).send('Page not found.'));
};