//import depemdencyes
import * as request from 'request';
import * as schedule from 'node-schedule';
import Scrap from '../scraping/scrap';
import { Route } from '../scraping/scrapModel';
import { GlobalSchedule } from './globalSheduleList';
import util from './utilService';
import * as puppeteer from 'puppeteer';
import { parse } from 'node-html-parser';


export default class yangMingScrapService {
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
        if (GlobalSchedule.yangMingSchedule) {
            GlobalSchedule.yangMingSchedule.cancel();
        }
        GlobalSchedule.yangMingSchedule = schedule.scheduleJob(
            scheduleTime,
            async () => {
                let siteSetting = await this.scrap.loadSetting(8);
                if (!siteSetting[0]['DisableEnable'] || GlobalSchedule.yangMingScheduleService) {
                    return;
                }
                try {

                    console.log(scheduleTime);
                    console.log('yangming service call');
                    GlobalSchedule.yangMingScheduleService = true;
                    GlobalSchedule.yangMingScheduleCount = 0;
                    //get all points
                    //init scrap proccess
                    let timeLength = siteSetting[0]['LenghtScrap'];
                    let tempDate = new Date();
                    if (timeLength >= 60) {
                        timeLength = 59;
                    }
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
                                let from = cath.find(x => x.name === ptp['fromPortname']);
                                let to = cath.find(x => x.name === ptp['toPortname']);
                                let fromCode;
                                let toCode;
                                //check if this port not in my cache call api and get code 
                                if (!from) {
                                    fromCode = await this.findCode(ptp['fromPortname']) || 'noCode'
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
                                    toCode = await this.findCode(ptp['toPortname']) || 'noCode'
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


                } catch (e) {
                    console.log('yang ming scrap problem!!! please check your log file');
                    util.writeLog("yang ming:" + e);
                } finally {
                    console.log('yangming: finish');
                    GlobalSchedule.yangMingScheduleService = false;
                }

            }
        );
    }
    public async sendData(from, to, startDate, endDate, id, portsDetail) {
        const browser = await puppeteer.launch({
            headless: false
        });
        const page = await browser.newPage();
        try {
            await page.goto('https://o-www.yangming.com/e-service/schedule/PointToPoint.aspx');

            //ContentPlaceHolder1_txtFrom SHANGHAI, SH, China ContentPlaceHolder1_txtTo HONG KONG, Hong Kong ContentPlaceHolder1_hidTo HKHKG ContentPlaceHolder1_hidFrom shang
            const fromInputView = await page.$("#ContentPlaceHolder1_txtFrom");
            await fromInputView.evaluate((fromInput, from) => fromInput.value = from['LOC_NAME'], from);

            const toInputView = await page.$("#ContentPlaceHolder1_txtTo");
            await toInputView.evaluate((fromInput, to) => fromInput.value = to['LOC_NAME'], to);

            const fromInput = await page.$("#ContentPlaceHolder1_hidFrom");
            await fromInput.evaluate((fromInput, from) => fromInput.value = from['LOC_CD'], from);

            const toInputHide = await page.$("#ContentPlaceHolder1_hidTo");
            await toInputHide.evaluate((fromInput, to) => fromInput.value = to['LOC_CD'], to);

            const toInput = await page.$("#ContentPlaceHolder1_hidTo_txt");
            await toInput.evaluate((toInput, from) => toInput.value = from['LOC_NAME'], from)

            const endDateInput = await page.$('#ContentPlaceHolder1_date_End');
            await endDateInput.evaluate((input, date) => input.value = date, endDate)

            const button = await page.$('#ContentPlaceHolder1_btnSearch0');
            await button.evaluate(button => button.click());
            await page.waitForNavigation();
            await this.break(10000);
            let bodyHTML = await page.evaluate(() => document.body.innerHTML);
            if (bodyHTML.indexOf('Sorry, no data could be found. For more information') === -1) {
                const body: any = parse(bodyHTML);
                let ResTable = body.querySelector('#divCargoDateSchedule').querySelector('tbody').querySelectorAll('tr');
                for (let i = 0; i < ResTable.length; i += 2) {
                    let roueTemp = new Route();
                    //get Arrival (eta)
                    let arrival = ResTable[i].querySelectorAll('td')[9].text;
                    //get Departure (etd)
                    let Departure = ResTable[i].querySelectorAll('td')[3].text;

                    //Voyage and service
                    let row = ResTable[i].querySelectorAll('td')[5].text
                    let arr = row.split('-');
                    //get vessel 
                    let vesel = arr[0].trim();
                    //get Voyage
                    let voyage = arr.length > 1 ? arr[1].trim() : ''
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
                        voyage_2 = d.length > 1 ? d[1].trim() : '-'
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
                    roueTemp.ts_port_name = ts_port_name;
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
                    roueTemp.siteId = 8;
                    //!!!!
                    await this.scrap.saveRoute(roueTemp);
                    GlobalSchedule.yangMingScheduleCount++;
                    // //dispose variables
                    roueTemp = null;
                    // await page.waitForNavigation();
                }
            }
        } catch (e) {
            util.writeLog(e);
        } finally {
            await browser.close();
            if (+this.siteSettingGlobal['FldbreakTime']) {
                await this.break(+this.siteSettingGlobal['FldbreakTime']);
            }
        }
    }

    public IsoTime(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('/');
    }
    public findCode(code) {
        return new Promise((resolve, reject) => {
            let url = `https://o-www.yangming.com/e-service/schedule/PointToPoint_LocList.ashx?q=${code.trim().toLowerCase()}&limit=99999&timestamp=${Date.now()}&p_Type=F&p_floc=`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('')
                    } else {
                        let obj = JSON.parse(body);
                        if (obj.length !== 0) {
                            resolve(obj[0])
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
    public sleep(sec) {
        return new Promise((resolve) => {
            setTimeout(resolve, sec * 1000)
        })
    }
    public break(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        })
    }
}