let path = require('path')

module.exports = (tracker, database) => {
    
    let app = tracker.server;

    // Basic routes.
    app.get('/login', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/login.html')));
    app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__rootdir, 'dashboard/admin/admin.html')));
    app.get("/donate", (req, res) => res.sendFile(path.join(__rootdir, 'pages/donate/index.html')));
    app.get('/donate/process', (req, res) => {
        if (req.query.st === 'Completed') res.redirect('https://tracker.indiethon.live/donate/success');
        else res.redirect('https://tracker.indiethon.live/donate/error');
    })

    app.get("/donate/success", (req, res) =>  res.sendFile(path.join(__rootdir, 'pages/donate/success.html')));
    app.get("/donate/error", (req, res) =>  res.sendFile(path.join(__rootdir, 'pages/donate/error.html')));

    app.get('*', (req, res) => res.status(404).send('Page not found.'));
};