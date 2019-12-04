//import depemdencyes
import * as request from 'request';
import * as schedule from 'node-schedule';
import Scrap from '../scraping/scrap';
import { Route } from '../scraping/scrapModel';
import { GlobalSchedule } from './globalSheduleList';
import util from './utilService';
import * as puppeteer from 'puppeteer';
import { parse } from 'node-html-parser';
const porttoporturl = 'https://www.shipmentlink.com/tvs2/jsp/TVS2_InteractiveSchedule.jsp?';


export default class shipmentLinkService {
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
        if (GlobalSchedule.shipmentLinkSchedule) {
            GlobalSchedule.shipmentLinkSchedule.cancel();
        }
        GlobalSchedule.shipmentLinkSchedule = schedule.scheduleJob(
            scheduleTime,
            async () => {
                let siteSetting = await this.scrap.loadSetting(6);
                if (!siteSetting[0]['DisableEnable'] || GlobalSchedule.shipmentLinkScheduleService) {
                    return;
                }
                try {

                    console.log(scheduleTime);
                    console.log('service shipment call');
                    GlobalSchedule.shipmentLinkScheduleService = true;
                    GlobalSchedule.shipmentLinkScheduleCount = 0;
                    //get all points
                    //init scrap proccess
                    let timeLength = siteSetting[0]['LenghtScrap'];
                    let tempDate = new Date();
                    let range = Math.floor(timeLength / 7);
                    if (range === 0)
                        range = 1
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
                                    range,
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
                    console.log('shipmentLink scrap problem!!! please check your log file');
                    util.writeLog("shipmentLink:" + e);
                } finally {
                    console.log('shipmentLink: finish');
                    GlobalSchedule.shipmentLinkScheduleService = false;
                }

            }
        );
    }
    public sendData(from, to, startDate, range, id, portsDetail) {
        return new Promise(async (resolve, reject) => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            try {
                page.on('dialog', async dialog => {
                    await dialog.dismiss();
                });
                await page.goto(porttoporturl);
                await page.evaluate(element => {
                    document.getElementById('captcha_input').remove();
                    if (document.getElementById('captcha_input')) {
                        document.getElementById('captcha_input').remove()
                    }
                });
                //oriCountry

                //fill from inputs
                const fromInput = await page.$('#tvs2OriAC_hideValue');
                await page.evaluate((fromInput, from) => fromInput.value = from.code, fromInput, from);
                const fromInputName = await page.$('#tvs2OriAC');
                await page.evaluate((fromInputName, from) => fromInputName.value = from.url, fromInputName, from);

                //fill to location inputs
                const toInput = await page.$("#tvs2DesAC_hideValue");
                await page.evaluate((toInput, to) => toInput.value = to.code, toInput, to);
                const toInputName = await page.$("#tvs2DesAC");
                await page.evaluate((toInputName, to) => toInputName.value = to.url, toInputName, to);
                //set duration week
                const timeOption = await page.$("#durationWeek");
                await page.evaluate((timeOption, range) => {
                    switch (range) {
                        case 1:
                            timeOption.value = 7
                            break;
                        case 2:
                            timeOption.value = 14
                            break;
                        case 3:
                            timeOption.value = 21
                            break;
                        default:
                            timeOption.value = 28
                            break;
                    }
                }, timeOption, range)

                const button = await page.$("input[value='Submit']");
                await page.evaluate(button => button.click(), button);
                await page.waitForNavigation();
                await page.evaluate(element => {
                    document.getElementById('captcha_input').remove();
                    if (document.getElementById('captcha_input')) {
                        document.getElementById('captcha_input').remove()
                    }
                });
                const button2 = await page.$("input[value='Submit']");
                await page.evaluate(button => button.click(), button2);
                await page.waitForNavigation();
                let bodyHTML = await page.evaluate(() => document.body.innerHTML);
                if (bodyHTML.indexOf('Data not found') === -1) {
                    const body: any = parse(bodyHTML);
                    let results = body.querySelectorAll('thead').filter(x => x.innerHTML.indexOf('Details') !== -1);
                    for (let i = 1; i < results.length; i++) {
                        let roueTemp = new Route();
                        //get Arrival (eta)
                        let arrival = this.changeDate(new Date(results[i].querySelectorAll('tr')[1].querySelectorAll('td')[4].text.trim()));
                        //get Departure (etd)
                        let Departure = this.changeDate(new Date(results[i].querySelectorAll('tr')[1].querySelectorAll('td')[1].text.trim()));

                        //Voyage and service
                        let row = results[i].querySelectorAll('tr')[1].querySelectorAll('td')[3].text.trim();
                        //get vessel 
                        let vesel = row.split('\n')[0].trim();
                        //get Voyage
                        let voyage = row.split('\n')[1].trim();
                        //get service 
                        let service = results[i].querySelectorAll('tr')[0].querySelectorAll('td')[4].text.trim();
                        //get from_sch_cy
                        let schTemp = results[i].querySelectorAll('tr')[0].querySelectorAll('td')[3].querySelector('div').text.trim();

                        var from_sch_cy = schTemp.indexOf('----') !== -1 ? null : this.changeDate(new Date(results[i].querySelectorAll('tr')[0].querySelectorAll('td')[3].querySelector('div').text.trim()));
                        //get from_sch_vgm
                        var from_sch_vgmRows = results[i].querySelectorAll('tr').filter(x => x.text.indexOf('----') === -1);
                        var from_sch_vgm = null;
                        if (from_sch_vgmRows.length > 1) {
                            from_sch_vgm = this.changeDate(new Date(from_sch_vgmRows[1].querySelector('font').text.trim()));
                        }

                        //go to Details
                        //find Details Table
                        let DetailBtn = results[i].querySelectorAll('tr')[0].querySelectorAll('td')[8].querySelectorAll('span');
                        let param = DetailBtn[0].attributes['params'];
                        let code = param.split('=')[1];
                        const detailsTable = body.querySelectorAll(`#detailSeq` + code)[0].querySelector('.Design1');
                        const detailsRow = detailsTable.querySelectorAll(`tr`).filter(x => x.text.indexOf('----') === -1);
                        let vessel_2 = null;
                        let voyage_2 = null;
                        let ts_port_name = null;
                        if (detailsRow.length > 3) {
                            ts_port_name = detailsRow[3].querySelectorAll('td')[1].text.split(',')[0].trim();
                            let v2 = detailsRow[3].querySelectorAll('td')[6].text.trim();
                            vessel_2 = v2.match(/(.*?) /g).join(' ').trim().replace('  ',' ');
                            voyage_2 = v2.split(' ')[v2.split(' ').length - 1];
                        }
                        //get 
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
                        roueTemp.from_sch_cy = from_sch_cy;
                        roueTemp.from_sch_cfs = null;
                        roueTemp.from_sch_rece = null;
                        roueTemp.from_sch_si = null;
                        roueTemp.from_sch_vgm = from_sch_vgm;
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
                        roueTemp.siteId = 3;
                        //!!!!
                        await this.scrap.saveRoute(roueTemp);
                        GlobalSchedule.shipmentLinkScheduleCount++;
                        // //dispose variables
                        roueTemp = null;
                    }
                }
            } catch (e) {
                util.writeLog(e.message);
            }
            finally {
                await page.close();
                await browser.close();
                if (+this.siteSettingGlobal['FldbreakTime']) {
                    await this.break(+this.siteSettingGlobal['FldbreakTime']);
                }
                resolve('ok');
            }
        })

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
            try {
                let url = `https://www.shipmentlink.com/servlet/TUF1_AutoCompleteServlet`;
                var options = {
                    method: 'POST',
                    url: url,
                    headers:
                    {
                        'cache-control': 'no-cache',
                        'Content-Length': '89',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cache-Control': 'no-cache',
                        Accept: '*/*'
                    },
                    form:
                    {
                        scope: 'context',
                        search: code,
                        action: 'preLoad',
                        switchSql: '',
                        datasource: 'bkLocations',
                        fromFirst: 'true'
                    }
                };
                request(options, (error, response, body) => {
                    if (error) resolve('');
                    try {
                        let res: any = {};
                        res['url'] = decodeURIComponent(eval(body)[0][0])
                        res['code'] = decodeURIComponent(eval(body)[0][1]);
                        resolve(res);
                    } catch{
                        resolve('');
                    }

                });
            } catch (e) {
                resolve('');
            }

        })

    }
    public sleep() {
        return new Promise((resolve) => {
            setTimeout(resolve, 900000)
        })
    }
    decodeHex(h) {
        var s = ''
        for (var i = 0; i < h.length; i += 2) {
            s += String.fromCharCode(parseInt(h.substr(i, 2), 16))
        }
        return decodeURIComponent(escape(s))
    }
    public changeDate(date: Date) {
        try {
            if(date.getFullYear().toString() === "Nan"){
                return null;
            }
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
}