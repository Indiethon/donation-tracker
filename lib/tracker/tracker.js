const express = require('express');
const config = require('./../../config.json');
const fs = require('fs')
const path = require('path')
const replicant = require('./../replicant/replicant')
const Database = require('./../database/database')
const Api = require('./../api/api')
const blockedLibs = ['tracker', 'replicant', 'database']

class Tracker {
    constructor(callback) {
        const app = express();
        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());
        app.use(express.text());
        app.engine('html', require('ejs').renderFile);
        app.set('view engine', 'html');
        app.set('views', path.join(__rootdir, '/pages'));
        app.use('/pages', express.static(path.join(__rootdir, 'pages')))
        this.server = app;
        this.config = config;
        this.modules = {};
        if (config.ssl.enabled) this.url = `https://${config.baseURL}`;
        else if (config.port === 80 ||config.port === 443) this.url = `http://${config.baseURL}`;
        else this.url = `http://${tracker.config.baseURL}:${config.port}`;

        // Initialize database.
        let database = new Database(config.tracker.databaseURL)

        // Initialize libraries.
        const libraries = fs.readdir(path.join(__rootdir, 'lib'), (err, files) => {
            files.forEach(lib => {
                if (!blockedLibs.includes(lib)) {
                    let libPath = require(`./../${lib}/${lib}.js`)
                    try { libPath(this, database) } catch (e) { console.error(`Error when loading library ${lib}. ${e}`) }
                }
            });
        });

        // Initialize modules.
        const modules = fs.readdir(path.join(__rootdir, 'modules'), (err, files) => {
            files.forEach(module => {
                this.modules[module] = require(`./../../modules/${module}/index.js`)
                try { this.modules[module](this, database) } catch (e) { console.error(`Error when loading module ${module}. ${e}`) }
            });
        });

        // Initialize exsiting replicants.
        let repList = {};
        fs.readdir(path.join(__rootdir, 'db/replicants'), (err, files) => {
            if (err) throw new Error('Error reading replicants.');
            if (files.length <= 0) { this.replicantList = repList; callback(this, database) }
            for (let i = 0; i < files.length; i++) {
                let name = files[i].split('.rep')[0];
                let value = new replicant(name, true)
                repList += { name: value };
                if (i === files.length - 1) { this.replicantList = repList; callback(this, database) }
            }
        });
    }

    Replicant(name, options) {
        if (!name || typeof name !== 'string') throw new Error('Replicant name is invalid.');
        if (this.replicantList[name] !== undefined) return this.replicantList[name];
        return new replicant(name, options, false)
    }
}

module.exports = Tracker;