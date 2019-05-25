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
const path = require("path");
const json2xml = require("json2xml");
const scrap_1 = require("../scraping/scrap");
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
    loadPortToPortSchedule() {
        return __awaiter(this, void 0, void 0, function* () {
            let res = [];
            let data = fs.readFileSync(path.resolve(__dirname, '../../ports.json'), 'utf8');
            //get all points
            let ports = JSON.parse(data)['list'];
            let i = 0;
            let ch = this.chunkArray(ports, 600);
            let obj = yield this.scrap.insertMasterRoute();
            let id = obj[0]['IDMasterRoute'];
            console.log(new Date());
            for (let i = 0; i < ports.length; i++) {
                for (let j = 0; j < ch.length; j++) {
                    let res = yield this.sendData(ports[i], ch[j]);
                    this.sendDataToDB(res, 4);
                }
                console.log(new Date());
                console.log(i);
            }
        });
    }
    sendDataToDB(data, id) {
        this.scrap.saveXML(id, json2xml(data));
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
    sendData(port, ports) {
        let rows = [];
        return new Promise((resolve, reject) => {
            let t = ports.length;
            for (let i = 0; i < ports.length; i++) {
                // for (let j = 0; j < ports.length; j++) {
                if (port === ports[i]['locCd']) {
                    continue;
                }
                let u = porttoporturl +
                    `?f_cmd=3&por_cd=${port['locCd']}&del_cd=${ports[i]['locCd']}&rcv_term_cd=Y&de_term_cd=Y&frm_dt=2019-05-17&to_dt=2019-06-18&ts_ind=D&skd_tp=L`;
                request(u, (err, res, body) => {
                    if (err) {
                        console.log(err);
                    }
                    try {
                        if (res.statusCode === 200) {
                            let obj = JSON.parse(res.body.replace('/\n/g', ''));
                            if (+obj['count'] !== 0) {
                                for (let l = 0; l < obj['count']; l++) {
                                    rows.push({
                                        row: {
                                            to: obj['list'][l]['n1stPodYdCd'],
                                            from: obj['list'][l]['polYdCd'],
                                            inlandTime: obj['list'][l]['inlandCct'],
                                            portTime: obj['list'][l]['cct'],
                                            depDate: obj['list'][l]['polEtdDt'],
                                            arrivalDate: obj['list'][l]['lstPodEtaDt'],
                                            vessel: obj['list'][l]['n1stVslNm'],
                                            ocean: obj['list'][l]['ocnTzDys'],
                                            total: obj['list'][l]['ttlTzDys']
                                        }
                                    });
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                    if (--t === 0) {
                        return resolve(rows);
                    }
                });
            }
        });
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