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
        app.engine('html', require('ejs').renderFile);
        app.set('view engine', 'html');
        app.set('views', path.join(__rootdir, '/pages'));
        app.use('/content/pages', express.static(path.join(__rootdir, 'pages')))
        app.use('/content/logo', express.static(config.tracker.logoPath))
        this.server = app;
        this.config = config;
        this.modules = {};
        this.loggedInUsers = [];
        if (config.ssl.enabled) this.url = `https://${config.baseURL}`;
        else if (config.port === 80 || config.port === 443) this.url = `http://${config.baseURL}`;
        else this.url = `http://${tracker.config.baseURL}:${config.port}`;

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

        // Load modules.
        const loadModules = new Promise((resolve, reject) => {
            const modules = fs.readdir(path.join(__rootdir, 'modules'), (err, files) => {
                for (const module of files) {
                    this.modules[module] = require(`./../../modules/${module}/index.js`)
                    try { this.modules[module](this, database) } catch (e) { console.error(`Error when loading module ${module}. ${e}`) }
                }
                resolve();
            });
        });

        // Wait for all libraries and modules to be loaded, then return object.
        Promise.all([loadLibs, loadModules]).then(() => callback(this, database))
    }
}

module.exports = Tracker;