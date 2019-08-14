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
const schedule = require("node-schedule");
const scrap_1 = require("../scraping/scrap");
const scrapModel_1 = require("../scraping/scrapModel");
const globalSheduleList_1 = require("./globalSheduleList");
const utilService_1 = require("./utilService");
const porttoporturl = 'http://ecomm.one-line.com/ecom/CUP_HOM_3001GS.do';
class oneLineService {
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
            this.siteSettingGlobal = siteSetting[0];
            let cath = [];
            for (let i = 0; i < portToPortList.length; i++) {
                let from = cath.find(x => x.name === portToPortList[i]['fromPortname']);
                let to = cath.find(x => x.name === portToPortList[i]['toPortname']);
                let fromCode;
                let toCode;
                if (!from) {
                    fromCode = (yield this.findOneLineCode(portToPortList[i]['fromPortname'])) || 'noCode';
                    cath.push({
                        name: portToPortList[i]['fromPortname'],
                        code: fromCode
                    });
                }
                else {
                    fromCode = from['code'];
                }
                if (fromCode === 'noCode') {
                    continue;
                }
                if (!to) {
                    toCode = (yield this.findOneLineCode(portToPortList[i]['toPortname'])) || 'noCode';
                    cath.push({
                        name: portToPortList[i]['toPortname'],
                        code: toCode
                    });
                }
                else {
                    toCode = to['code'];
                }
                if (toCode === 'noCode') {
                    continue;
                }
                yield this.sendData(fromCode, toCode, startTime, endTime, id, portToPortList[i]);
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
    sendData(from, to, start, end, id, portsDetail) {
        let rows = [];
        return new Promise((resolve, reject) => {
            let u = porttoporturl +
                `?f_cmd=3&por_cd=${from.trim()}&del_cd=${to.trim()}&rcv_term_cd=Y&de_term_cd=Y&frm_dt=${start}&to_dt=${end}&ts_ind=&skd_tp=L`;
            request(u, (err, res, body) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    utilService_1.default.writeLog(err);
                }
                else {
                    try {
                        if (res.statusCode === 200) {
                            res.body = "application uploading !";
                            if (res.body.indexOf("application uploading !") !== -1) {
                                throw { message: "sleep system" };
                            }
                            let obj = JSON.parse(res.body.replace('/\n/g', ''));
                            if (+obj['count'] !== 0) {
                                for (let l = 0; l < obj['count']; l++) {
                                    let roueTemp = new scrapModel_1.Route();
                                    let route = obj['list'][l];
                                    roueTemp.to = route['n1stPodYdCd'];
                                    roueTemp.from = route['polYdCd'];
                                    roueTemp.inland = route['inlandCct'];
                                    roueTemp.portTime = route['cct'];
                                    roueTemp.depDate = route['polEtdDt'];
                                    roueTemp.arrivalDate = route['lstPodEtaDt'];
                                    roueTemp.vessel = route['n1stVslNm'];
                                    roueTemp.ocean = route['ocnTzDys'];
                                    roueTemp.total = route['ttlTzDys'];
                                    let tempVessel = route['n1stVslNm'].split(' ');
                                    let vesselCode = tempVessel[tempVessel.length - 1];
                                    let tempVessel2 = route['n2ndVslNm']
                                        ? route['n2ndVslNm'].split(' ')
                                        : ['', '', ''];
                                    let vesselCode2 = tempVessel2[tempVessel2.length - 1];
                                    roueTemp.from_port_id = portsDetail['fromPortcode'].trim();
                                    roueTemp.from_port_name = portsDetail['fromPortname'].trim();
                                    roueTemp.to_port_id = portsDetail['toPortcode'].trim();
                                    roueTemp.to_port_name = portsDetail['toPortname'].trim();
                                    roueTemp.etd = route['polEtdDt'];
                                    roueTemp.eta = route['lstPodEtaDt'];
                                    tempVessel.splice(-1, 1);
                                    roueTemp.vessel = tempVessel.join(' ');
                                    roueTemp.voyage = vesselCode;
                                    roueTemp.modify_date = new Date();
                                    roueTemp.imp_exp = 'E';
                                    roueTemp.service = route['n1stLaneCd'];
                                    roueTemp.from_sch_cy =
                                        route['inlandCct'];
                                    roueTemp.from_sch_cfs = null;
                                    roueTemp.from_sch_rece = null;
                                    roueTemp.from_sch_si = route['dct'];
                                    roueTemp.from_sch_vgm =
                                        route['vgmCct'];
                                    roueTemp.ts_port_name = route['n2ndVslNm'] ?
                                        route['n1stPodLocNm'] : null;
                                    tempVessel2.splice(-1, 1);
                                    roueTemp.vessel_2 = tempVessel2.join(' ');
                                    roueTemp.voyage_2 = vesselCode2;
                                    roueTemp.com_code = this.siteSettingGlobal['com_code'].trim();
                                    roueTemp.DisableEnable = this.siteSettingGlobal['DisableEnable'];
                                    roueTemp.subsidiary_id = this.siteSettingGlobal['Subsidiary_id'].trim();
                                    roueTemp.masterSetting = id;
                                    roueTemp.siteId = 1;
                                    yield this.scrap.saveRoute(roueTemp);
                                }
                            }
                            resolve('ok');
                        }
                    }
                    catch (e) {
                        if (e.message.indexOf("sleep system") !== -1) {
                            console.log('one-line is updating ,waiting ...');
                            yield this.sleep();
                            console.log('start again!');
                        }
                        else {
                            utilService_1.default.writeLog(e.message);
                        }
                        resolve('ko');
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
    findOneLineCode(code) {
        return new Promise((resolve, reject) => {
            let url = `http://ecomm.one-line.com/ecom/CUP_HOM_3000GS.do?f_cmd=123&loc_nm=${code.trim().toLowerCase()}&oriLocNm=${code.trim().toLowerCase()}`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('');
                    }
                    else {
                        let obj = JSON.parse(body);
                        if (obj['count'] !== "0") {
                            resolve(obj['list'][0]['locCd']);
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
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('ok');
            }, 900000);
        });
    }
}
exports.default = oneLineService;
//# sourceMappingURL=onelineScrapService.js.map