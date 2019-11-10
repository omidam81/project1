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
            try {
                let siteSetting = yield this.scrap.loadSetting(1);
                if (!siteSetting[0]['DisableEnable']) {
                    return;
                }
                console.log(scheduleTime);
                console.log('service one-line call');
                globalSheduleList_1.GlobalSchedule.oneLineScheduleService = true;
                globalSheduleList_1.GlobalSchedule.oneLineScheduleCount = 0;
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
                                fromCode = (yield this.findOneLineCode(ptp['fromPortname'])) || 'noCode';
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
                                toCode = (yield this.findOneLineCode(ptp['toPortname'])) || 'noCode';
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
                console.log('oneline scrap problem!!! please check your log file');
                utilService_1.default.writeLog("oneline:" + e);
            }
            finally {
                console.log('finish');
                globalSheduleList_1.GlobalSchedule.oneLineScheduleService = false;
            }
        }));
    }
    sendData(from, to, start, end, id, portsDetail) {
        return new Promise((resolve, reject) => {
            let u = porttoporturl +
                `?f_cmd=3&por_cd=${from.trim()}&del_cd=${to.trim()}&rcv_term_cd=Y&de_term_cd=Y&frm_dt=${start}&to_dt=${end}&ts_ind=&skd_tp=L`;
            request(u, (err, res, body) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    utilService_1.default.writeLog(err);
                    resolve('ko');
                }
                else {
                    try {
                        if (res.statusCode === 200) {
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
                                    //!!!!
                                    yield this.scrap.saveRoute(roueTemp);
                                    globalSheduleList_1.GlobalSchedule.oneLineScheduleCount++;
                                    // //dispose variables
                                    roueTemp = null;
                                    tempVessel = null;
                                    tempVessel2 = null;
                                }
                                //dispose api result;
                                err = null;
                                body = null;
                                res = null;
                            }
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
                    }
                    finally {
                        if (+this.siteSettingGlobal['FldbreakTime']) {
                            yield this.break(+this.siteSettingGlobal['FldbreakTime']);
                        }
                        resolve('ok');
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
exports.default = oneLineService;
//# sourceMappingURL=onelineScrapService.js.map