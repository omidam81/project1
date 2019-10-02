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
const porttoporturl = 'https://www.pilship.com/shared/ajax/';
const mainUrl = 'https://www.pilship.com/en-point2point-pil-pacific-international-lines/119.html';
class pilScrapService {
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
        if (globalSheduleList_1.GlobalSchedule.pilSchedule) {
            globalSheduleList_1.GlobalSchedule.pilSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.pilSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            console.log(scheduleTime);
            console.log('service pil call');
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
                        yield this.sendData(from, to, startTime, endTime, id, ptp);
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
            const browser = yield puppeteer.launch({
                headless: false
            });
            const page = yield browser.newPage();
            //port_origin port_destination
            //find from and to and assign then
            try {
                yield page.setRequestInterception(true);
                page.on('request', request => {
                    if (request.resourceType() === 'image')
                        request.abort();
                    else
                        request.continue();
                });
                let url = porttoporturl + `?fn=get_schedule_porttoport&port_origin=${from}&port_destination=${to}&date_start=${startDate}&date_duration=${range}`;
                yield page.goto(mainUrl);
                yield page.waitForNavigation();
                const response = yield page.goto(url);
                //check schedule is exist
                const isValue = yield page.evaluate(() => {
                    let index = document.body.innerHTML.indexOf('Try expanding the date range, or select another Port combination.');
                    return !(index > 0);
                });
                if (isValue) {
                    //get page data
                    const body = yield response.text();
                    const myObj = JSON.parse(body);
                    let parseHtml = node_html_parser_1.parse(myObj['data']['main']);
                    let schedules = parseHtml.querySelectorAll('ul');
                    for (let ul of schedules) {
                        let roueTemp = new scrapModel_1.Route();
                        //get Arrival (eta)
                        let arrival = this.convertDate(ul.querySelector('.arrival').querySelector('b').text);
                        //get Departure (etd)
                        let Departure = this.convertDate(ul.querySelector('.departure').querySelector('b').text);
                        //get vessel 
                        let vesel = ul.querySelector('.vessel').text;
                        //get Voyage
                        let voyage = ul.querySelector('.voyage').querySelector('span').text;
                        //get service 
                        const voyageCode = ul.querySelectorAll('.voyage-code')[1].querySelector('a');
                        let veselcodeText = voyageCode['attributes']['name'];
                        let veselcode = veselcodeText.split('::')[veselcodeText.split('::').length - 1];
                        const pageService = yield page.goto(`https://www.pilship.com/shared/ajax/?fn=get_voyage_info&voyage_code=${voyage}&vessel_code=${veselcode}&_=${(new Date()).getTime()}`);
                        const servicebody = yield pageService.text();
                        const serviceObj = JSON.parse(servicebody);
                        let serviceHtml = node_html_parser_1.parse(serviceObj['data']['main']);
                        let service = serviceHtml.querySelectorAll('b')[2]['innerHTML'];
                        //port cutoff and vga cutoff
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
                        roueTemp.vessel_2 = null;
                        roueTemp.voyage_2 = null;
                        roueTemp.ts_port_name = null;
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
    //shayan & omid
    convertDate(dateText) {
        const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let currentDate = new Date();
        let temp = dateText.split(',')[0];
        let myDate = temp.split(' ');
        let M = myDate[0];
        let D = myDate[1];
        let scheduleMonth = month.indexOf(M) + 1;
        let scheduleYear = currentDate.getMonth() + 1 > scheduleMonth ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
        return new Date(`${scheduleYear}/${scheduleMonth}/${D}`);
    }
}
exports.default = pilScrapService;
//# sourceMappingURL=pilScrapService.js.map