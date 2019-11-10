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
class yangMingScrapService {
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
        if (globalSheduleList_1.GlobalSchedule.yangMingSchedule) {
            globalSheduleList_1.GlobalSchedule.yangMingSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.aplSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            try {
                let siteSetting = yield this.scrap.loadSetting(8);
                if (!siteSetting[0]['DisableEnable']) {
                    return;
                }
                console.log(scheduleTime);
                console.log('yangming service call');
                globalSheduleList_1.GlobalSchedule.yangMingScheduleService = true;
                globalSheduleList_1.GlobalSchedule.yangMingScheduleCount = 0;
                //get all points
                //init scrap proccess
                let timeLength = siteSetting[0]['LenghtScrap'];
                let tempDate = new Date();
                if (timeLength >= 60) {
                    timeLength = 59;
                }
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
                            ptp['fromPortname'] = 'Hong Kong';
                            ptp['toPortname'] = 'Abu Dhabi';
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
                console.log('yang ming scrap problem!!! please check your log file');
                utilService_1.default.writeLog("yang ming:" + e);
            }
            finally {
                console.log('finish');
                globalSheduleList_1.GlobalSchedule.yangMingScheduleService = false;
            }
        }));
    }
    sendData(from, to, startDate, endDate, id, portsDetail) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch({
                headless: false
            });
            const page = yield browser.newPage();
            try {
                yield page.goto('https://o-www.yangming.com/e-service/schedule/PointToPoint.aspx');
                //ContentPlaceHolder1_txtFrom SHANGHAI, SH, China ContentPlaceHolder1_txtTo HONG KONG, Hong Kong ContentPlaceHolder1_hidTo HKHKG ContentPlaceHolder1_hidFrom shang
                const fromInputView = yield page.$("#ContentPlaceHolder1_txtFrom");
                yield fromInputView.evaluate((fromInput, from) => fromInput.value = from['LOC_NAME'], from);
                const toInputView = yield page.$("#ContentPlaceHolder1_txtTo");
                yield toInputView.evaluate((fromInput, to) => fromInput.value = to['LOC_NAME'], to);
                const fromInput = yield page.$("#ContentPlaceHolder1_hidFrom");
                yield fromInput.evaluate((fromInput, from) => fromInput.value = from['LOC_CD'], from);
                const toInputHide = yield page.$("#ContentPlaceHolder1_hidTo");
                yield toInputHide.evaluate((fromInput, to) => fromInput.value = to['LOC_CD'], to);
                const toInput = yield page.$("#ContentPlaceHolder1_hidTo_txt");
                yield toInput.evaluate((toInput, from) => toInput.value = from['LOC_NAME'], from);
                const endDateInput = yield page.$('#ContentPlaceHolder1_date_End');
                yield endDateInput.evaluate((input, date) => input.value = date, endDate);
                const button = yield page.$('#ContentPlaceHolder1_btnSearch0');
                yield button.evaluate(button => button.click());
                yield page.waitForNavigation();
                yield this.break(10000);
                let bodyHTML = yield page.evaluate(() => document.body.innerHTML);
                if (bodyHTML.indexOf('Sorry, no data could be found. For more information') === -1) {
                    const body = node_html_parser_1.parse(bodyHTML);
                    let ResTable = body.querySelector('#divCargoDateSchedule').querySelector('tbody').querySelectorAll('tr');
                    for (let i = 0; i < ResTable.length; i += 2) {
                        let roueTemp = new scrapModel_1.Route();
                        //get Arrival (eta)
                        let arrival = ResTable[i].querySelectorAll('td')[9].text;
                        //get Departure (etd)
                        let Departure = ResTable[i].querySelectorAll('td')[3].text;
                        //Voyage and service
                        let row = ResTable[i].querySelectorAll('td')[5].text;
                        let arr = row.split('-');
                        //get vessel 
                        let vesel = arr[0].trim();
                        //get Voyage
                        let voyage = arr.length > 1 ? arr[1].trim() : '';
                        //get service 
                        let service = ResTable[i].querySelectorAll('td')[4].text;
                        //get deatils
                        let detailTable = body.querySelector('#Schedule_Tr_sub_' + ((i / 2) + 1)).querySelector('tbody');
                        var ts_port_name = null;
                        var vessel_2 = null;
                        var voyage_2 = null;
                        //find index of details
                        let VeselMode = detailTable.querySelectorAll('tr').filter(x => x.text.indexOf('VESSEL') !== -1);
                        if (VeselMode.length > 1) {
                            ts_port_name = VeselMode[1].querySelectorAll('td')[1].text;
                            let d = VeselMode[1].querySelectorAll('td')[4].text.split('-');
                            vessel_2 = d[0].trim();
                            voyage_2 = d.length > 1 ? d[1].trim() : '-';
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
                        roueTemp.siteId = 8;
                        //!!!!
                        yield this.scrap.saveRoute(roueTemp);
                        globalSheduleList_1.GlobalSchedule.yangMingScheduleCount++;
                        // //dispose variables
                        roueTemp = null;
                        // await page.waitForNavigation();
                    }
                }
            }
            catch (e) {
                utilService_1.default.writeLog(e);
            }
            finally {
                yield browser.close();
                if (+this.siteSettingGlobal['FldbreakTime']) {
                    yield this.break(+this.siteSettingGlobal['FldbreakTime']);
                }
            }
        });
    }
    IsoTime(date) {
        var d = new Date(date), month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        return [year, month, day].join('/');
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
                            resolve(obj[0]);
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
    sleep(sec) {
        return new Promise((resolve) => {
            setTimeout(resolve, sec * 1000);
        });
    }
    break(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }
}
exports.default = yangMingScrapService;
//# sourceMappingURL=yangmingScrapService.js.map