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
                if (!siteSetting[0]['DisableEnable']) {
                    return;
                }
                console.log(scheduleTime);
                console.log('service maersk call');
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
                            let from = cath.find(x => x.name === ptp['fromPortname']);
                            let to = cath.find(x => x.name === ptp['toPortname']);
                            let fromCode;
                            let toCode;
                            //check if this port not in my cache call api and get code 
                            if (!from) {
                                fromCode = await this.findOneLineCode(ptp['fromPortname']) || 'noCode'
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
                                toCode = await this.findOneLineCode(ptp['toPortname']) || 'noCode'
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
                            await this.sendData(
                                fromCode,
                                toCode,
                                startTime,
                                endTime,
                                id,
                                ptp
                            );
                        }
                        portToPortList = await this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                        if (!portToPortList[0]) {
                            break;
                        }
                    }

                }

                console.log('finish');
            }
        );
    }
    public sendData(from, to, startDate, NOW, id, portsDetail) {
        return new Promise((resolve, reject) => {
            //1PLJHUYRVY2ZD
            //2LMUYHDQXMRNJ

            //09B2WXKA3I3R3
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
                                            if(schedule['scheduleDetails'][0]['transport']['voyageNumber']){
                                                sc = schedule['scheduleDetails'][0]['fromLocation']['siteGeoId'];
                                            }else{
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
                                            const deadLines = await this.findDeadLine(JSON.stringify(finalP));
                                            if (deadLines) {
                                                const SINONAMS = deadLines[0].filter(x => x.deadlineKey === 'SINONAMS');
                                                if (SINONAMS.length > 0) {
                                                    roueTemp.from_sch_si = new Date(SINONAMS[0]['deadline']);
                                                }
                                                const cvr = deadLines[0].filter(x => x.deadlineKey === 'CY');
                                                if (cvr.length > 0 && schedule['scheduleDetails'][0]['transport']['voyageNumber'] !== null) {
                                                    roueTemp.from_sch_cy = new Date(cvr[0]['deadline']);
                                                }
                                                const vgmr = deadLines[0].filter(x => x.deadlineKey === 'VGM');
                                                if (vgmr.length > 0) {
                                                    roueTemp.from_sch_vgm = new Date(vgmr[0]['deadline']);
                                                }
                                            }
                                        }
                                        //check
                                        if (schedule['scheduleDetails'].length > 1) {
                                            roueTemp.ts_port_name = await this.getDeatilsGet(schedule['scheduleDetails'][1]['fromLocation']['siteGeoId']);
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
                                        await this.scrap.saveRoute(roueTemp);
                                        // //dispose variables
                                        roueTemp = null;
                                    }
                                }
                                //dispose api result;
                                err = null;
                                body = null;
                                res = null;
                            }
                            resolve('ok');
                        }
                    } catch (e) {
                        if (e.message.indexOf("sleep system") !== -1) {
                            console.log('one-line is updating ,waiting ...');
                            await this.sleep();
                            console.log('start again!');
                        } else {
                            util.writeLog(e.message);
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
}