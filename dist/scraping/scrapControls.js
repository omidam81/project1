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
                siteSetting.ComCode = req.body.ComCode;
                siteSetting.SubsidiaryId = req.body.SubsidiaryId;
                siteSetting.DisableEnable = req.body.DisableEnable;
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
        this.router.post('/api/scrap/deletePortToPort', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let id = req.body.PortToPortId;
                this.scrap
                    .deletePortToPort(id)
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
        this.router.get('/api/scrap/getNewPort', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //get last port
                let data = yield this.scrap.getLastPort();
                let pk = data[0][''];
                let newPorts = yield this.scrap.loadNewPorts(pk);
                for (let item of newPorts) {
                    let newPort = new ScrapModel.newPort();
                    newPort.port_id = item.port_id || '';
                    newPort.create_date = item.create_date || '';
                    newPort.create_user = item.create_user || '';
                    newPort.modify_date = item.modify_date || '';
                    newPort.modify_user = item.modify_user || '';
                    newPort.phone_fax_no = item.phone_fax_no || '';
                    newPort.port_chi_name = item.port_chi_name || '';
                    newPort.port_code = item.port_code || '';
                    newPort.port_id = item.port_id || '';
                    newPort.port_name = item.port_name || '';
                    newPort.un_code = item.un_code || '';
                    newPort.ctry_id = item.ctry_id || '';
                    let res = yield this.scrap.insertNewPorts(newPort);
                }
                res.status(200).send({
                    msg: 'success'
                });
            }
            catch (e) {
                res.status(200).send({
                    msg: 'success'
                });
            }
        }));
        this.router.get('/api/scrap/getNewRout', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                //get last port
                let data = yield this.scrap.getLastRoute();
                let pk = data[0][''] || 0;
                let newRouts = yield this.scrap.loadNewRouts(pk);
                for (let item of newRouts) {
                    let newRoute = new ScrapModel.Route();
                    newRoute.DisableEnable = item.DisableEnable || '';
                    newRoute.com_code = item.com_code || '';
                    newRoute.eta = item.eta || '';
                    newRoute.etd = item.etd || '';
                    newRoute.from_port_id = item.from_port_id || '';
                    newRoute.from_port_name = item.from_port_name || '';
                    newRoute.from_sch_cfs = item.from_sch_cfs || '';
                    newRoute.from_sch_cy = item.from_sch_cy || '';
                    newRoute.from_sch_rece = item.from_sch_rece || '';
                    newRoute.from_sch_si = item.from_sch_si || '';
                    newRoute.from_sch_vgm = item.from_sch_vgm || '';
                    newRoute.imp_exp = item.imp_exp || '';
                    newRoute.vessel_2 = item.vessel_2 || '';
                    newRoute.voyage = item.voyage || '';
                    newRoute.voyage_2 = item.voyage_2 || '';
                    newRoute.ts_port_name = item.ts_port_name || '';
                    newRoute.to_port_name = item.to_port_name || '';
                    newRoute.subsidiary_id = item.subsidiary_id || '';
                    newRoute.service = item.service || '';
                    newRoute.modify_date = item.modify_date || '';
                    newRoute.route_id = item.route_id;
                    let res = yield this.scrap.insertNewRoutes(newRoute);
                }
                res.status(200).send({
                    msg: 'success'
                });
            }
            catch (e) {
                res.status(200).send({
                    msg: 'success'
                });
            }
        }));
    }
}
exports.default = new scrapControler().router;
//# sourceMappingURL=scrapControls.js.map