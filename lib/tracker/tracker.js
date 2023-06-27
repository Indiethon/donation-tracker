const express = require('express');
const config = require('./../../config.json');
const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')
const websocketLib = require('./../websocket/websocket')
const uuid = require('uuid');
const Database = require('./../database/database')
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./cache');
const blockedLibs = ['tracker', 'database'];
let serverUpgrade = false;

let cors = require('cors')

class Tracker {
    constructor(callback) {
        console.debug('[Tracker] Creating Express app...')
        const app = express();
        console.debug('[Tracker] Setting Express options...')
        app.use(express.text());
        app.use(express.urlencoded({ extended: true }))
        app.use(express.json());
        console.debug('[Tracker] Setting Express static directories...')
        try { app.use('/content/logo', express.static(config.tracker.logoPath)) } catch { console.warn('Error when setting up logo path. Are you sure that your logo file is accessible?') }
        console.debug('[Tracker] Binding Express app...')
        app.use(cors())
        this.server = app;
        this.config = config;
        this.currencies = currencies;
        this.wsClients = new Map();
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
                            libPath(this, database)
                        } catch (e) { console.error(`Error when loading library ${lib}. ${e}`) }
                    }
                }
                resolve();
            });
        });

        // Check local storage.
        const sessionStorage = new Promise(async (resolve, reject) => {
            const data = await JSON.parse(localStorage.getItem('sessions'));
            if (!data) localStorage.setItem('sessions', JSON.stringify([]))
            resolve();
        })

        // Initialize websocket connection.

        // Donation websocket.
        let wsServer = new WebSocket.WebSocketServer({ noServer: true, });
        app.get('/websocket/start', (req, res) => {
            if (!serverUpgrade) {
                serverUpgrade = true;
                req.connection.server.on('upgrade', (req, socket, head) => {
                    if (req.url.includes('/websocket/data')) {
                        wsServer.handleUpgrade(req, socket, head, (wsConnection) => {
                            wsServer.emit('connection', wsConnection, req);
                            wsServer.ws = wsConnection;
                        });
                    }
                })
            }
            res.status(200).send({});
        });

        wsServer.on('connection', (ws, req) => {
            if (!req.url.includes('/websocket/data')) return;
            const urlParams = new URLSearchParams(req.url.substring(req.url.indexOf('?')));
            let metadata = {
                id: uuid.v4(),
                secure: this.config.tracker.tokens.includes(urlParams.get('token')),
            }
            this.wsClients.set(ws, metadata);
            this.sendWsMessage({ type: "connectionReturn", code: 200, data: { id: metadata.id }}, metadata)

            ws.on("message", (msg) => {
                console.log(this.wsClients.get(ws))
                websocketLib.parseMessage(msg, this.wsClients.get(ws));
            })
        })

        setTimeout(() => this.libs, 1000)

        // Wait for all libraries and modules to be loaded, then return object.
        Promise.all([loadLibs, sessionStorage]).then(() => callback(this, database))
    }

    checkLoginStatus(session) {
        return new Promise(async (resolve, reject) => {
            const data = await JSON.parse(localStorage.getItem('sessions'));
            let filteredArray = data.filter(x => Date.now() > x.expiryDate);
            if (data.length !== filteredArray.length) localStorage.setItem('sessions', JSON.stringify(filteredArray));
            const user = filteredArray.find(x => x.session === session);
            if (!user) return resolve(false);
            return resolve(true);
        })
    }

    addUserSession(session, expiryDate) {
        return new Promise(async (resolve, reject) => {
            let data = await JSON.parse(localStorage.getItem('sessions'));
            data.push({ session: session, expiryDate: expiryDate });
            localStorage.setItem('sessions', JSON.stringify(data))
            return resolve();
        })
    }

    removeUserSession(session) {
        return new Promise(async (resolve, reject) => {
            let data = await JSON.parse(localStorage.getItem('sessions'));
            let userToken = data.map((x) => { return x.session; }).indexOf(session);
            data.splice(userToken, 1);
            localStorage.setItem('sessions', JSON.stringify(data))
            return resolve();
        })
    }

    sendWsMessage(msg, wsClient) {
        return new Promise(async (resolve, reject) => {
            if (wsClient) {
                [...this.wsClients].forEach(async client => {
                    if (client[1].id === wsClient.id) return client[0].send(JSON.stringify(msg));
                });
            } else {
                [...this.wsClients.keys()].forEach(async client => {
                    client.send(JSON.stringify(msg));
                });
            }
            resolve();
        })
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