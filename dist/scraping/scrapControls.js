"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const scrap_1 = require("./scrap");
const autorize_1 = require("../autorize");
const onelineScrapService_1 = require("../services/onelineScrapService");
const ScrapModel = require("./scrapModel");
class scrapControler {
    constructor() {
        this.router = express.Router();
        this.scrap = new scrap_1.default();
        this.oneLine = new onelineScrapService_1.default();
        this.config();
        this.call();
    }
    config() {
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(bodyParser.json());
    }
    call() {
        this.router.get('/api/scrap/saveAllPort', (req, res) => __awaiter(this, void 0, void 0, function* () {
            let ports = onelineScrapService_1.default.loadports();
            for (let i = 0; i < ports.length; i++) {
                let portOData = new ScrapModel.PortOData();
                portOData.PortCode = ports[i]['locCd'];
                portOData.portName = ports[i]['locNm'];
                yield this.scrap.saveFile(portOData);
            }
            return res.status(200).send({
                msg: 'success',
                status: 200
            });
        }));
        this.router.post('/api/scrap/setScheduleOneLine', (req, res) => {
            let siteModel = new ScrapModel.SiteSetting();
            siteModel.Time = req.body.Time;
            siteModel.portsList = req.body.portsList;
            siteModel.siteId = req.body.siteId;
            siteModel.scheduleTime = req.body.scheduleTime;
            let scheduleTime;
            this.oneLine.loadPortToPortSchedule(siteModel.scheduleTime);
            return res.status(200).send({
                msg: 'success',
                status: 200
            });
        });
        this.router.post('/api/scrap/loadPoints', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let portId = req.body.portId || -1;
                this.scrap
                    .loadPoints(portId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadSites', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let siteId = req.body.siteId;
                this.scrap
                    .loadSites(siteId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/savePortToPort', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let portToPort = new ScrapModel.PortToPort();
                portToPort.from = req.body.from;
                portToPort.to = req.body.to;
                portToPort.siteId = req.body.siteId;
                this.scrap
                    .savePorttoPort(portToPort)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        //schedule setting
        this.router.post('/api/scrap/saveSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let siteSetting = new ScrapModel.siteSetting();
                siteSetting.SiteId = req.body.SiteId;
                siteSetting.Time = req.body.Time;
                siteSetting.DayOfMounth = req.body.DayOfMounth;
                siteSetting.LenghtToScraping = req.body.LenghtToScraping;
                siteSetting.String = req.body.String;
                siteSetting.TypeSchedule = req.body.TypeSchedule;
                this.oneLine.loadPortToPortSchedule(siteSetting.String);
                this.scrap
                    .saveSettingForSite(siteSetting)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let siteId = req.body.siteId;
                this.scrap
                    .loadSetting(siteId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadPortToPort', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let siteId = req.body.siteId;
                this.scrap
                    .loadDetailSetting(siteId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadReport', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                this.scrap
                    .loadReport()
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        msg: 'success',
                        status: 200
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/scrapReport', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let scrapReportOData = new ScrapModel.scrapReport();
                scrapReportOData.from = req.body.from;
                scrapReportOData.to = req.body.to;
                let fromTime = req.body.fromTime;
                let toTime = req.body.toTime;
                fromTime = fromTime.replace('T', ' ');
                fromTime = fromTime.replace('Z', '');
                toTime = toTime.replace('T', ' ');
                toTime = toTime.replace('Z', '');
                scrapReportOData.fromTime = fromTime;
                scrapReportOData.toTime = toTime;
                this.scrap
                    .ScrapReport(scrapReportOData)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
    }
}
exports.default = new scrapControler().router;
//# sourceMappingURL=scrapControls.js.map