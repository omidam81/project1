import * as request from 'request';
import * as schedule from 'node-schedule';
import Scrap from '../scraping/scrap';
import { Route } from '../scraping/scrapModel';
import { GlobalSchedule } from './globalSheduleList';
import util from './utilService';
const porttoporturl = 'http://ecomm.one-line.com/ecom/CUP_HOM_3001GS.do';

export default class oneLineService {
    scrap;
    siteSettingGlobal;
    constructor() {
        this.scrap = new Scrap();
    }
    public loadPortToPortSchedule(scheduleTime) {
        let scheduleString;
        if (scheduleTime === -1) {
        } else {
            scheduleString = scheduleTime;
        }
        if (GlobalSchedule.oneLineSchedule) {
            GlobalSchedule.oneLineSchedule.cancel();
        }
        GlobalSchedule.oneLineSchedule = schedule.scheduleJob(
            scheduleTime,
            async () => {
                let siteSetting = await this.scrap.loadSetting(1);
                if (!siteSetting[0]['DisableEnable'] || GlobalSchedule.oneLineScheduleService) {
                    return;
                }
                try {

                    console.log(scheduleTime);
                    console.log('service one-line call');
                    GlobalSchedule.oneLineScheduleService = true;
                    GlobalSchedule.oneLineScheduleCount = 0;
                    //get all points
                    //init scrap proccess
                    let timeLength = siteSetting[0]['LenghtScrap'];
                    let tempDate = new Date();
                    let endTime = this.IsoTime(
                        tempDate.setDate(tempDate.getDate() + timeLength)
                    );
                    let startTime = this.IsoTime(new Date());
                    let iso = new Date().toISOString().split('T')[0];
                    let obj = await this.scrap.insertMasterRoute(iso, 1);
                    let id = obj[0]['PkMasterRoute'];
                    console.log(new Date());
                    this.siteSettingGlobal = siteSetting[0];
                    let cath = [];
                    //load  first 1000 ptp
                    let portToPortList = await this.scrap.loadDetailSetting(1, 0);
                    if (portToPortList[0]) {
                        while (true) {
                            for (let ptp of portToPortList) {
                                if (GlobalSchedule.oneLinestopFlag) {
                                    console.log('User stop oneLine Service');
                                    await this.PauseService();
                                    console.log('User start oneLine Service agian');
                                }
                                let from = cath.find(x => x.name === ptp['fromPortname']);
                                let to = cath.find(x => x.name === ptp['toPortname']);
                                let fromCode;
                                let toCode;
                                //check if this port not in my cache call api and get code 
                                if (!from) {
                                    let temp = await Promise.race([this.findOneLineCode(ptp['fromPortname']), this.setTimeOut(30)]);
                                    if (temp == "i") {
                                        if (GlobalSchedule.oneLineshowLog) {
                                            console.log('\x1b[31m', 'oneline:find Port Code', 'fail');
                                        }
                                        temp = 'noCode';
                                        GlobalSchedule.oneLineerr++;
                                    }
                                    fromCode = temp || 'noCode';
                                    cath.push({
                                        name: ptp['fromPortname'],
                                        code: fromCode
                                    })
                                } else {
                                    if (from['code'] === 'noCode') {
                                        continue;
                                    }
                                    fromCode = from['code'];
                                }
                                if (!to) {
                                    let temp = await Promise.race([this.findOneLineCode(ptp['toPortname']), this.setTimeOut(30)]);
                                    if (temp == "i") {
                                        if (GlobalSchedule.oneLineshowLog) {
                                            console.log('\x1b[31m', 'oneline:find Port Code', 'fail');
                                        }
                                        temp = 'noCode';
                                        GlobalSchedule.oneLineerr++;
                                    }
                                    toCode = temp || 'noCode';
                                    cath.push({
                                        name: ptp['toPortname'],
                                        code: toCode
                                    })
                                } else {
                                    if (to['code'] === 'noCode') {
                                        continue;
                                    }
                                    toCode = to['code'];
                                }
                                if (toCode === 'noCode' || fromCode === 'noCode') {
                                    continue
                                }
                                let temp = await Promise.race([this.sendData(
                                    fromCode,
                                    toCode,
                                    startTime,
                                    endTime,
                                    id,
                                    ptp
                                ), this.setTimeOut(120)]);
                                if (temp == "i") {
                                    if (GlobalSchedule.oneLineshowLog) {
                                        console.log('\x1b[31m', 'oneline:find Scrap Data', 'fail');
                                    }
                                    GlobalSchedule.oneLineerr++;
                                }
                            }
                            portToPortList = await this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                            if (!portToPortList[0]) {
                                break;
                            }
                        }

                    }


                } catch (e) {
                    console.log('oneline scrap problem!!! please check your log file');
                    util.writeLog("oneline:" + e);
                } finally {
                    console.log('oneline: finish');
                    GlobalSchedule.oneLineScheduleService = false;
                }

            }
        );
    }
    public sendData(from, to, start, end, id, portsDetail) {
        return new Promise((resolve, reject) => {
            let u =
                porttoporturl +
                `?f_cmd=3&por_cd=${from.trim()}&del_cd=${to.trim()}&rcv_term_cd=Y&de_term_cd=Y&frm_dt=${start}&to_dt=${end}&ts_ind=&skd_tp=L`;
            request(u, async (err, res, body) => {
                if (err) {
                    util.writeLog(err);
                    resolve('ko');
                } else {
                    try {
                        if (res.statusCode === 200) {
                            if (res.body.indexOf("application uploading !") !== -1) {
                                throw { message: "sleep system" };
                            }
                            let obj = JSON.parse(res.body.replace('/\n/g', ''));
                            if (+obj['count'] !== 0) {
                                for (let l = 0; l < obj['count']; l++) {
                                    let roueTemp = new Route();
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
                                    let vesselCode2 =
                                        tempVessel2[tempVessel2.length - 1];
                                    roueTemp.from_port_id = portsDetail[
                                        'fromPortcode'
                                    ].trim();
                                    roueTemp.from_port_name = portsDetail[
                                        'fromPortname'
                                    ].trim();
                                    roueTemp.to_port_id = portsDetail[
                                        'toPortcode'
                                    ].trim();
                                    roueTemp.to_port_name = portsDetail[
                                        'toPortname'
                                    ].trim();
                                    roueTemp.etd = route['polEtdDt'];
                                    roueTemp.eta = route['lstPodEtaDt'];
                                    tempVessel.splice(-1, 1)
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
                                    tempVessel2.splice(-1, 1)
                                    roueTemp.vessel_2 = tempVessel2.join(' ');
                                    roueTemp.voyage_2 = vesselCode2;
                                    roueTemp.com_code = this.siteSettingGlobal[
                                        'com_code'
                                    ].trim();
                                    roueTemp.DisableEnable = this.siteSettingGlobal[
                                        'DisableEnable'
                                    ];
                                    roueTemp.subsidiary_id = this.siteSettingGlobal[
                                        'Subsidiary_id'
                                    ].trim();
                                    roueTemp.masterSetting = id;
                                    roueTemp.siteId = 1;
                                    //!!!!
                                    try {
                                        await this.scrap.saveRoute(roueTemp);
                                        if (GlobalSchedule.oneLineshowLog) {
                                            console.log('oneline:Save in db');
                                        }
                                        GlobalSchedule.oneLineScheduleCount++;
                                    } catch (e) {
                                        util.writeLog('DataBase error:' + e.message);
                                        console.log('DataBase error:', e.message);
                                    }

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
                    } catch (e) {
                        if (e.message.indexOf("sleep system") !== -1) {
                            console.log('one-line is updating ,waiting ...');
                            await this.sleep();
                            console.log('oneLine : start again!');
                        } else {
                            util.writeLog(e.message);
                        }


                    }
                    finally {
                        if (+this.siteSettingGlobal['FldbreakTime']) {
                            await this.break(+this.siteSettingGlobal['FldbreakTime']);
                        }
                        resolve('ok');
                    }
                }

            });
        });
    }
    public IsoTime(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }
    public findOneLineCode(code) {
        return new Promise((resolve, reject) => {
            if (GlobalSchedule.oneLineshowLog) {
                console.log('oneline:find code', 'start');
            }
            let url = `http://ecomm.one-line.com/ecom/CUP_HOM_3000GS.do?f_cmd=123&loc_nm=${code.trim().toLowerCase()}&oriLocNm=${code.trim().toLowerCase()}`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('')
                    } else {
                        let obj = JSON.parse(body);
                        if (obj['count'] !== "0") {
                            resolve(obj['list'][0]['locCd'])
                        }
                        else {
                            resolve('')
                        }
                    }
                } catch (e) {
                    resolve('')
                }
            })
        })

    }
    public sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000)
        })
    }
    public break(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        })
    }
    public setTimeOut(s) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('i');
            }, s * 1000);
        })
    }
    public PauseService() {
        return new Promise(async (resolve) => {
            while (GlobalSchedule.oneLinestopFlag) {
                await this.setTimeOut(1);
            }
            resolve('');
        })

    }
}