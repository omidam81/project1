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
const schedule = require("node-schedule");
const scrap_1 = require("../scraping/scrap");
const scrapModel_1 = require("../scraping/scrapModel");
const globalSheduleList_1 = require("./globalSheduleList");
const utilService_1 = require("./utilService");
const puppeteer = require("puppeteer");
const node_html_parser_1 = require("node-html-parser");
const porttoporturl = 'https://www.pilship.com/shared/ajax/';
const mainUrl = 'https://www.pilship.com/en-point2point-pil-pacific-international-lines/119.html';
const pilPorts = require('../../assets/pilPorts.json');
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
            let siteSetting = yield this.scrap.loadSetting(4);
            if (!siteSetting[0]['DisableEnable'] || globalSheduleList_1.GlobalSchedule.pilScheduleService) {
                return;
            }
            try {
                console.log(scheduleTime);
                console.log('service pil call');
                globalSheduleList_1.GlobalSchedule.pilScheduleService = true;
                globalSheduleList_1.GlobalSchedule.pilScheduleCount = 0;
                //get all points
                //init scrap proccess
                let timeLength = siteSetting[0]['LenghtScrap'];
                let endTime = Math.floor(timeLength / 7);
                if (endTime === 0)
                    endTime++;
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
                            let from = this.findCode(ptp['fromPortname']);
                            let to = this.findCode(ptp['toPortname']);
                            if (!from || !to) {
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
            }
            catch (e) {
                console.log('pil scrap problem!!! please check your log file');
                utilService_1.default.writeLog("pil:" + e);
            }
            finally {
                console.log('finish');
                globalSheduleList_1.GlobalSchedule.pilScheduleService = false;
            }
        }));
    }
    sendData(from, to, startDate, range, id, portsDetail) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch({});
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
                    if (body.indexOf('The requested URL was rejected') > -1) {
                        throw { message: "sleep system" };
                    }
                    const myObj = JSON.parse(body);
                    let parseHtml = node_html_parser_1.parse(myObj['data']['main']);
                    let schedules = parseHtml.querySelectorAll('ul');
                    for (let ul of schedules) {
                        let roueTemp = new scrapModel_1.Route();
                        //get Arrival (eta)
                        let arrival = this.changeDate(this.convertDate(ul.querySelectorAll('.arrival').pop().querySelector('b').text));
                        //get Departure (etd)
                        let Departure = this.changeDate(this.convertDate(ul.querySelector('.departure').querySelector('b').text));
                        //get vessel 
                        let vesel = ul.querySelector('.vessel').text;
                        //get Voyage
                        let voyage = ul.querySelector('.voyage').querySelector('span').text;
                        let tsPortName = null;
                        let vessel_2 = null;
                        let voyage_2 = null;
                        //check second voyage 
                        if (ul.querySelectorAll('.arrival').length > 1) {
                            //get port of lane (ts port name)
                            tsPortName = ul.querySelectorAll('.port-of-load')[1].text;
                            vessel_2 = ul.querySelectorAll('.vessel')[1].text;
                            voyage_2 = ul.querySelectorAll('.voyage')[1].querySelector('span').text;
                        }
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
                        roueTemp.vessel_2 = vessel_2;
                        roueTemp.voyage_2 = voyage_2;
                        roueTemp.ts_port_name = tsPortName;
                        roueTemp.com_code = this.siteSettingGlobal['com_code'].trim();
                        roueTemp.DisableEnable = this.siteSettingGlobal['DisableEnable'];
                        roueTemp.subsidiary_id = this.siteSettingGlobal['Subsidiary_id'].trim();
                        roueTemp.masterSetting = id;
                        roueTemp.siteId = 4;
                        //!!!!
                        yield this.scrap.saveRoute(roueTemp);
                        globalSheduleList_1.GlobalSchedule.pilScheduleCount++;
                        // //dispose variables
                        roueTemp = null;
                    }
                }
            }
            catch (e) {
                if (e.message.indexOf("sleep system") !== -1) {
                    console.log('Pil rejected request ,waiting ...');
                    yield this.sleep();
                    console.log('pil: start again!');
                }
                else {
                    utilService_1.default.writeLog(e.message);
                }
            }
            finally {
                yield page.close();
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
        try {
            let res = pilPorts.filter(x => x.name.trim().toLowerCase().indexOf(code.trim().toLowerCase()) !== -1);
            if (res.length > 0) {
                return res[0]['value'];
            }
            return '';
        }
        catch (_a) {
            return '';
        }
    }
    sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 300000);
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
}
exports.default = pilScrapService;
//# sourceMappingURL=pilScrapService.js.map