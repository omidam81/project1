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
const porttoporturl = 'https://www.hapag-lloyd.com/en/online-business/schedules/interactive-schedule.html';
class hapagScrapService {
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
        if (globalSheduleList_1.GlobalSchedule.hapagSchedule) {
            globalSheduleList_1.GlobalSchedule.hapagSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.hapagSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            let siteSetting = yield this.scrap.loadSetting(7);
            if (!siteSetting[0]['DisableEnable'] || globalSheduleList_1.GlobalSchedule.hapagScheduleService) {
                return;
            }
            try {
                console.log(scheduleTime);
                console.log('service hapag-lloyd call');
                globalSheduleList_1.GlobalSchedule.hapagScheduleService = true;
                globalSheduleList_1.GlobalSchedule.hapagScheduleCount = 0;
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
            }
            catch (e) {
                console.log('hapag-lloyd scrap problem!!! please check your log file');
                utilService_1.default.writeLog("hapag-lloyd:" + e);
            }
            finally {
                console.log('hapag: finish');
                globalSheduleList_1.GlobalSchedule.hapagScheduleService = false;
            }
        }));
    }
    sendData(from, to, startDate, range, id, portsDetail) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch();
            const page = yield browser.newPage();
            try {
                yield page.setRequestInterception(true);
                page.on('request', request => {
                    if (request.resourceType() === 'image')
                        request.abort();
                    else
                        request.continue();
                });
                yield page.setDefaultNavigationTimeout(60000);
                yield page.goto('https://www.hapag-lloyd.com/en/online-business/schedules/interactive-schedule.html');
                yield page.waitForNavigation();
                yield page.evaluate((from, to) => {
                    document.getElementById('schedules_interactive_f:hl21').value = `${from['name']} (${from['code']})`;
                    document.getElementById('schedules_interactive_f:hl21-location_businessLocationName').value = from['name'];
                    document.getElementById('schedules_interactive_f:hl21-location_businessLocode').value = from['code'];
                    document.getElementById('schedules_interactive_f:hl21-standardLocation_businessLocode').value = from['code'];
                    document.getElementById('schedules_interactive_f:hl56').value = `${to['name']} (${to['code']})`;
                    document.getElementById('schedules_interactive_f:hl56-location_businessLocationName').value = to['name'];
                    document.getElementById('schedules_interactive_f:hl56-location_businessLocode').value = to['code'];
                    document.getElementById('schedules_interactive_f:hl56-standardLocation_businessLocode').value = to['code'];
                    document.getElementById('schedules_interactive_f:hl105').click();
                }, from, to);
                // await page.goto(porttoporturl + `?sn=&sl=${from}&sp=&en=&el=${to}&ep=&exportHaulage=MH&importHaulage=MH&departureDate=${startDate}&weeksAfterStart=${range}&reefer=N`);
                yield page.waitForNavigation();
                const bodyHtml = yield page.evaluate(() => {
                    return document.body.innerHTML;
                });
                const body = node_html_parser_1.parse(bodyHtml);
                if (body.text.indexOf('There is no routing') === -1 && body.text.indexOf('Unexpected error') === -1) {
                    //get master table
                    const table = body.querySelector('#schedules_interactive_f:hl124');
                    const rows = table.querySelector("tbody").querySelectorAll("tr");
                    //get Headers
                    let headers = table.querySelector("thead").querySelectorAll('span');
                    let etaIndex = headers.findIndex(x => x.text.indexOf('Port of Discharge') !== -1);
                    let etdIndex = headers.findIndex(x => x.text.indexOf('Port of Loading') !== -1);
                    let vesselIndex = headers.findIndex(x => x.text.indexOf('Vessels / Services') !== -1);
                    let rowNumber = -1;
                    for (let row of rows) {
                        rowNumber++;
                        let roueTemp = new scrapModel_1.Route();
                        //get Arrival (eta)
                        let etaCell = row.querySelectorAll('td')[etaIndex];
                        let arrivalText = etaCell.querySelector('span').innerHTML.split('<br />')[1];
                        let arrival = arrivalText;
                        //get Departure (etd)
                        let etdCell = row.querySelectorAll('td')[etdIndex];
                        let DepartureText = etdCell.querySelector('span').innerHTML.split('<br />')[1];
                        let Departure = DepartureText;
                        //service , vessel and Voyage
                        let serviceCell = row.querySelectorAll('td')[vesselIndex].querySelector('span').innerHTML;
                        let service = null;
                        let sRow = serviceCell.split('<br />')[0];
                        if (sRow.split('/').length > 2) {
                            if (sRow.indexOf('<a') !== -1) {
                                service = sRow.match(/\>(.*?)\</g)[0].replace(/\<|\>/g, '');
                            }
                            else {
                                service = sRow.split('/')[2].trim();
                            }
                        }
                        //get vessel
                        let vesel = serviceCell.split('<br />')[0].split('/')[0].trim();
                        //get Voyage
                        let voyage = serviceCell.split('<br />')[0].split('/')[1].trim();
                        // ts_port_name
                        //select current row 
                        yield page.evaluate((rowNumber) => {
                            let elem = document
                                .getElementById('schedules_interactive_f:hl124')
                                .getElementsByTagName('tbody')[0]
                                .getElementsByTagName('tr')[rowNumber]
                                .getElementsByClassName('hl-radio')[0];
                            elem.click();
                        }, rowNumber);
                        //click find button
                        yield page.evaluate(() => {
                            document.getElementById('schedules_interactive_f:hl124:hl153').click();
                        });
                        yield page.waitForNavigation();
                        //get routing detail table
                        const routingDetail = yield page.evaluate(() => {
                            return document.getElementById('schedules_interactive_f:hl164').innerHTML;
                        });
                        const routingDetailParse = node_html_parser_1.parse(routingDetail);
                        //find row for extra info
                        let detailRows = routingDetailParse.querySelector('tbody').querySelectorAll('tr');
                        let rowWithVoyage = [];
                        let indexVoage = [];
                        for (let i = 0; i < detailRows.length; i++) {
                            let detailVoyage = detailRows[i].querySelectorAll('td')[5].querySelector('span').text;
                            if (detailVoyage) {
                                indexVoage.push(i);
                                rowWithVoyage.push(detailRows[i]);
                            }
                        }
                        let vessel_2 = null;
                        let voyage_2 = null;
                        let toFrom = null;
                        if (rowWithVoyage.length > 1) {
                            toFrom = detailRows[1].querySelectorAll('td')[1].querySelector('span').text;
                            vessel_2 = detailRows[1].querySelectorAll('td')[4].querySelector('span').text;
                            voyage_2 = detailRows[1].querySelectorAll('td')[5].querySelector('span').text;
                        }
                        // travel to screen 4 o-<-<
                        yield page.evaluate((rowNumber) => {
                            let elem = document
                                .getElementById('schedules_interactive_f:hl164')
                                .getElementsByTagName('tbody')[0]
                                .getElementsByTagName('tr')[rowNumber]
                                .getElementsByClassName('hl-radio')[0];
                            elem.click();
                        }, indexVoage[0]);
                        yield page.evaluate(() => {
                            document.getElementById('schedules_interactive_f:hl164:hl192').click();
                        });
                        yield page.waitForNavigation();
                        yield page.evaluate(() => {
                            document.getElementById('schedules_interactive_f:hl40:hl54').click();
                        });
                        yield page.waitForNavigation();
                        let cutOff = null;
                        let vgmCutoff = null;
                        let from_sch_cfs = null;
                        let from_sch_si = null;
                        //find Table in screen 4
                        const lastTable = yield page.evaluate(() => {
                            return document.getElementById('schedules_interactive_f:hl201').innerHTML;
                        });
                        const parseLT = node_html_parser_1.parse(lastTable);
                        //find cut off table
                        const vcutOffTable = parseLT.querySelector('#schedules_interactive_f:hl232');
                        const cutOffDate = vcutOffTable.querySelector('#schedules_interactive_f:hl234').querySelectorAll('span');
                        const cutOffTime = vcutOffTable.querySelector('#schedules_interactive_f:hl260').querySelectorAll('span');
                        //find from_sch_cy (cutOff)
                        cutOff = `${cutOffDate[1].innerHTML} ${cutOffTime[1].innerHTML}`;
                        //find from_sch_cfs (lcl)
                        from_sch_cfs = `${cutOffDate[5].innerHTML} ${cutOffTime[5].innerHTML}`;
                        //find from_sch_vgm
                        vgmCutoff = `${cutOffDate[0].innerHTML} ${cutOffTime[0].innerHTML}`;
                        //find Document Closure table
                        const documentTable = parseLT.querySelector('#schedules_interactive_f:hl218');
                        const documentDate = documentTable.querySelector('#schedules_interactive_f:hl219').querySelectorAll('span');
                        const documentTime = documentTable.querySelector('#schedules_interactive_f:hl225').querySelectorAll('span');
                        //get from_sch_si
                        from_sch_si = `${documentDate[0]['innerHTML']} ${documentTime[0]['innerHTML']}`;
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
                        roueTemp.from_sch_cy = cutOff;
                        roueTemp.from_sch_cfs = from_sch_cfs;
                        roueTemp.from_sch_rece = null;
                        roueTemp.from_sch_si = from_sch_si;
                        roueTemp.from_sch_vgm = vgmCutoff;
                        roueTemp.vessel_2 = vessel_2;
                        roueTemp.voyage_2 = voyage_2;
                        roueTemp.ts_port_name = toFrom;
                        roueTemp.com_code = this.siteSettingGlobal['com_code'].trim();
                        roueTemp.DisableEnable = this.siteSettingGlobal['DisableEnable'];
                        roueTemp.subsidiary_id = this.siteSettingGlobal['Subsidiary_id'].trim();
                        roueTemp.masterSetting = id;
                        roueTemp.siteId = 7;
                        //!!!!
                        yield this.scrap.saveRoute(roueTemp);
                        globalSheduleList_1.GlobalSchedule.hapagScheduleCount++;
                        //dispose variables
                        roueTemp = null;
                        //back to previes page
                        yield page.goBack();
                        yield page.goBack();
                    }
                }
            }
            catch (e) {
                utilService_1.default.writeLog(e.message);
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
        return [year, month, day].join('-');
    }
    findCode(code) {
        return new Promise((resolve, reject) => {
            let url = `https://o-www.yangming.com/e-service/schedule/PointToPoint_LocList.ashx?q=${code.trim().toLowerCase()}&limit=99999&timestamp=${Date.now()}&p_Type=F&p_floc=`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('');
                    }
                    else {
                        let obj = JSON.parse(body);
                        if (obj.length !== 0) {
                            resolve({ code: obj[0]['LOC_CD'], name: obj[0]['LOC_NAME'].split(',')[0] });
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
    break(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }
}
exports.default = hapagScrapService;
//# sourceMappingURL=hapagScrapService.js.map