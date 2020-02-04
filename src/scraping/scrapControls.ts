import * as express from 'express';
import * as bodyParser from 'body-parser';
import Scrap from './scrap';
import { constants } from 'os';
import Jwt from '../autorize';
import oneLineService from '../services/onelineScrapService';
import aplScrapService from '../services/aplScrapService';
import maerskScrapService from '../services/maerskScrapService';
import pilScrapService from '../services/pilScrapService';
import * as ScrapModel from './scrapModel';
import zimScrapService from '../services/zimScrapService';
import shipmentLinkService from '../services/shipmentlinkScrapService';
import hapagScrapService from '../services/hapagScrapService';
import yangMingScrapService from '../services/yangmingScrapService';
import OoclScrapService from '../services/ooclScrapService';
import { GlobalSchedule } from '../services/globalSheduleList';
class scrapControler {
    public router: express.router;
    public scrap: Scrap;
    public oneLine: oneLineService;
    public apl: aplScrapService;
    public maersk: maerskScrapService;
    public pil: pilScrapService;
    public zim: zimScrapService;
    public shipment: shipmentLinkService;
    public hapag: hapagScrapService;
    public yang: yangMingScrapService;
    public oocl: OoclScrapService;
    constructor() {
        this.router = express.Router();
        this.scrap = new Scrap();
        this.oneLine = new oneLineService();
        this.apl = new aplScrapService();
        this.maersk = new maerskScrapService();
        this.pil = new pilScrapService();
        this.zim = new zimScrapService();
        this.shipment = new shipmentLinkService();
        this.hapag = new hapagScrapService();
        this.yang = new yangMingScrapService();
        this.oocl = new OoclScrapService();
        this.config();
        this.call();
    }
    private config(): void {
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(bodyParser.json());
    }

    private call(): void {
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
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadSites', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/savePortToPort', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });

        //schedule setting
        this.router.post('/api/scrap/saveSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadPortToPort', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadReport', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/scrapReport', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/deletePortToPort', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.get('/api/scrap/getNewPort', async (req, res) => {
            try {
                //get last port
                let data = await this.scrap.getLastPort();
                let pk = data[0][''];
                let newPorts = await this.scrap.loadNewPorts(pk) as Array<any>;
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
                    let res = await this.scrap.insertNewPorts(newPort);
                }
                res.status(200).send({
                    msg: 'success'
                })
            } catch (e) {
                res.status(200).send({
                    msg: 'success'
                })
            }

        })

        this.router.get('/api/scrap/getNewRout', async (req, res) => {
            try {
                //get last port
                let data = await this.scrap.getLastRoute();
                let pk = data[0][''] || 0;
                let newRouts = await this.scrap.loadNewRouts(pk) as Array<any>;
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
                    let res = await this.scrap.insertNewRoutes(newRoute);
                }
                res.status(200).send({
                    msg: 'success'
                })
            } catch (e) {
                res.status(200).send({
                    msg: 'success'
                })
            }
        })
        this.router.post('/api/scrap/portPairPaging/', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        })
        this.router.get('/api/scrap/loadNewPorts/', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        })

        this.router.get('/api/test/', async (req, res) => {
            let from = await this.oocl.findCode('hong kong');
            let to = await this.oocl.findCode('Hamburg');
            let d: any = await this.oocl.sendData(from, to, "2019-11-28", 1, {}, 8);

            res.status(200).send({
                msg: 'success',
                data: d
            })
        })
        this.router.get('/api/checkServices', (req, res) => {
            let hasErrorZim = GlobalSchedule.zimerr > 5;
            if (hasErrorZim) {
                GlobalSchedule.zimerr = 0;
            }
            let hasErrorApl = GlobalSchedule.aplerr > 5;
            if (hasErrorApl) {
                GlobalSchedule.aplerr = 0;
            }
            let hasErrorHapag = GlobalSchedule.hapagerr > 5;
            if (hasErrorHapag) {
                GlobalSchedule.hapagerr = 0;
            }
            let hasErrorMaerk = GlobalSchedule.maerskerr > 5;
            if (hasErrorMaerk) {
                GlobalSchedule.maerskerr = 0;
            }
            let hasErrorOneLine = GlobalSchedule.oneLineerr > 5;
            if (hasErrorOneLine) {
                GlobalSchedule.oneLineerr = 0;
            }
            let hasErrorOocl = GlobalSchedule.ooclerr > 5;
            if (hasErrorOocl) {
                GlobalSchedule.ooclerr = 0;
            }
            let hasErrorPil = GlobalSchedule.pilerr > 5;
            if (hasErrorPil) {
                GlobalSchedule.pilerr = 0;
            }
            let hasErrorShip = GlobalSchedule.shipmentLinkerr > 5;
            if (hasErrorShip) {
                GlobalSchedule.shipmentLinkerr = 0;
            }
            let hasErrorYang = GlobalSchedule.yangMingerr > 5;
            if (hasErrorYang) {
                GlobalSchedule.yangMingerr = 0;
            }
            let result = [];
            result.push({
                name: 'Zim',
                service: GlobalSchedule.zimScheduleService,
                count: GlobalSchedule.zimScheduleCount,
                err: hasErrorZim,
                pause: GlobalSchedule.zimstopFlag,
                showLog: GlobalSchedule.zimshowLog
            });
            result.push({
                name: 'apl',
                service: GlobalSchedule.aplScheduleService,
                count: GlobalSchedule.aplScheduleCount,
                err: hasErrorApl,
                pause: GlobalSchedule.aplstopFlag,
                showLog: GlobalSchedule.aplshowLog
            });
            result.push({
                name: 'maersk',
                service: GlobalSchedule.maerskScheduleService,
                count: GlobalSchedule.maerskScheduleCount,
                err: hasErrorMaerk,
                pause: GlobalSchedule.maerskstopFlag,
                showLog: GlobalSchedule.maerskshowLog
            });
            result.push({
                name: 'oneLine',
                service: GlobalSchedule.oneLineScheduleService,
                count: GlobalSchedule.oneLineScheduleCount,
                err: hasErrorOneLine,
                pause: GlobalSchedule.oneLinestopFlag,
                showLog: GlobalSchedule.oneLineshowLog
            });
            result.push({
                name: 'pil',
                service: GlobalSchedule.pilScheduleService,
                count: GlobalSchedule.pilScheduleCount,
                err: hasErrorPil,
                pause: GlobalSchedule.pilstopFlag,
                showLog: GlobalSchedule.pilshowLog
            });
            result.push({
                name: 'shipmentLink',
                service: GlobalSchedule.shipmentLinkScheduleService,
                count: GlobalSchedule.shipmentLinkScheduleCount,
                err: hasErrorShip,
                pause: GlobalSchedule.shipmentLinkstopFlag,
                showLog: GlobalSchedule.shipmentLinkshowLog
            });
            result.push({
                name: 'yangming',
                service: GlobalSchedule.yangMingScheduleService,
                count: GlobalSchedule.yangMingScheduleCount,
                err: hasErrorYang,
                pause: GlobalSchedule.yangMingstopFlag,
                showLog: GlobalSchedule.yangMingshowLog
            });
            result.push({
                name: 'hapag-lloyd',
                service: GlobalSchedule.hapagScheduleService,
                count: GlobalSchedule.hapagScheduleCount,
                err: hasErrorHapag,
                pause: GlobalSchedule.hapagstopFlag,
                showLog: GlobalSchedule.hapagshowLog
            });
            result.push({
                name: 'oocl',
                service: GlobalSchedule.ooclScheduleService,
                count: GlobalSchedule.ooclScheduleCount,
                err: hasErrorOocl,
                pause: GlobalSchedule.ooclstopFlag,
                showLog: GlobalSchedule.ooclshowLog
            })
            res.status(200).send({
                result
            })
        })
        this.router.post('/api/scrap/toggle', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
            if (status == 200) {
                let site: string = req.body.site;
                switch (site.toLowerCase()) {
                    case 'zim':
                        GlobalSchedule.zimstopFlag = !GlobalSchedule.zimstopFlag;
                        break
                    case 'apl':
                        GlobalSchedule.aplstopFlag = !GlobalSchedule.aplstopFlag;
                        break;
                    case 'maersk':
                        GlobalSchedule.maerskstopFlag = !GlobalSchedule.maerskstopFlag;
                        break;
                    case 'oneline':
                        GlobalSchedule.oneLinestopFlag = !GlobalSchedule.oneLinestopFlag;
                        break;
                    case 'pil':
                        GlobalSchedule.pilstopFlag = !GlobalSchedule.pilstopFlag;
                        break;
                    case 'shipmentlink':
                        GlobalSchedule.shipmentLinkstopFlag = !GlobalSchedule.shipmentLinkstopFlag;
                        break;
                    case 'yangming':
                        GlobalSchedule.yangMingstopFlag = !GlobalSchedule.yangMingstopFlag;
                        break;
                    case 'hapag-lloyd':
                        GlobalSchedule.hapagstopFlag = !GlobalSchedule.hapagstopFlag;
                        break;
                    case 'oocl':
                        GlobalSchedule.ooclstopFlag = !GlobalSchedule.ooclstopFlag;
                        break;
                }
                res.status(200).send({
                    msg: 'success'
                })
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        })
        this.router.post('/api/scrap/toggleLog', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
            if (status == 200) {
                let site: string = req.body.site;
                switch (site.toLowerCase()) {
                    case 'zim':
                        GlobalSchedule.zimshowLog = !GlobalSchedule.zimshowLog;
                        break;
                    case 'apl':
                        GlobalSchedule.aplshowLog = !GlobalSchedule.aplshowLog;
                        break;
                    case 'maersk':
                        GlobalSchedule.maerskshowLog = !GlobalSchedule.maerskshowLog;
                        break;
                    case 'oneline':
                        GlobalSchedule.oneLineshowLog = !GlobalSchedule.oneLineshowLog;
                        break;
                    case 'pil':
                        GlobalSchedule.pilshowLog = !GlobalSchedule.pilshowLog;
                        break;
                    case 'shipmentlink':
                        GlobalSchedule.shipmentLinkshowLog = !GlobalSchedule.shipmentLinkshowLog;
                        break;
                    case 'yangming':
                        GlobalSchedule.yangMingshowLog = !GlobalSchedule.yangMingshowLog;
                        break;
                    case 'hapag-lloyd':
                        GlobalSchedule.hapagshowLog = !GlobalSchedule.hapagshowLog;
                        break;
                    case 'oocl':
                        GlobalSchedule.ooclshowLog = !GlobalSchedule.ooclshowLog;
                        break;

                }
                res.status(200).send({
                    msg: 'success'
                })
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        })
    }
}
export default new scrapControler().router;
