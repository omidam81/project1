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
const puppeteer = require("puppeteer");
const node_html_parser_1 = require("node-html-parser");
const utilService_2 = require("./utilService");
const porttoporturl = 'http://www.apl.com/ebusiness/schedules/routing-finder';
class aplScrapService {
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
        if (globalSheduleList_1.GlobalSchedule.aplSchedule) {
            globalSheduleList_1.GlobalSchedule.aplSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.aplSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            let siteSetting = yield this.scrap.loadSetting(2);
            if (!siteSetting[0]['DisableEnable'] || globalSheduleList_1.GlobalSchedule.aplScheduleService) {
                return;
            }
            try {
                console.log(scheduleTime);
                console.log('service apl call');
                globalSheduleList_1.GlobalSchedule.aplScheduleService = true;
                globalSheduleList_1.GlobalSchedule.aplScheduleCount = 0;
                //get all points
                //init scrap proccess
                let timeLength = siteSetting[0]['LenghtScrap'];
                let tempDate = new Date();
                let endTime = this.IsoTime(tempDate.setDate(tempDate.getDate() + timeLength));
                let startTime = this.IsoTime(new Date());
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
                            if (globalSheduleList_1.GlobalSchedule.aplstopFlag) {
                                console.log('User stop apl Service');
                                yield this.PauseService();
                                console.log('User start apl Service agian');
                            }
                            let from = cath.find(x => x.name === ptp['fromPortname']);
                            let to = cath.find(x => x.name === ptp['toPortname']);
                            let fromCode;
                            let toCode;
                            //check if this port not in my cache call api and get code 
                            if (!from) {
                                let temp = yield Promise.race([this.findCode(ptp['fromPortname']), this.setTimeOut(30)]);
                                if (temp == "i") {
                                    if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
                                        console.log('\x1b[31m', 'apl:find Port Code', 'fail');
                                    }
                                    temp = 'noCode';
                                    globalSheduleList_1.GlobalSchedule.aplerr++;
                                }
                                fromCode = temp || 'noCode';
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
                                let temp = yield Promise.race([this.findCode(ptp['toPortname']), this.setTimeOut(30)]);
                                if (temp == "i") {
                                    if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
                                        console.log('\x1b[31m', 'apl:find Port Code', 'fail');
                                    }
                                    temp = 'noCode';
                                    globalSheduleList_1.GlobalSchedule.aplerr++;
                                }
                                toCode = temp || 'noCode';
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
                            if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
                                console.log('apl:Scrap Data', 'start');
                            }
                            yield this.sendData(fromCode, toCode, startTime, endTime, id, ptp);
                        }
                        utilService_2.default.writeTime(`0`);
                        portToPortList = yield this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                        if (!portToPortList[0]) {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.log('apl scrap problem!!! please check your log file');
                utilService_1.default.writeLog(e);
            }
            finally {
                globalSheduleList_1.GlobalSchedule.aplScheduleService = false;
                console.log('apl:finish');
            }
        }));
    }
    sendData(from, to, startDate, range, id, portsDetail) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch({});
            const page = yield browser.newPage();
            try {
                let fromDetails = from.split(';');
                let toDetails = to.split(';');
                let url = porttoporturl + `?DeparturePlaceCode=${fromDetails[2].trim()}&ArrivalPlaceCode=${toDetails[2].trim()}&DeparturePlaceName=${fromDetails[0].trim()}&ArrivalPlaceName=${toDetails[0].trim()}&DepartureCountryCode=${fromDetails[1].trim()}&ArrivalCountryCode=${toDetails[1].trim()}&CultureId=1033&POLDescription=${from}&POLCountryCode=&POLCountryCode=&PODDescription=${to}&PODCountryCode=&PODPlaceCode=&IsDeparture=True&SearchDate=${startDate}&DateRange=2`;
                yield page.goto(url);
                const tables = yield page.evaluate(() => {
                    let Tables = [];
                    for (let i = 0; i < document.getElementsByClassName('solutions-table').length; i++) {
                        Tables.push(document.getElementsByClassName('solutions-table')[i].innerHTML);
                    }
                    return Tables;
                });
                for (let table of tables) {
                    const tempTable = node_html_parser_1.parse(table);
                    //find schedule part
                    let part = tempTable.querySelectorAll('th').filter(x => x.innerHTML.indexOf('Schedule') !== -1);
                    for (let p = 0; p < part.length; p++) {
                        let roueTemp = new scrapModel_1.Route();
                        //get Arrival (eta)
                        let ArrivalRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Arrival') !== -1);
                        let ArrivalDates = ArrivalRow[ArrivalRow.length - 1].querySelectorAll('strong');
                        let arrival = this.changeDate(new Date(ArrivalDates[p].innerHTML));
                        //get Departure (etd)
                        let DepartureRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Departure') !== -1);
                        let DepartureDates = DepartureRow[1].querySelectorAll('strong');
                        let Departure = this.changeDate(new Date(DepartureDates[p].innerHTML));
                        //service , vessel and Voyage
                        let vesselRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Vessel') !== -1);
                        let vesselData = vesselRow[0].querySelectorAll('td')[p];
                        //get vessel 
                        let vesselHtml = vesselData.innerHTML.replace(/\n/g, '').replace(/\t/g, '');
                        let vesel = vesselHtml.match(/<br \/>(.*?)<br \/>/gm)[0].replace(/<br \/>/g, '');
                        //get Voyage
                        let voyage = null;
                        if (vesselData.querySelectorAll('a').length > 0) {
                            voyage = vesselData.querySelectorAll('a').slice(-1).pop().text;
                        }
                        //get service 
                        let service = null;
                        let serviceData = vesselData.childNodes.filter(x => x.text.indexOf('\n') === -1)[0].text;
                        if (serviceData.indexOf('(') !== -1) {
                            service = serviceData.match(/\((.*?)\)/g).pop().replace(/(\(|\))/g, '');
                        }
                        else {
                            service = serviceData.trim();
                        }
                        //port cutoff and vga cutoff
                        let portCutOff = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Port Cutoff') !== -1);
                        let cutOffData = portCutOff[0].querySelectorAll('td')[p].innerHTML.replace(/\n/g, '').replace(/\t/g, '');
                        //get Port Cutoff (from_sch_cy)
                        let cutOff = cutOffData.split('<br />')[2];
                        if (new Date(cutOff).toString() !== "Invalid Date") {
                            cutOff = this.changeDate(new Date(cutOff));
                        }
                        else {
                            cutOff = null;
                        }
                        //get vgm cutoff (from_sch_vgm)
                        let vgmCutoff = cutOffData.split('<br />')[1];
                        if (new Date(vgmCutoff).toString() !== "Invalid Date") {
                            vgmCutoff = this.changeDate(new Date(vgmCutoff));
                        }
                        else {
                            vgmCutoff = null;
                        }
                        //get to/from (ts_port_name) 
                        let toFrom = null;
                        let toFromRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('To / From') !== -1);
                        if (toFromRow.length > 0) {
                            toFrom = toFromRow[0].querySelectorAll('td')[p].querySelectorAll('a')[0].text;
                        }
                        //vessel and Voyage 2
                        let vessel_2 = null;
                        let voyage_2 = null;
                        let vessel2Row = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Local Voyage Ref') !== -1);
                        if (vessel2Row.length > 1) {
                            let vessel2Data = vessel2Row[1].querySelectorAll('td')[p];
                            //get vessel2
                            let vessel2Html = vessel2Data.innerHTML.replace(/\n/g, '').replace(/\t/g, '');
                            vessel_2 = vessel2Html.match(/<br \/>(.*?)<br \/>/gm)[0].replace(/<br \/>/g, '').split('<i')[0];
                            if (vessel_2.indexOf('<i') !== -1) {
                                vessel_2 = vessel_2.split('<i')[0];
                            }
                            //get Voyage2
                            voyage_2 = null;
                            if (vessel2Data.querySelectorAll('a').length > 0) {
                                voyage_2 = vessel2Data.querySelectorAll('a').slice(-1).pop().text;
                            }
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
                        roueTemp.service = service.trim();
                        roueTemp.from_sch_cy = cutOff;
                        roueTemp.from_sch_cfs = null;
                        roueTemp.from_sch_rece = null;
                        roueTemp.from_sch_si = null;
                        roueTemp.from_sch_vgm = vgmCutoff;
                        roueTemp.vessel_2 = vessel_2;
                        roueTemp.voyage_2 = voyage_2;
                        roueTemp.ts_port_name = toFrom;
                        roueTemp.com_code = this.siteSettingGlobal['com_code'].trim();
                        roueTemp.DisableEnable = this.siteSettingGlobal['DisableEnable'];
                        roueTemp.subsidiary_id = this.siteSettingGlobal['Subsidiary_id'].trim();
                        roueTemp.masterSetting = id;
                        roueTemp.siteId = 2;
                        //!!!!
                        try {
                            yield this.scrap.saveRoute(roueTemp);
                            if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
                                console.log('apl:Save in db');
                            }
                            globalSheduleList_1.GlobalSchedule.aplScheduleCount++;
                        }
                        catch (e) {
                            utilService_1.default.writeLog('DataBase error:' + e.message);
                            console.log('DataBase error:', e.message);
                        }
                        // //dispose variables
                        roueTemp = null;
                    }
                }
            }
            catch (e) {
                utilService_1.default.writeLog(e);
                if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
                    console.log('\x1b[31m', 'apl:Scrap Data', 'fail');
                    globalSheduleList_1.GlobalSchedule.aplerr++;
                }
            }
            finally {
                yield browser.close();
                if (+this.siteSettingGlobal['FldbreakTime']) {
                    yield this.break(+this.siteSettingGlobal['FldbreakTime']);
                }
                resolve('ok');
            }
        }));
    }
    IsoTime(date) {
        var d = new Date(date), month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        return [month, day, year].join('/');
    }
    findCode(code) {
        if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
            console.log('apl:find code', 'start');
        }
        return new Promise((resolve, reject) => {
            let url = `http://www.apl.com/api/PortsWithInlands/GetAll?id=${code.trim().toLowerCase()}`;
            let result = '';
            request(url, (err, res, body) => {
                try {
                    if (!err) {
                        let obj = JSON.parse(body);
                        if (obj.length !== 0) {
                            result = obj[0]['Name'];
                        }
                    }
                }
                catch (e) {
                }
                finally {
                    if (globalSheduleList_1.GlobalSchedule.aplshowLog) {
                        console.log('apl:find code', 'end');
                    }
                    resolve(result);
                }
            });
        });
    }
    sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000);
        });
    }
    changeDate(date) {
        try {
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            let h = date.getHours();
            let m = date.getMinutes();
            if (h < 10) {
                h = "0" + h.toString();
            }
            if (m < 10) {
                m = "0" + m.toString();
            }
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
    setTimeOut(s) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('i');
            }, s * 1000);
        });
    }
    PauseService() {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            while (globalSheduleList_1.GlobalSchedule.aplstopFlag) {
                yield this.setTimeOut(1);
            }
            resolve('');
        }));
    }
}
exports.default = aplScrapService;
//# sourceMappingURL=aplScrapService.js.map