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
const porttoporturl = 'https://www.shipmentlink.com/tvs2/jsp/TVS2_InteractiveSchedule.jsp?';
class shipmentLinkService {
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
        if (globalSheduleList_1.GlobalSchedule.shipmentLinkSchedule) {
            globalSheduleList_1.GlobalSchedule.shipmentLinkSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.shipmentLinkSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            try {
                let siteSetting = yield this.scrap.loadSetting(6);
                if (!siteSetting[0]['DisableEnable']) {
                    return;
                }
                console.log(scheduleTime);
                console.log('service shipment call');
                globalSheduleList_1.GlobalSchedule.shipmentLinkScheduleService = true;
                globalSheduleList_1.GlobalSchedule.shipmentLinkScheduleCount = 0;
                //get all points
                //init scrap proccess
                let timeLength = siteSetting[0]['LenghtScrap'];
                let tempDate = new Date();
                let range = Math.floor(timeLength / 7);
                if (range === 0)
                    range = 1;
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
                            yield this.sendData(fromCode, toCode, startTime, range, id, ptp);
                        }
                        portToPortList = yield this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                        if (!portToPortList[0]) {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.log('shipmentLink scrap problem!!! please check your log file');
                utilService_1.default.writeLog("shipmentLink:" + e);
            }
            finally {
                console.log('finish');
                globalSheduleList_1.GlobalSchedule.shipmentLinkScheduleService = false;
            }
        }));
    }
    sendData(from, to, startDate, range, id, portsDetail) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch();
            const page = yield browser.newPage();
            try {
                page.on('dialog', (dialog) => __awaiter(this, void 0, void 0, function* () {
                    yield dialog.dismiss();
                }));
                yield page.goto(porttoporturl);
                yield page.evaluate(element => {
                    let dom = document.querySelector('#captcha_input');
                    dom.parentNode.removeChild(dom);
                });
                //oriCountry
                //fill from inputs
                const fromInput = yield page.$('#tvs2OriAC_hideValue');
                yield page.evaluate((fromInput, from) => fromInput.value = from.code, fromInput, from);
                const fromInputName = yield page.$('#tvs2OriAC');
                yield page.evaluate((fromInputName, from) => fromInputName.value = from.url, fromInputName, from);
                //fill to location inputs
                const toInput = yield page.$("#tvs2DesAC_hideValue");
                yield page.evaluate((toInput, to) => toInput.value = to.code, toInput, to);
                const toInputName = yield page.$("#tvs2DesAC");
                yield page.evaluate((toInputName, to) => toInputName.value = to.url, toInputName, to);
                //set duration week
                const timeOption = yield page.$("#durationWeek");
                yield page.evaluate((timeOption, range) => {
                    switch (range) {
                        case 1:
                            timeOption.value = 7;
                            break;
                        case 2:
                            timeOption.value = 14;
                            break;
                        case 3:
                            timeOption.value = 21;
                            break;
                        default:
                            timeOption.value = 28;
                            break;
                    }
                }, timeOption, range);
                const button = yield page.$("input[value='Submit']");
                yield page.evaluate(button => button.click(), button);
                yield page.waitForNavigation();
                yield page.evaluate(element => {
                    let dom = document.querySelector('#captcha_input');
                    dom.parentNode.removeChild(dom);
                });
                const button2 = yield page.$("input[value='Submit']");
                yield page.evaluate(button => button.click(), button2);
                yield page.waitForNavigation();
                let bodyHTML = yield page.evaluate(() => document.body.innerHTML);
                if (bodyHTML.indexOf('Data not found') === -1) {
                    const body = node_html_parser_1.parse(bodyHTML);
                    let results = body.querySelectorAll('thead').filter(x => x.innerHTML.indexOf('Details') !== -1);
                    for (let i = 1; i < results.length; i++) {
                        let roueTemp = new scrapModel_1.Route();
                        //get Arrival (eta)
                        let arrival = this.changeDate(results[i].querySelectorAll('tr')[1].querySelectorAll('td')[4].text.trim());
                        //get Departure (etd)
                        let Departure = this.changeDate(results[i].querySelectorAll('tr')[1].querySelectorAll('td')[1].text.trim());
                        //Voyage and service
                        let row = results[i].querySelectorAll('tr')[1].querySelectorAll('td')[3].text.trim();
                        //get vessel 
                        let vesel = row.split('\n')[0].trim();
                        //get Voyage
                        let voyage = row.split('\n')[1].trim();
                        //get service 
                        let service = results[i].querySelectorAll('tr')[0].querySelectorAll('td')[4].text.trim();
                        //go to Details
                        //find Details Table
                        let DetailBtn = results[i].querySelectorAll('tr')[0].querySelectorAll('td')[8].querySelectorAll('span');
                        let param = DetailBtn[0].attributes['params'];
                        let code = param.split('=')[1];
                        const detailsTable = body.querySelectorAll(`#detailSeq` + code)[0].querySelector('.Design1');
                        const detailsRow = detailsTable.querySelectorAll(`tr`).filter(x => x.text.indexOf('----') === -1);
                        let vessel_2 = null;
                        let voyage_2 = null;
                        let ts_port_name = null;
                        if (detailsRow.length > 3) {
                            ts_port_name = detailsRow[3].querySelectorAll('td')[1].text.split(',')[0].trim();
                            let v2 = detailsRow[3].querySelectorAll('td')[6].text.trim();
                            vessel_2 = v2.match(/(.*?) /g).join(' ').trim();
                            voyage_2 = v2.split(' ')[v2.split(' ').length - 1];
                        }
                        //get 
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
                        roueTemp.from_sch_cy = null;
                        roueTemp.from_sch_cfs = null;
                        roueTemp.from_sch_rece = null;
                        roueTemp.from_sch_si = null;
                        roueTemp.from_sch_vgm = null;
                        roueTemp.vessel_2 = vessel_2;
                        roueTemp.voyage_2 = voyage_2;
                        roueTemp.ts_port_name = ts_port_name;
                        roueTemp.com_code = this.siteSettingGlobal['com_code'].trim();
                        roueTemp.DisableEnable = this.siteSettingGlobal['DisableEnable'];
                        roueTemp.subsidiary_id = this.siteSettingGlobal['Subsidiary_id'].trim();
                        roueTemp.masterSetting = id;
                        roueTemp.siteId = 3;
                        //!!!!
                        yield this.scrap.saveRoute(roueTemp);
                        globalSheduleList_1.GlobalSchedule.shipmentLinkScheduleCount++;
                        // //dispose variables
                        roueTemp = null;
                    }
                }
            }
            catch (e) {
                utilService_1.default.writeLog(e.message);
            }
            finally {
                yield page.close();
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
        return [year, month, day].join('-');
    }
    findCode(code) {
        return new Promise((resolve, reject) => {
            try {
                let url = `https://www.shipmentlink.com/servlet/TUF1_AutoCompleteServlet`;
                var options = {
                    method: 'POST',
                    url: url,
                    headers: {
                        'cache-control': 'no-cache',
                        'Content-Length': '89',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cache-Control': 'no-cache',
                        Accept: '*/*'
                    },
                    form: {
                        scope: 'context',
                        search: code,
                        action: 'preLoad',
                        switchSql: '',
                        datasource: 'bkLocations',
                        fromFirst: 'true'
                    }
                };
                request(options, (error, response, body) => {
                    if (error)
                        resolve('');
                    try {
                        let res = {};
                        res['url'] = decodeURIComponent(eval(body)[0][0]);
                        res['code'] = decodeURIComponent(eval(body)[0][1]);
                        resolve(res);
                    }
                    catch (_a) {
                        resolve('');
                    }
                });
            }
            catch (e) {
                resolve('');
            }
        });
    }
    sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000);
        });
    }
    decodeHex(h) {
        var s = '';
        for (var i = 0; i < h.length; i += 2) {
            s += String.fromCharCode(parseInt(h.substr(i, 2), 16));
        }
        return decodeURIComponent(escape(s));
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
}
exports.default = shipmentLinkService;
//# sourceMappingURL=shipmentlinkScrapService.js.map