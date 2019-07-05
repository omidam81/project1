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
const request = require("request");
const fs = require("fs");
const schedule = require("node-schedule");
const path = require("path");
const scrap_1 = require("../scraping/scrap");
const scrapModel_1 = require("../scraping/scrapModel");
const globalSheduleList_1 = require("./globalSheduleList");
const porturl = 'http://ecomm.one-line.com/ecom/CUP_HOM_3006GS.do';
const porttoporturl = 'http://ecomm.one-line.com/ecom/CUP_HOM_3001GS.do';
class oneLineService {
    constructor() {
        this.scrap = new scrap_1.default();
    }
    static loadports() {
        let data = fs.readFileSync(path.resolve(__dirname, '../../ports.json'), 'utf8');
        return JSON.parse(data)['list'];
    }
    loadPortToPortSchedule(scheduleTime) {
        let scheduleString;
        if (scheduleTime === -1) {
        }
        else {
            scheduleString = scheduleTime;
        }
        if (globalSheduleList_1.GlobalSchedule.oneLineSchedule) {
            globalSheduleList_1.GlobalSchedule.oneLineSchedule.cancel();
        }
        globalSheduleList_1.GlobalSchedule.oneLineSchedule = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
            console.log(scheduleTime);
            console.log('service one-line call');
            //get all points
            let siteSetting = yield this.scrap.loadSetting(1);
            let timeLength = siteSetting[0]['LenghtScrap'];
            let tempDate = new Date();
            let endTime = this.IsoTime(tempDate.setDate(tempDate.getDate() + timeLength));
            let startTime = this.IsoTime(new Date());
            let portToPortList = yield this.scrap.loadDetailSetting(1);
            let iso = new Date().toISOString().split('T')[0];
            let obj = yield this.scrap.insertMasterRoute(iso, 1);
            let id = obj[0]['PkMasterRoute'];
            console.log(new Date());
            for (let i = 0; i < portToPortList.length; i++) {
                yield this.sendData(this.findOneLineCode(portToPortList[i]['fromPortname']), this.findOneLineCode(portToPortList[i]['toPortname']), startTime, endTime, id);
            }
            console.log('finish');
        }));
    }
    chunkArray(myArray, chunk_size) {
        var index = 0;
        var arrayLength = myArray.length;
        var tempArray = [];
        for (index = 0; index < arrayLength; index += chunk_size) {
            let myChunk = myArray.slice(index, index + chunk_size);
            // Do something if you want with the group
            tempArray.push(myChunk);
        }
        return tempArray;
    }
    sendData(from, to, start, end, id) {
        let rows = [];
        return new Promise((resolve, reject) => {
            let u = porttoporturl +
                `?f_cmd=3&por_cd=${from.trim()}&del_cd=${to.trim()}&rcv_term_cd=Y&de_term_cd=Y&frm_dt=${start}&to_dt=${end}&ts_ind=D&skd_tp=L`;
            request(u, (err, res, body) => {
                if (err) {
                    console.log(err);
                }
                try {
                    if (res.statusCode === 200) {
                        let obj = JSON.parse(res.body.replace('/\n/g', ''));
                        if (+obj['count'] !== 0) {
                            for (let l = 0; l < obj['count']; l++) {
                                let roueTemp = new scrapModel_1.Route();
                                roueTemp.to = obj['list'][l]['n1stPodYdCd'];
                                roueTemp.from = obj['list'][l]['polYdCd'];
                                roueTemp.inland = obj['list'][l]['inlandCct'];
                                roueTemp.portTime = obj['list'][l]['cct'];
                                roueTemp.depDate = obj['list'][l]['polEtdDt'];
                                roueTemp.arrivalDate =
                                    obj['list'][l]['lstPodEtaDt'];
                                roueTemp.vessel = obj['list'][l]['n1stVslNm'];
                                roueTemp.ocean = obj['list'][l]['ocnTzDys'];
                                roueTemp.total = obj['list'][l]['ttlTzDys'];
                                roueTemp.subsidiary_id;
                                roueTemp.com_code;
                                roueTemp.from_port_id;
                                roueTemp.from_port_name;
                                roueTemp.to_port_id;
                                roueTemp.to_port_name;
                                roueTemp.etd;
                                roueTemp.eta;
                                roueTemp.voyage;
                                roueTemp.modify_date;
                                roueTemp.imp_exp;
                                roueTemp.service;
                                roueTemp.from_sch_cy;
                                roueTemp.from_sch_cfs;
                                roueTemp.from_sch_rece;
                                roueTemp.from_sch_si;
                                roueTemp.from_sch_vgm;
                                roueTemp.ts_port_name;
                                roueTemp.vessel_2;
                                roueTemp.voyage_2;
                                roueTemp.DisableEnable;
                                roueTemp.siteId = id;
                                this.scrap.saveRoute(roueTemp);
                            }
                        }
                        resolve('ok');
                    }
                }
                catch (e) {
                    console.log(e);
                    reject('ko');
                }
            });
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
    findOneLineCode(code) {
        let data = fs.readFileSync(path.resolve(__dirname, '../../ports.json'), 'utf8');
        let array = JSON.parse(data);
        let list = array['list'];
        let temp = list.find(x => x['locNm'].toLowerCase().startsWith(code.trim().toLowerCase()));
        if (temp) {
            return temp['locCd'];
        }
        else {
            return '';
        }
    }
}
exports.default = oneLineService;
// let driver = new Builder().forBrowser('chrome').build();
// driver.get(pointUrl);
// driver
//     .findElement(By.id('btnSearch'))
//     .click()
//     .then()
//     .catch(err => {
//         console.log(err);
//     });
// (async function example() {
//     let driver = await new Builder().forBrowser('firefox').build();
//     try {
//         await driver.get('http://www.google.com/ncr');
//         await driver
//             .findElement(By.name('q'))
//             .sendKeys('webdriver', Key.RETURN);
//         await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
//         await driver.findElement(By.name('btnK')).click();
//     } finally {
//         await driver.quit();
//     }
// })();
//# sourceMappingURL=onelineScrapService.js.map