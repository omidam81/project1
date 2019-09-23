"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const scrapControls_1 = require("./scraping/scrapControls");
const userControler_1 = require("./user/userControler");
const bodyParser = require("body-parser");
class App {
    constructor() {
        this.app = express();
        this.config();
    }
    config() {
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(function (req, res, next) {
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', '*');
            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);
            // Pass to next layer of middleware
            next();
        });
        this.app.use(scrapControls_1.default);
        this.app.use(userControler_1.default);
    }
}
exports.default = new App().app;
//# sourceMappingURL=app.js.map