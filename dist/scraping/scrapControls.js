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
const aplScrapService_1 = require("../services/aplScrapService");
const maerskScrapService_1 = require("../services/maerskScrapService");
const pilScrapService_1 = require("../services/pilScrapService");
const ScrapModel = require("./scrapModel");
const zimScrapService_1 = require("../services/zimScrapService");
const shipmentlinkScrapService_1 = require("../services/shipmentlinkScrapService");
const hapagScrapService_1 = require("../services/hapagScrapService");
const yangmingScrapService_1 = require("../services/yangmingScrapService");
const ooclScrapService_1 = require("../services/ooclScrapService");
const globalSheduleList_1 = require("../services/globalSheduleList");
class scrapControler {
    constructor() {
        this.router = express.Router();
        this.scrap = new scrap_1.default();
        this.oneLine = new onelineScrapService_1.default();
        this.apl = new aplScrapService_1.default();
        this.maersk = new maerskScrapService_1.default();
        this.pil = new pilScrapService_1.default();
        this.zim = new zimScrapService_1.default();
        this.shipment = new shipmentlinkScrapService_1.default();
        this.hapag = new hapagScrapService_1.default();
        this.yang = new yangmingScrapService_1.default();
        this.oocl = new ooclScrapService_1.default();
        this.config();
        this.call();
    }
    config() {
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(bodyParser.json());
    }
    call() {
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
                siteSetting.breakTime = req.body.breakTime;
                switch (siteSetting.SiteId) {
                    case 1:
                        this.oneLine.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 2:
                        this.apl.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 3:
                        this.maersk.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 4:
                        this.pil.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 5:
                        this.zim.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 6:
                        this.shipment.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 7:
                        this.hapag.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 8:
                        this.yang.loadPortToPortSchedule(siteSetting.String);
                        break;
                    case 9:
                        this.oocl.loadPortToPortSchedule(siteSetting.String);
                }
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
                    .loadDetailSetting(siteId, -1)
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
        this.router.post('/api/scrap/portPairPaging/', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let id = req.body.id;
                this.scrap
                    .loadPagindPortPair(id)
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
        this.router.get('/api/scrap/loadNewPorts/', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                this.scrap
                    .newPorts()
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
        this.router.get('/api/test/', (req, res) => __awaiter(this, void 0, void 0, function* () {
            let from = yield this.oocl.findCode('hong kong');
            let to = yield this.oocl.findCode('Hamburg');
            let d = yield this.oocl.sendData(from, to, "2019-11-28", 1, {}, 8);
            res.status(200).send({
                msg: 'success',
                data: d
            });
        }));
        this.router.get('/api/checkServices', (req, res) => {
            let hasErrorZim = globalSheduleList_1.GlobalSchedule.zimerr > 5;
            if (hasErrorZim) {
                globalSheduleList_1.GlobalSchedule.zimerr = 0;
            }
            let hasErrorApl = globalSheduleList_1.GlobalSchedule.aplerr > 5;
            if (hasErrorApl) {
                globalSheduleList_1.GlobalSchedule.aplerr = 0;
            }
            let hasErrorHapag = globalSheduleList_1.GlobalSchedule.hapagerr > 5;
            if (hasErrorHapag) {
                globalSheduleList_1.GlobalSchedule.hapagerr = 0;
            }
            let hasErrorMaerk = globalSheduleList_1.GlobalSchedule.maerskerr > 5;
            if (hasErrorMaerk) {
                globalSheduleList_1.GlobalSchedule.maerskerr = 0;
            }
            let hasErrorOneLine = globalSheduleList_1.GlobalSchedule.oneLineerr > 5;
            if (hasErrorOneLine) {
                globalSheduleList_1.GlobalSchedule.oneLineerr = 0;
            }
            let hasErrorOocl = globalSheduleList_1.GlobalSchedule.ooclerr > 5;
            if (hasErrorOocl) {
                globalSheduleList_1.GlobalSchedule.ooclerr = 0;
            }
            let hasErrorPil = globalSheduleList_1.GlobalSchedule.pilerr > 5;
            if (hasErrorPil) {
                globalSheduleList_1.GlobalSchedule.pilerr = 0;
            }
            let hasErrorShip = globalSheduleList_1.GlobalSchedule.shipmentLinkerr > 5;
            if (hasErrorShip) {
                globalSheduleList_1.GlobalSchedule.shipmentLinkerr = 0;
            }
            let hasErrorYang = globalSheduleList_1.GlobalSchedule.yangMingerr > 5;
            if (hasErrorYang) {
                globalSheduleList_1.GlobalSchedule.yangMingerr = 0;
            }
            let result = [];
            result.push({
                name: 'Zim',
                service: globalSheduleList_1.GlobalSchedule.zimScheduleService,
                count: globalSheduleList_1.GlobalSchedule.zimScheduleCount,
                err: hasErrorZim,
                pause: globalSheduleList_1.GlobalSchedule.zimstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.zimshowLog
            });
            result.push({
                name: 'apl',
                service: globalSheduleList_1.GlobalSchedule.aplScheduleService,
                count: globalSheduleList_1.GlobalSchedule.aplScheduleCount,
                err: hasErrorApl,
                pause: globalSheduleList_1.GlobalSchedule.aplstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.aplshowLog
            });
            result.push({
                name: 'maersk',
                service: globalSheduleList_1.GlobalSchedule.maerskScheduleService,
                count: globalSheduleList_1.GlobalSchedule.maerskScheduleCount,
                err: hasErrorMaerk,
                pause: globalSheduleList_1.GlobalSchedule.maerskstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.maerskshowLog
            });
            result.push({
                name: 'oneLine',
                service: globalSheduleList_1.GlobalSchedule.oneLineScheduleService,
                count: globalSheduleList_1.GlobalSchedule.oneLineScheduleCount,
                err: hasErrorOneLine,
                pause: globalSheduleList_1.GlobalSchedule.oneLinestopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.oneLineshowLog
            });
            result.push({
                name: 'pil',
                service: globalSheduleList_1.GlobalSchedule.pilScheduleService,
                count: globalSheduleList_1.GlobalSchedule.pilScheduleCount,
                err: hasErrorPil,
                pause: globalSheduleList_1.GlobalSchedule.pilstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.pilshowLog
            });
            result.push({
                name: 'shipmentLink',
                service: globalSheduleList_1.GlobalSchedule.shipmentLinkScheduleService,
                count: globalSheduleList_1.GlobalSchedule.shipmentLinkScheduleCount,
                err: hasErrorShip,
                pause: globalSheduleList_1.GlobalSchedule.shipmentLinkstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.shipmentLinkshowLog
            });
            result.push({
                name: 'yangming',
                service: globalSheduleList_1.GlobalSchedule.yangMingScheduleService,
                count: globalSheduleList_1.GlobalSchedule.yangMingScheduleCount,
                err: hasErrorYang,
                pause: globalSheduleList_1.GlobalSchedule.yangMingstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.yangMingshowLog
            });
            result.push({
                name: 'hapag-lloyd',
                service: globalSheduleList_1.GlobalSchedule.hapagScheduleService,
                count: globalSheduleList_1.GlobalSchedule.hapagScheduleCount,
                err: hasErrorHapag,
                pause: globalSheduleList_1.GlobalSchedule.hapagstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.hapagshowLog
            });
            result.push({
                name: 'oocl',
                service: globalSheduleList_1.GlobalSchedule.ooclScheduleService,
                count: globalSheduleList_1.GlobalSchedule.ooclScheduleCount,
                err: hasErrorOocl,
                pause: globalSheduleList_1.GlobalSchedule.ooclstopFlag,
                showLog: globalSheduleList_1.GlobalSchedule.ooclshowLog
            });
            res.status(200).send({
                result
            });
        });
        this.router.post('/api/scrap/toggle', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status == 200) {
                let site = req.body.site;
                switch (site.toLowerCase()) {
                    case 'zim':
                        globalSheduleList_1.GlobalSchedule.zimstopFlag = !globalSheduleList_1.GlobalSchedule.zimstopFlag;
                        break;
                    case 'apl':
                        globalSheduleList_1.GlobalSchedule.aplstopFlag = !globalSheduleList_1.GlobalSchedule.aplstopFlag;
                        break;
                    case 'maersk':
                        globalSheduleList_1.GlobalSchedule.maerskstopFlag = !globalSheduleList_1.GlobalSchedule.maerskstopFlag;
                        break;
                    case 'oneline':
                        globalSheduleList_1.GlobalSchedule.oneLinestopFlag = !globalSheduleList_1.GlobalSchedule.oneLinestopFlag;
                        break;
                    case 'pil':
                        globalSheduleList_1.GlobalSchedule.pilstopFlag = !globalSheduleList_1.GlobalSchedule.pilstopFlag;
                        break;
                    case 'shipmentlink':
                        globalSheduleList_1.GlobalSchedule.shipmentLinkstopFlag = !globalSheduleList_1.GlobalSchedule.shipmentLinkstopFlag;
                        break;
                    case 'yangming':
                        globalSheduleList_1.GlobalSchedule.yangMingstopFlag = !globalSheduleList_1.GlobalSchedule.yangMingstopFlag;
                        break;
                    case 'hapag-lloyd':
                        globalSheduleList_1.GlobalSchedule.hapagstopFlag = !globalSheduleList_1.GlobalSchedule.hapagstopFlag;
                        break;
                    case 'oocl':
                        globalSheduleList_1.GlobalSchedule.ooclstopFlag = !globalSheduleList_1.GlobalSchedule.ooclstopFlag;
                        break;
                }
                res.status(200).send({
                    msg: 'success'
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/toggleLog', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status == 200) {
                let site = req.body.site;
                switch (site.toLowerCase()) {
                    case 'zim':
                        globalSheduleList_1.GlobalSchedule.zimshowLog = !globalSheduleList_1.GlobalSchedule.zimshowLog;
                        break;
                    case 'apl':
                        globalSheduleList_1.GlobalSchedule.aplshowLog = !globalSheduleList_1.GlobalSchedule.aplshowLog;
                        break;
                    case 'maersk':
                        globalSheduleList_1.GlobalSchedule.maerskshowLog = !globalSheduleList_1.GlobalSchedule.maerskshowLog;
                        break;
                    case 'oneline':
                        globalSheduleList_1.GlobalSchedule.oneLineshowLog = !globalSheduleList_1.GlobalSchedule.oneLineshowLog;
                        break;
                    case 'pil':
                        globalSheduleList_1.GlobalSchedule.pilshowLog = !globalSheduleList_1.GlobalSchedule.pilshowLog;
                        break;
                    case 'shipmentlink':
                        globalSheduleList_1.GlobalSchedule.shipmentLinkshowLog = !globalSheduleList_1.GlobalSchedule.shipmentLinkshowLog;
                        break;
                    case 'yangming':
                        globalSheduleList_1.GlobalSchedule.yangMingshowLog = !globalSheduleList_1.GlobalSchedule.yangMingshowLog;
                        break;
                    case 'hapag-lloyd':
                        globalSheduleList_1.GlobalSchedule.hapagshowLog = !globalSheduleList_1.GlobalSchedule.hapagshowLog;
                        break;
                    case 'oocl':
                        globalSheduleList_1.GlobalSchedule.ooclshowLog = !globalSheduleList_1.GlobalSchedule.ooclshowLog;
                        break;
                }
                res.status(200).send({
                    msg: 'success'
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