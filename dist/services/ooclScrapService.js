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
//import depemdencyes
const request = require("request");
const schedule = require("node-schedule");
const scrap_1 = require("../scraping/scrap");
const scrapModel_1 = require("../scraping/scrapModel");
const globalSheduleList_1 = require("./globalSheduleList");
const utilService_1 = require("./utilService");
const porttoporturl = 'https://www.zim.com/schedules/point-to-point';
class OoclScrapService {
    constructor() {
        this.scrap = new scrap_1.default();
    }
    loadPortToPortSchedule(scheduleTime) {
        let scheduleString;
        if (scheduleTime === -1) {
        }
        else {
            scheduleString = scheduleTime;
        }
        if (globalSheduleList_1.GlobalSchedule.ooclSchedule) {
            globalSheduleList_1.GlobalSchedule.ooclSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.ooclSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            let siteSetting = yield this.scrap.loadSetting(9);
            if (!siteSetting[0]['DisableEnable'] || globalSheduleList_1.GlobalSchedule.ooclScheduleService) {
                return;
            }
            try {
                console.log(scheduleTime);
                console.log('service oocl call');
                globalSheduleList_1.GlobalSchedule.ooclScheduleService = true;
                globalSheduleList_1.GlobalSchedule.ooclScheduleCount = 0;
                //get all points
                //init scrap proccess
                let startTime = this.IsoTime(new Date());
                let timeLength = siteSetting[0]['LenghtScrap'];
                let endTime = Math.floor(timeLength / 7);
                if (endTime === 0)
                    endTime = endTime + 1;
                let iso = new Date().toISOString().split('T')[0];
                let obj = yield this.scrap.insertMasterRoute(iso, 1);
                let id = obj[0]['PkMasterRoute'];
                console.log(new Date());
                this.siteSettingGlobal = siteSetting[0];
                let cath = [];
                //load  first 1000 ptp
                let portToPortList = yield this.scrap.loadDetailSetting(1, 0);
                if (portToPortList[0]) {
                    while (true) {
                        for (let ptp of portToPortList) {
                            let from = cath.find(x => x.name === ptp['fromPortname']);
                            let to = cath.find(x => x.name === ptp['toPortname']);
                            let fromCode;
                            let toCode;
                            //check if this port not in my cache call api and get code 
                            if (!from) {
                                fromCode = (yield this.findCode(ptp['fromPortname'])) || 'noCode';
                                cath.push({
                                    name: ptp['fromPortname'],
                                    code: fromCode
                                });
                            }
                            else {
                                if (from['code'] === 'noCode') {
                                    continue;
                                }
                                fromCode = from['code'];
                            }
                            if (!to) {
                                toCode = (yield this.findCode(ptp['toPortname'])) || 'noCode';
                                cath.push({
                                    name: ptp['toPortname'],
                                    code: toCode
                                });
                            }
                            else {
                                if (to['code'] === 'noCode') {
                                    continue;
                                }
                                toCode = to['code'];
                            }
                            if (toCode === 'noCode' || fromCode === 'noCode') {
                                continue;
                            }
                            yield this.sendData(fromCode, toCode, startTime, id, ptp, endTime);
                        }
                        portToPortList = yield this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                        if (!portToPortList[0]) {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.log('zim scrap problem!!! please check your log file');
                utilService_1.default.writeLog("zim:" + e);
            }
            finally {
                console.log('oocl: finish');
                globalSheduleList_1.GlobalSchedule.ooclScheduleService = false;
            }
        }));
    }
    sendData(from, to, NOW, id, portsDetail, week) {
        return new Promise((resolve, reject) => {
            var options = {
                method: 'POST',
                url: 'http://moc.oocl.com/nj_prs_wss/mocss/secured/supportData/nsso/searchHubToHubRoute',
                headers: {
                    Host: 'moc.oocl.com',
                    'Accept-Language': 'en-US,en;q=0.9',
                    Referer: 'http://moc.oocl.com/nj_prs_wss/',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
                    Origin: 'http://moc.oocl.com',
                    Accept: 'application/json, text/plain, */*',
                    Connection: 'keep-alive'
                },
                body: {
                    date: NOW,
                    displayDate: NOW,
                    transhipment_Port: null,
                    port_of_Load: null,
                    port_of_Discharge: null,
                    sailing: 'sailing.from',
                    weeks: week.toString(),
                    transhipment_PortId: null,
                    service: null,
                    port_of_LoadId: null,
                    port_of_DischargeId: null,
                    origin_Haulage: 'cy.door',
                    destination_Haulage: 'cy.door',
                    cargo_Nature: 'dry.reefer',
                    originId: from.id,
                    originCountryCode: '',
                    destinationCountryCode: '',
                    destinationId: to.id,
                    origin: from.name,
                    destination: to.name,
                    weeksSymbol: '+'
                },
                json: true
            };
            request(options, (err, res, body) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    utilService_1.default.writeLog(err);
                    resolve('ko');
                }
                else {
                    try {
                        if (res.statusCode === 200) {
                            let finalGroup = body['data']['standardRoutes'];
                            for (let group of finalGroup) {
                                try {
                                    let roueTemp = new scrapModel_1.Route();
                                    //get 2 legs
                                    let allLegs = group['Legs'];
                                    let nLegs = allLegs.filter(x => { if (x.VesselName)
                                        return x; });
                                    //get Departure (etd)
                                    let TimeGroup = allLegs.filter(x => {
                                        if (x.FromETDLocalDateTime) {
                                            return x;
                                        }
                                    });
                                    let Departure = this.changeDate(TimeGroup[0]['FromETDLocalDateTime']['dateStr']);
                                    //get Arrival (eta)
                                    let arrival = this.changeDate(TimeGroup.pop()['ToETALocalDateTime']['dateStr']);
                                    //get vessel 
                                    let vesel = nLegs[0]['VesselName'];
                                    //get Voyage
                                    let voyage = nLegs[0]['ExternalVoyageReference'];
                                    //get service 
                                    let service = nLegs[0]['Service'];
                                    //get from_sch_cy
                                    let from_sch_cy = this.changeDate(group['CargoCutoffLocalDateTime']['dateStr']);
                                    //get to/from (ts_port_name) 
                                    let toFrom = null;
                                    let vessel_2 = null;
                                    let voyage_2 = null;
                                    if (nLegs.length > 1) {
                                        toFrom = nLegs[1]['LoadingPort']['Name'];
                                        vessel_2 = nLegs[1]['VesselName'];
                                        voyage_2 = nLegs[1]['ExternalVoyageReference'];
                                    }
                                    //fill data
                                    roueTemp.from_port_id = portsDetail['fromPortcode'].trim();
                                    roueTemp.from_port_name = portsDetail['fromPortname'].trim();
                                    roueTemp.to_port_id = portsDetail['toPortcode'].trim();
                                    roueTemp.to_port_name = portsDetail['toPortname'].trim();
                                    roueTemp.etd = Departure;
                                    roueTemp.eta = arrival;
                                    roueTemp.vessel = vesel;
                                    roueTemp.voyage = voyage;
                                    roueTemp.modify_date = new Date();
                                    roueTemp.imp_exp = 'E';
                                    roueTemp.service = service;
                                    roueTemp.from_sch_cy = from_sch_cy;
                                    roueTemp.from_sch_cfs = null;
                                    roueTemp.from_sch_rece = null;
                                    roueTemp.from_sch_si = null;
                                    roueTemp.from_sch_vgm = null;
                                    roueTemp.vessel_2 = vessel_2;
                                    roueTemp.voyage_2 = voyage_2;
                                    roueTemp.ts_port_name = toFrom;
                                    roueTemp.com_code = this.siteSettingGlobal['com_code'].trim();
                                    roueTemp.DisableEnable = this.siteSettingGlobal['DisableEnable'];
                                    roueTemp.subsidiary_id = this.siteSettingGlobal['Subsidiary_id'].trim();
                                    roueTemp.masterSetting = id;
                                    roueTemp.siteId = 5;
                                    //!!!!
                                    yield this.scrap.saveRoute(roueTemp);
                                    // //dispose variables
                                    globalSheduleList_1.GlobalSchedule.ooclScheduleCount++;
                                    roueTemp = null;
                                }
                                catch (e) {
                                    continue;
                                }
                            }
                        }
                    }
                    catch (e) {
                        utilService_1.default.writeLog(e.message);
                    }
                    finally {
                        if (+this.siteSettingGlobal['FldbreakTime']) {
                            yield this.break(+this.siteSettingGlobal['FldbreakTime']);
                        }
                        resolve('ok');
                    }
                }
            }));
        });
    }
    IsoTime(date) {
        var d = new Date(date), month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        return [year, month, day].join('-');
    }
    findCode(code) {
        return new Promise((resolve, reject) => {
            try {
                var options = {
                    method: 'GET',
                    url: 'https://www.oocl.com/_catalogs/masterpage/AutoCompleteSailingSchedule.aspx',
                    qs: { type: 'sailingSchedule', Pars: code },
                    headers: {
                        Host: 'www.oocl.com',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        Referer: 'https://www.oocl.com/eng/ourservices/eservices/sailingschedule/Pages/default.aspx',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: '*/*',
                        Connection: 'keep-alive'
                    }
                };
                request(options, function (error, response, body) {
                    try {
                        if (error)
                            resolve('');
                        let o = JSON.parse(body);
                        let data = o['data']['results'];
                        if (data.length > 0) {
                            let englishInfo = data[0]['Names'].find(x => x.Language === "English");
                            resolve({
                                id: data[0]['LocationID'],
                                name: englishInfo['Name'] + ", " + englishInfo['UpperAdministrativeLocation']
                            });
                        }
                        else {
                            resolve('');
                        }
                    }
                    catch (_a) {
                        resolve('');
                    }
                });
            }
            catch (_a) {
                resolve('');
            }
        });
    }
    sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000);
        });
    }
    changeDate(date) {
        try {
            let year = date.substr(0, 4);
            let month = date.substr(4, 2);
            let day = date.substr(6, 2);
            let h = date.substr(8, 2);
            let m = date.substr(10, 2);
            return `${year}/${month}/${day} ${h}:${m}`;
        }
        catch (_a) {
            return null;
        }
    }
    break(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }
}
exports.default = OoclScrapService;
//# sourceMappingURL=ooclScrapService.js.map