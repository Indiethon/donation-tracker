const express = require('express');
const config = require('./../../config.json');
const fs = require('fs')
const path = require('path')
const Database = require('./../database/database')
const Api = require('./../api/api')
const blockedLibs = ['tracker', 'database']

class Tracker {
    constructor(callback) {
        const app = express();
        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());
        app.use(express.text());
        app.use('/content/pages/pages', express.static(path.join(__rootdir, 'pages')))
        app.use('/content/pages/dashboard', express.static(path.join(__rootdir, 'dashboard')))
        try { app.use('/content/logo', express.static(config.tracker.logoPath)) } catch { console.warn('Error when setting up logo path. Are you sure that your logo file is accessible?')}
        this.server = app;
        this.config = config;
        this.loggedInUsers = [];
        if (config.ssl.enabled) this.url = `https://${config.baseURL}`;
        else if (config.port === 80 || config.port === 443) this.url = `http://${config.baseURL}`;
        else this.url = `http://${config.baseURL}:${config.port}`;

        // Initialize database.
        let database = new Database(config.tracker.databaseURL)

        // Load libraries.
        const loadLibs = new Promise((resolve, reject) => {
            const libraries = fs.readdir(path.join(__rootdir, 'lib'), (err, files) => {
                for (const lib of files) {
                    if (!blockedLibs.includes(lib)) {
                        let libPath = require(`./../${lib}/${lib}.js`)
                        try { libPath(this, database) } catch (e) { console.error(`Error when loading library ${lib}. ${e}`) }
                    }
                }
                resolve();
            });
        });

        // Wait for all libraries and modules to be loaded, then return object.
        Promise.all([loadLibs]).then(() => callback(this, database))
    }
}

module.exports = Tracker;