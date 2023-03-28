const express = require('express');
const config = require('./../../config.json');
const fs = require('fs')
const path = require('path')
const Database = require('./../database/database')
const NodeCache = require( "node-cache" );
const blockedLibs = ['tracker', 'database']

class Tracker {
    constructor(callback) {
        console.debug('[Tracker] Creating Express app...')
        const app = express();
        console.debug('[Tracker] Setting Express options...')
        app.use(express.text());
        app.use(express.urlencoded({ extended: true }))
        app.use(express.json());
        console.debug('[Tracker] Setting Express static directories...')
        app.use('/content/pages/dashboard', express.static(path.join(__rootdir, 'dashboard')))
        app.use('/content', express.static(path.join(__rootdir, 'frontend')))
        app.engine('html', require('ejs').renderFile);
        app.set('views', path.join(__rootdir, 'frontend/views'));
        try { app.use('/content/logo', express.static(config.tracker.logoPath)) } catch { console.warn('Error when setting up logo path. Are you sure that your logo file is accessible?') }
        console.debug('[Tracker] Binding Express app...')
        this.server = app;
        this.config = config;
        this.loggedInUsers = [];
        this.currencies = currencies;
        this.cache = new NodeCache();
        console.debug('[Tracker] Checking SSL status...')
        if (config.ssl.enabled) this.url = `https://${config.baseURL}`;
        else if (config.port === 80 || config.port === 443) this.url = `http://${config.baseURL}`;
        else this.url = `http://${config.baseURL}:${config.port}`;

        // Initialize database.
        console.debug('[Tracker] Initializing database...')
        let database = new Database(this, config.tracker.databaseURL);

        // Load libraries.
        console.debug('[Tracker] Loading libraries...')
        const loadLibs = new Promise((resolve, reject) => {
            const libraries = fs.readdir(path.join(__rootdir, 'lib'), (err, files) => {
                for (const lib of files) {
                    if (!blockedLibs.includes(lib)) {
                        let libPath = require(`./../${lib}/${lib}.js`)
                        try { 
                            libPath(this, database) } catch (e) { console.error(`Error when loading library ${lib}. ${e}`) }
                    }
                }
                resolve();
            });
        });

        setTimeout(() => this.libs, 1000)

        // Set cache.
        const setCache = new Promise(async (resolve, reject) => {
            let events = await database.models['event'].find().populate('charity');
            let activeEvent = await database.models['event'].findOne({ active: true }).populate('charity')
            let sortedEvents = events.sort((a, b) => b.startTime - a.startTime);
            let eventList = {};
            let eventDetails = {};
            for (const event of sortedEvents) {
                eventList[event.short] = event.name;
                eventDetails[event.short] = event;
            }
            this.cache.set('eventList', eventList);
            this.cache.set('eventDetails', eventDetails);
            this.cache.set('activeEvent', activeEvent);
            resolve();
        })
        
        // Wait for all libraries and modules to be loaded, then return object.
        Promise.all([loadLibs, setCache]).then(() => callback(this, database))
    }
}

module.exports = Tracker;

const currencies = {
    'AUD': 'A$',
    'BRL': 'R$',
    'CAD': 'CA$',
    'CNY': 'CNY',
    'CZK': 'Kč',
    'DKK': 'kr',
    'EUR': '€',
    'HKD': 'HK$',
    'HUF': 'Ft',
    'ILS': '₪',
    'JPY': '¥',
    'MYR': 'RM',
    'MXN': 'MX$',
    'TWD': 'NT$',
    'NZD': 'NZ$',
    'NOK': 'kr',
    'PHP': '₱',
    'PLN': 'zł',
    'GBP': '£',
    'RUB': '₽',
    'SGD': 'S$',
    'SEK': 'kr',
    'CHF': 'CHF',
    'THB': '฿',
    'USD': '$',
  }