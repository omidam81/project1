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
            console.log(scheduleTime);
            console.log('service apl call');
            //get all points
            //init scrap proccess
            let siteSetting = yield this.scrap.loadSetting(2);
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
                        yield this.sendData(fromCode, toCode, startTime, endTime, id, ptp);
                    }
                    portToPortList = yield this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                    if (!portToPortList[0]) {
                        break;
                    }
                }
            }
            console.log('finish');
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
                    let roueTemp = new scrapModel_1.Route();
                    const tempTable = node_html_parser_1.parse(table);
                    //get Arrival (eta)
                    let ArrivalRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Arrival') !== -1);
                    let ArrivalDates = ArrivalRow[ArrivalRow.length - 1].querySelectorAll('strong');
                    let arrival = new Date(ArrivalDates[0].innerHTML);
                    //get Departure (etd)
                    let DepartureRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Departure') !== -1);
                    let DepartureDates = DepartureRow[DepartureRow.length - 1].querySelectorAll('strong');
                    let Departure = new Date(DepartureDates[0].innerHTML);
                    //service , vessel and Voyage
                    let vesselRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Vessel') !== -1);
                    let vesselData = vesselRow[0].querySelectorAll('td')[0];
                    //get vessel 
                    let vesselHtml = vesselData.innerHTML.replace(/\n/g, '').replace(/\t/g, '');
                    let vesel = vesselHtml.match(/<br \/>(.*?)<br \/>/gm)[0].replace(/<br \/>/g, '');
                    //get Voyage
                    let voyage = null;
                    if (vesselData.querySelectorAll('a').length > 0) {
                        voyage = vesselData.querySelectorAll('a').slice(-1).pop().text;
                    }
                    //get service 
                    let service = vesselData.childNodes.filter(x => x.text !== "\n")[0].text;
                    //port cutoff and vga cutoff
                    let portCutOff = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Port Cutoff') !== -1);
                    let cutOffData = portCutOff[0].querySelectorAll('td')[0].innerHTML.replace(/\n/g, '').replace(/\t/g, '');
                    //get Port Cutoff (from_sch_cy)
                    let cutOff = cutOffData.split('<br />')[2];
                    //get vgm cutoff (from_sch_vgm)
                    let vgmCutoff = cutOffData.split('<br />')[1];
                    //get to/from (ts_port_name) 
                    let toFrom = null;
                    let toFromRow = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('To / From') !== -1);
                    if (toFromRow > 0) {
                        let toFrom = toFromRow[0].querySelectorAll('td')[0].querySelectorAll('a')[0].text;
                    }
                    //vessel and Voyage 2
                    let vessel_2 = null;
                    let voyage_2 = null;
                    let vessel2Row = tempTable.querySelectorAll('tr').filter(x => x.innerHTML.indexOf('Local Voyage Ref') !== -1);
                    if (vessel2Row.length > 1) {
                        let vessel2Data = vessel2Row[1].querySelectorAll('td')[0];
                        //get vessel2
                        let vessel2Html = vessel2Data.innerHTML.replace(/\n/g, '').replace(/\t/g, '');
                        vessel_2 = vessel2Html.match(/<br \/>(.*?)<br \/>/gm)[0].replace(/<br \/>/g, '');
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
                    roueTemp.from_sch_cy = null;
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
                    roueTemp.siteId = 2;
                    //!!!!
                    yield this.scrap.saveRoute(roueTemp);
                    // //dispose variables
                    roueTemp = null;
                }
            }
            catch (e) {
                utilService_1.default.writeLog(e);
            }
            finally {
                yield browser.close();
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
        return new Promise((resolve, reject) => {
            let url = `http://www.apl.com/api/PortsWithInlands/GetAll?id=${code.trim().toLowerCase()}`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('');
                    }
                    else {
                        let obj = JSON.parse(body);
                        if (obj.length !== 0) {
                            resolve(obj[0]['Name']);
                        }
                        else {
                            resolve('');
                        }
                    }
                }
                catch (e) {
                    resolve('');
                }
            });
        });
    }
    sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000);
        });
    }
}
exports.default = aplScrapService;
//# sourceMappingURL=aplScrapService.js.map