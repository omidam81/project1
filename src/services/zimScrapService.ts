//import depemdencyes
import * as request from 'request';
import * as schedule from 'node-schedule';
import Scrap from '../scraping/scrap';
import { Route } from '../scraping/scrapModel';
import { GlobalSchedule } from './globalSheduleList';
import util from './utilService';
import { parse } from 'node-html-parser';
const porttoporturl = 'https://www.zim.com/schedules/point-to-point';

export default class zimScrapService {
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
        if (GlobalSchedule.zimSchedule) {
            GlobalSchedule.zimSchedule.cancel();
        }
        GlobalSchedule.zimSchedule = schedule.scheduleJob(
            scheduleTime,
            async () => {
                let siteSetting = await this.scrap.loadSetting(5);
                if (!siteSetting[0]['DisableEnable'] || GlobalSchedule.zimScheduleService) {
                    return;
                }
                try {
                    GlobalSchedule.zimstopFlag = false;
                    console.log('service zim call');
                    GlobalSchedule.zimScheduleService = true;
                    GlobalSchedule.zimScheduleCount = 0;
                    //get all points
                    //init scrap proccess
                    let timeLength = siteSetting[0]['LenghtScrap'];
                    let endTime = Math.floor(timeLength / 7);
                    if (endTime === 0)
                        endTime = endTime + 1;
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
                                if (GlobalSchedule.zimstopFlag) {
                                    console.log('User stop zim Service');
                                    await this.PauseService();
                                    console.log('User start zim Service agian');
                                }
                                let from = cath.find(x => x.name === ptp['fromPortname']);
                                let to = cath.find(x => x.name === ptp['toPortname']);
                                let fromCode;
                                let toCode;
                                //check if this port not in my cache call api and get code 
                                if (!from) {
                                    let temp = await Promise.race([this.findCode(ptp['fromPortname']), this.setTimeOut(30)]) || 'noCode'
                                    if (temp == "i") {
                                        if (GlobalSchedule.zimshowLog) {
                                            console.log('\x1b[31m', 'zim:find Port Code', 'fail');
                                        }
                                        temp = 'noCode';
                                        GlobalSchedule.zimerr++;
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
                                    let temp = await Promise.race([this.findCode(ptp['toPortname']), this.setTimeOut(30)]) || 'noCode';
                                    if (temp == "i") {
                                        if (GlobalSchedule.zimshowLog) {
                                            console.log('\x1b[31m', 'zim:find Port Code', 'fail');
                                        }
                                        temp = 'noCode';
                                        GlobalSchedule.zimerr++;
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
                                if (GlobalSchedule.zimshowLog) {
                                    console.log('zim:find number of page zim', 'start');
                                }
                                let pageNum: any = await Promise.race([this.findPageNumber(fromCode, toCode, endTime), this.setTimeOut(30)]);
                                if (pageNum == "i") {
                                    if (GlobalSchedule.zimshowLog) {
                                        console.log('"\x1b[31m"', 'zim:find number of page zim', 'fail');
                                    }
                                    pageNum = 0;
                                    GlobalSchedule.zimerr++;
                                }
                                for (let p = 0; p < pageNum; p++) {
                                    if (GlobalSchedule.zimshowLog) {
                                        console.log('zim:scrap data', 'start');
                                    }
                                    let temp = await Promise.race([this.sendData(
                                        fromCode,
                                        toCode,
                                        endTime,
                                        id,
                                        ptp,
                                        p + 1
                                    ), this.setTimeOut(120)]);
                                    if (temp == "i") {
                                        if (GlobalSchedule.zimshowLog) {
                                            console.log('"\x1b[31m"', 'zim:scrap data', 'fail');
                                        }
                                        GlobalSchedule.zimerr++;
                                    }
                                }

                            }
                            portToPortList = await this.scrap.loadDetailSetting(1, portToPortList[portToPortList.length - 1]['FldPkDetailsSetting']);
                            if (!portToPortList[0]) {
                                break;
                            }
                        }

                    }


                } catch (e) {
                    console.log('zim scrap problem!!! please check your log file');
                    util.writeLog("zim:" + e);
                }
                finally {
                    console.log('zim: finish');
                    GlobalSchedule.zimScheduleService = false;
                    GlobalSchedule.zimstopFlag = false;
                }
            }
        );
    }
    public sendData(from, to, NOW, id, portsDetail, page) {
        return new Promise((resolve, reject) => {
            let u =
                porttoporturl +
                `?portcode=${from}&portdestinationcode=${to}&fromdate=today&weeksahead=${NOW}&direction=True&page=${page}`;
            request(u, async (err, res, body) => {
                if (err) {
                    util.writeLog(err);
                    resolve('ko');
                } else {
                    try {
                        if (res.statusCode === 200) {
                            const bodyHtml: any = parse(body);
                            let valid = bodyHtml.innerHTML.indexOf('The information you requested is currently unavailable') === -1;
                            if (valid) {
                                let tempTable = bodyHtml.querySelector('#table-grid-mvc');
                                let rows = tempTable.querySelector('tbody').querySelectorAll('tr');
                                let currentClass = 'start';
                                let groupNumber = -1;
                                let finalGroup = [];
                                for (let row of rows) {
                                    if (row.classNames[0] !== currentClass) {
                                        groupNumber++;
                                        currentClass = row.classNames[0];
                                        finalGroup.push({
                                            g: []
                                        });
                                    }
                                    finalGroup[groupNumber]['g'].push(row);
                                }
                                for (let group of finalGroup) {
                                    try {
                                        let roueTemp = new Route();

                                        //get Arrival (eta)
                                        let ArrivalRow = group.g[group.g.length - 1];
                                        let ArrivalDates = ArrivalRow.querySelectorAll('td')[2].querySelector('p').text.replace(',', '');
                                        let arrival = this.changeDate(new Date(ArrivalDates));
                                        //get Departure (etd)
                                        let DepartureRow = group.g[0];
                                        let DepartureDates = DepartureRow.querySelectorAll('td')[1].querySelector('p').text.replace(',', '');
                                        let Departure = this.changeDate(new Date(DepartureDates));
                                        //service , vessel 
                                        let vesselRow = group.g[0];
                                        let vesselData = vesselRow.querySelectorAll('td')[0].querySelector('a').text;
                                        //get vessel 
                                        let vesel = vesselData.split('(')[0].trim()
                                        //get Voyage
                                        let voyage = vesselData.split('/')[1].trim();
                                        //get service 
                                        let serviceRow = group.g[0];
                                        let serviceData = serviceRow.querySelectorAll('td')[3].querySelector('a');
                                        let service = null;
                                        if (serviceData) {
                                            service = serviceData.text.match(/\((.*)\)/).pop();
                                        }
                                        //get to/from (ts_port_name) 
                                        let toFrom = null;
                                        let vessel_2 = null;
                                        let voyage_2 = null;
                                        if (group.g.length > 1) {
                                            let toFromRow = group.g[1];
                                            toFrom = toFromRow.querySelectorAll('td')[1].querySelectorAll('p')[1].text;
                                            //service , vessel 
                                            let vesselRow2 = group.g[1];
                                            let vesselData2 = vesselRow2.querySelectorAll('td')[0].querySelector('a').text;
                                            //get vessel 
                                            vessel_2 = vesselData2.split('(')[0].trim()
                                            //get Voyage
                                            voyage_2 = vesselData2.split('/')[1].trim();

                                        }

                                        //fill data
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
                                        roueTemp.ts_port_name = toFrom;
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
                                        roueTemp.siteId = 5;
                                        //!!!!
                                        try {
                                            await this.scrap.saveRoute(roueTemp);
                                            if (GlobalSchedule.zimshowLog) {
                                                console.log('zim:save in db');
                                            }
                                            GlobalSchedule.zimScheduleCount++;
                                        } catch (e) {
                                            util.writeLog('DataBase error:' + e.message);
                                            console.log('DataBase error:', e.message);
                                        }
                                        // //dispose variables

                                        roueTemp = null;
                                    } catch (e) {
                                        util.writeLog('error:' + e.message);
                                        console.log('smoolty error zim', e.message);
                                        continue;
                                    }
                                }

                            }

                        }

                    } catch (e) {
                        util.writeLog(e.message);
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
    public findCode(code) {
        return new Promise((resolve, reject) => {
            if (GlobalSchedule.zimshowLog) {
                console.log('zim:find Port Code', 'start');
            }
            let url = `https://www.zim.com/umbraco/surface/ScheduleByRoute/GetPortsInLands?query=${code.trim()}`;
            request(url, (err, res, body) => {
                let result = ''
                try {
                    if (!err) {
                        let obj = JSON.parse(body);
                        if (obj['suggestions'].length !== 0) {
                            result = obj['suggestions'][0]['data'];
                        }
                    }
                } catch (e) {

                }
                finally {
                    if (GlobalSchedule.zimshowLog) {
                        console.log('zim:find Port Code', 'end');
                    }
                    resolve(result)
                }
            })
        })
    }
    public sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000)
        })
    }
    public findPageNumber(from, to, NOW) {
        return new Promise((resolve, reject) => {
            let u =
                porttoporturl +
                `?portcode=${from}&portdestinationcode=${to}&fromdate=today&weeksahead=${NOW}&direction=True&page=${1}`;
            request(u, async (err, res, body) => {
                if (err) {
                    util.writeLog(err);
                    resolve(0);
                } else {
                    try {
                        if (res.statusCode === 200) {
                            const bodyHtml: any = parse(body);
                            let valid = bodyHtml.innerHTML.indexOf('The information you requested is currently unavailable') === -1;
                            if (valid) {
                                let next = bodyHtml.querySelector('.PagedList-skipToNext');
                                if (!next) {
                                    resolve(1)
                                } else {
                                    let pages = bodyHtml.querySelector('.paging-list').querySelectorAll('li');
                                    resolve(pages.length - 1);
                                }
                            } else {
                                resolve(0);
                            }

                        }

                    } catch (e) {
                        util.writeLog(e.message);
                        resolve(0);
                    }
                }
            });
        });
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
            while (GlobalSchedule.zimstopFlag) {
                await this.setTimeOut(1);
            }
            resolve('');
        })

    }
}