//import depemdencyes
import * as request from 'request';
import * as schedule from 'node-schedule';
import Scrap from '../scraping/scrap';
import { Route } from '../scraping/scrapModel';
import { GlobalSchedule } from './globalSheduleList';
import util from './utilService';
import * as puppeteer from 'puppeteer';
const porttoporturl = 'https://api.maersk.com/oceanProducts/maeu/futureschedules';
const pageUrl = 'https://www.maersk.com/schedules/#';
export default class maeskScrapService {
    publicCode;
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
        if (GlobalSchedule.maerskSchedule) {
            GlobalSchedule.maerskSchedule.cancel();
        }
        GlobalSchedule.maerskSchedule = schedule.scheduleJob(
            scheduleTime,
            async () => {
                let siteSetting = await this.scrap.loadSetting(3);
                if (!siteSetting[0]['DisableEnable'] || GlobalSchedule.maerskScheduleService) {
                    return;
                }
                try {

                    console.log(scheduleTime);
                    console.log('service maersk call');
                    GlobalSchedule.maerskScheduleService = true;
                    GlobalSchedule.maerskScheduleCount = 0;
                    //get all points
                    //init scrap proccess

                    let timeLength = siteSetting[0]['LenghtScrap'];
                    let tempDate = new Date();
                    let endTime = Math.floor(timeLength / 7);
                    if (endTime === 0)
                        endTime++;
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
                                if (GlobalSchedule.maerskstopFlag) {
                                    console.log('User Paused maersk Service');
                                    await this.PauseService();
                                    console.log('User start maersk Service agian');
                                }
                                let from = cath.find(x => x.name === ptp['fromPortname']);
                                let to = cath.find(x => x.name === ptp['toPortname']);
                                let fromCode;
                                let toCode;
                                //check if this port not in my cache call api and get code 
                                if (!from) {
                                    let temp = await Promise.race([this.findOneLineCode(ptp['fromPortname']), this.setTimeOut(30)]);
                                    if (temp == "i") {
                                        if (GlobalSchedule.maerskshowLog) {
                                            console.log('\x1b[31m', 'maersk:find Port Code', 'fail');
                                        }
                                        temp = 'noCode';
                                        GlobalSchedule.maerskerr++;
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
                                        if (GlobalSchedule.maerskshowLog) {
                                            console.log('\x1b[31m', 'maersk:find Port Code', 'fail');
                                        }
                                        temp = 'noCode';
                                        GlobalSchedule.maerskerr++;
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
                                    if (GlobalSchedule.maerskshowLog) {
                                        console.log('\x1b[31m', 'scrap Data', 'fail');
                                    }
                                    GlobalSchedule.maerskerr++;
                                }
                            }
                            portToPortList = await this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                            if (!portToPortList[0]) {
                                break;
                            }
                        }

                    }
                }
                catch (e) {
                    console.log('maersk scrap problem!!! please check your log file');
                    util.writeLog("maersk:" + e);
                }
                finally {
                    console.log('maersk: finish');
                    GlobalSchedule.maerskScheduleService = false;
                }

            }
        );
    }
    public sendData(from, to, startDate, NOW, id, portsDetail) {
        return new Promise((resolve, reject) => {
            let u =
                porttoporturl +
                `?from=${from}&to=${to}&cargoType=DRY&containerTypeName=40%27+Dry+Standard&containerType=DRY&containerLength=40&containerIsoCode=42G1&containerTempControl=false&fromServiceMode=CY&toServiceMode=CY&numberOfWeeks=${NOW}&dateType=D&date=${startDate}&vesselFlag=&vesselFlagName=&originServiceMode=CY&destinationServiceMode=SD`;
            request(u, async (err, res, body) => {
                if (err) {
                    util.writeLog(err);
                    resolve('ko');
                } else {
                    try {
                        if (res.statusCode === 200) {
                            let obj = JSON.parse(res.body.replace('/\n/g', ''));
                            let products = obj['products'];
                            if (products.length !== 0) {
                                for (let p = 0; p < products.length; p++) {
                                    let schedules = products[p]['schedules'];
                                    for (let l = 0; l < schedules.length; l++) {
                                        let schedule = schedules[l];
                                        let roueTemp = new Route();
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
                                        //Departure Date
                                        roueTemp.etd = schedule['fromLocation']['date'];
                                        //Arrival Date
                                        roueTemp.eta = schedule['toLocation']['date'];
                                        //
                                        roueTemp.vessel = schedule['vessel']['name'];
                                        roueTemp.voyage = schedule['scheduleDetails'][0]['transport']['voyageNumber'];
                                        roueTemp.modify_date = new Date();
                                        roueTemp.imp_exp = 'E';
                                        roueTemp.service = schedule['scheduleDetails'][0]['serviceName'];
                                        roueTemp.from_sch_cy = null;
                                        roueTemp.from_sch_cfs = null;
                                        roueTemp.from_sch_rece = null;
                                        roueTemp.from_sch_si = null;
                                        roueTemp.from_sch_vgm = null;
                                        roueTemp.ts_port_name = null;
                                        roueTemp.vessel_2 = null;
                                        roueTemp.voyage_2 = null;
                                        //find DeadLines
                                        //create params
                                        if (schedule['scheduleDetails'].length > 0) {
                                            let sc = null;
                                            const vC = schedule['vessel']['code'];
                                            const vN = schedule['scheduleDetails'][0]['transport']['voyageNumber'] || schedule['scheduleDetails'][1]['transport']['voyageNumber'];
                                            if (schedule['scheduleDetails'][0]['transport']['voyageNumber']) {
                                                sc = schedule['scheduleDetails'][0]['fromLocation']['siteGeoId'];
                                            } else {
                                                sc = schedule['scheduleDetails'][0]['toLocation']['siteGeoId'];
                                            }
                                            let params = [];
                                            params.push({
                                                sC: sc,
                                                vC: vC,
                                                vN: vN,
                                                "cargoType": "CY",
                                                "serviceMode": "DRY"
                                            })
                                            let finalP = { params: params };
                                            let temp = await Promise.race([this.findDeadLine(JSON.stringify(finalP)), this.setTimeOut(30)]);
                                            if (temp == "i") {
                                                if (GlobalSchedule.maerskshowLog) {
                                                    console.log('\x1b[31m', 'maersk:find deadLine', 'fail');
                                                }
                                                temp = [];
                                                GlobalSchedule.maerskerr++;
                                            }
                                            const deadLines: any = temp;
                                            if (deadLines.length > 0) {
                                                const SINONAMS = deadLines[0].filter(x => x.deadlineKey === 'SINONAMS');
                                                if (SINONAMS.length > 0) {
                                                    roueTemp.from_sch_si = this.changeDate(new Date(SINONAMS[0]['deadline']));
                                                }
                                                const cvr = deadLines[0].filter(x => x.deadlineKey === 'CY');
                                                if (cvr.length > 0 && schedule['scheduleDetails'][0]['transport']['voyageNumber'] !== null) {
                                                    roueTemp.from_sch_cy = this.changeDate(new Date(cvr[0]['deadline']));
                                                }
                                                const vgmr = deadLines[0].filter(x => x.deadlineKey === 'VGM');
                                                if (vgmr.length > 0) {
                                                    roueTemp.from_sch_vgm = this.changeDate(new Date(vgmr[0]['deadline']));
                                                }
                                            }
                                        }
                                        //check
                                        if (schedule['scheduleDetails'].length > 1) {
                                            let temp = await Promise.race([this.getDeatilsGet(schedule['scheduleDetails'][1]['fromLocation']['siteGeoId']), this.setTimeOut(30)]);
                                            if (temp == "i") {
                                                if (GlobalSchedule.maerskshowLog) {
                                                    console.log('\x1b[31m', 'maersk:find deadLine', 'fail');
                                                }
                                                temp = '';
                                                GlobalSchedule.maerskerr++;
                                            }
                                            roueTemp.ts_port_name = temp;
                                            roueTemp.vessel_2 = schedule['scheduleDetails'][1]['transport']['vessel']['name'];
                                            roueTemp.voyage_2 = schedule['scheduleDetails'][1]['transport']['voyageNumber'];
                                        }

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
                                        roueTemp.siteId = 3;
                                        //!!!!
                                        try {
                                            await this.scrap.saveRoute(roueTemp);
                                            if (GlobalSchedule.maerskshowLog) {
                                                console.log('maersk:Save in db');
                                            }
                                            GlobalSchedule.maerskScheduleCount++;
                                        } catch (e) {
                                            util.writeLog('DataBase error:' + e.message);
                                            console.log('DataBase error:', e.message);
                                        }

                                        // //dispose variables
                                        roueTemp = null;
                                    }
                                }
                                //dispose api result;
                                err = null;
                                body = null;
                                res = null;
                            }

                        }
                    } catch (e) {
                        util.writeLog(e.message);

                    }
                    finally {
                        if (+this.siteSettingGlobal['FldbreakTime']) {
                            await this.break(+this.siteSettingGlobal['FldbreakTime']);
                        }
                        resolve('ko');
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
            if (GlobalSchedule.maerskshowLog) {
                console.log('maersk:find code', 'start');
            }
            this.publicCode = code;
            let two = code.trim().substring(0, 2);
            let url = `https://api.maerskline.com/maeu/locations/cities?cityprefix=${two}`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('')
                    } else {
                        let obj = JSON.parse(body);
                        if (obj['cities'].length !== 0) {
                            let finalArray = obj['cities'].filter(x => x.displayName.toLowerCase().indexOf(code.trim().toLowerCase()) !== -1);
                            resolve(finalArray[0]['geoId'])
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
    public getDeatilsGet(code) {
        return new Promise((resolve, reject) => {
            let url = `https://api.maerskline.com/maeu/locations/details/${code}`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('')
                    } else {
                        let obj = JSON.parse(body);
                        resolve(obj['cityName'] || '')
                    }
                } catch (e) {
                    resolve('')
                }
            })
        })
    }
    public findDeadLine(params) {
        return new Promise((resolve, reject) => {
            var options = {
                method: 'POST',
                url: 'https://schedule.api.maersk.com/maeu/deadlines',
                headers:
                    { Host: 'schedule.api.maersk.com' },
                body: params
            }
            request(options, function (error, response, body) {
                try {
                    if (error) {
                        resolve('');
                    } else {
                        resolve(JSON.parse(body))
                    }
                } catch{
                    resolve('');
                }

            });
        })

    }
    public changeDate(date: Date) {
        try {
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            let h: any = date.getHours();
            let m: any = date.getMinutes();
            if (h < 10) {
                h = "0" + h.toString();
            }
            if (m < 10) {
                m = "0" + m.toString();
            }
            return `${year}/${month}/${day} ${h}:${m}`
        } catch{
            return null;
        }

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
            while (GlobalSchedule.maerskstopFlag) {
                await this.setTimeOut(1);
            }
            resolve('');
        })

    }
}