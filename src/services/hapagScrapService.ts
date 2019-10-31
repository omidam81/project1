//import depemdencyes
import * as request from 'request';
import * as schedule from 'node-schedule';
import Scrap from '../scraping/scrap';
import { Route } from '../scraping/scrapModel';
import { GlobalSchedule } from './globalSheduleList';
import util from './utilService';
import * as puppeteer from 'puppeteer';
import { parse } from 'node-html-parser';
const porttoporturl = 'https://www.hapag-lloyd.com/en/online-business/schedules/interactive-schedule.html';


export default class hapagScrapService {
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
        if (GlobalSchedule.hapagSchedule) {
            GlobalSchedule.hapagSchedule.cancel();
        }
        GlobalSchedule.hapagSchedule = schedule.scheduleJob(
            scheduleTime,
            async () => {
                try {
                    let siteSetting = await this.scrap.loadSetting(7);
                    if (!siteSetting[0]['DisableEnable']) {
                        return;
                    }
                    console.log(scheduleTime);
                    console.log('service hapag-lloyd call');
                    GlobalSchedule.hapagScheduleService = true;
                    GlobalSchedule.hapagScheduleCount = 0;
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
                    console.log('hapag-lloyd scrap problem!!! please check your log file');
                    util.writeLog("hapag-lloyd:" + e);
                } finally {
                    console.log('finish');
                    GlobalSchedule.hapagScheduleService = false;
                }



            }
        );
    }
    public sendData(from, to, startDate, range, id, portsDetail) {
        return new Promise(async (resolve, reject) => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            try {
                await page.setRequestInterception(true);
                page.on('request', request => {
                    if (request.resourceType() === 'image')
                        request.abort();
                    else
                        request.continue();
                });
                await page.setDefaultNavigationTimeout(60000);
                await page.goto('https://www.hapag-lloyd.com/en/online-business/schedules/interactive-schedule.html');
                await page.waitForNavigation();
                await page.evaluate((from, to) => {
                    (document as any).getElementById('schedules_interactive_f:hl21').value = `${from['name']} (${from['code']})`;
                    (document as any).getElementById('schedules_interactive_f:hl21-location_businessLocationName').value = from['name'];
                    (document as any).getElementById('schedules_interactive_f:hl21-location_businessLocode').value = from['code'];
                    (document as any).getElementById('schedules_interactive_f:hl21-standardLocation_businessLocode').value = from['code'];

                    (document as any).getElementById('schedules_interactive_f:hl56').value = `${to['name']} (${to['code']})`;
                    (document as any).getElementById('schedules_interactive_f:hl56-location_businessLocationName').value = to['name'];
                    (document as any).getElementById('schedules_interactive_f:hl56-location_businessLocode').value = to['code'];
                    (document as any).getElementById('schedules_interactive_f:hl56-standardLocation_businessLocode').value = to['code'];

                    document.getElementById('schedules_interactive_f:hl105').click()
                }, from, to)

                // await page.goto(porttoporturl + `?sn=&sl=${from}&sp=&en=&el=${to}&ep=&exportHaulage=MH&importHaulage=MH&departureDate=${startDate}&weeksAfterStart=${range}&reefer=N`);
                await page.waitForNavigation();
                const bodyHtml = await page.evaluate(() => {
                    return document.body.innerHTML
                })
                const body: any = parse(bodyHtml);
                if (body.text.indexOf('There is no routing') === -1 && body.text.indexOf('Unexpected error') === -1) {
                    //get master table
                    const table = body.querySelector('#schedules_interactive_f:hl124');
                    const rows = table.querySelector("tbody").querySelectorAll("tr");
                    //get Headers
                    let headers = table.querySelector("thead").querySelectorAll('span');
                    let etaIndex = headers.findIndex(x => x.text.indexOf('Port of Discharge') !== -1);
                    let etdIndex = headers.findIndex(x => x.text.indexOf('Port of Loading') !== -1);
                    let vesselIndex = headers.findIndex(x => x.text.indexOf('Vessels / Services') !== -1);

                    let rowNumber = -1;
                    for (let row of rows) {
                        rowNumber++;
                        let roueTemp = new Route();

                        //get Arrival (eta)
                        let etaCell = row.querySelectorAll('td')[etaIndex];
                        let arrivalText = etaCell.querySelector('span').innerHTML.split('<br />')[1];
                        let arrival = arrivalText;
                        //get Departure (etd)
                        let etdCell = row.querySelectorAll('td')[etdIndex];
                        let DepartureText = etdCell.querySelector('span').innerHTML.split('<br />')[1];
                        let Departure = DepartureText;
                        //service , vessel and Voyage
                        let serviceCell = row.querySelectorAll('td')[vesselIndex].querySelector('span').innerHTML;
                        let service = null;
                        if (serviceCell.split('<br />')[1].split('/').length > 2) {
                            service = serviceCell.split('<br />')[1].split('/')[2];
                        }
                        //get vessel
                        let vesel = serviceCell.split('<br />')[0].split('/')[0];
                        //get Voyage
                        let voyage = serviceCell.split('<br />')[0].split('/')[1];
                        // ts_port_name
                        //select current row 

                        await page.evaluate((rowNumber) => {
                            let elem = document
                                .getElementById('schedules_interactive_f:hl124')
                                .getElementsByTagName('tbody')[0]
                                .getElementsByTagName('tr')[rowNumber]
                                .getElementsByClassName('hl-radio')[0] as HTMLElement;
                            elem.click();
                        }, rowNumber);
                        //click find button
                        await page.evaluate(() => {
                            document.getElementById('schedules_interactive_f:hl124:hl153').click();
                        })
                        await page.waitForNavigation();
                        //get routing detail table
                        const routingDetail = await page.evaluate(() => {
                            return document.getElementById('schedules_interactive_f:hl164').innerHTML;
                        })
                        const routingDetailParse = parse(routingDetail);

                        //find row for extra info
                        let detailRows = (routingDetailParse as any).querySelector('tbody').querySelectorAll('tr');
                        let rowWithVoyage = [];
                        let indexVoage = [];
                        for (let i = 0; i < detailRows.length; i++) {
                            let detailVoyage = detailRows[i].querySelectorAll('td')[5].querySelector('span').text;
                            if (detailVoyage) {
                                indexVoage.push(i);
                                rowWithVoyage.push(detailRows[i])
                            }
                        }
                        let vessel_2 = null;
                        let voyage_2 = null;
                        let toFrom = null;
                        if (rowWithVoyage.length > 1) {
                            toFrom = detailRows[1].querySelectorAll('td')[1].querySelector('span').text;
                            vessel_2 = detailRows[1].querySelectorAll('td')[4].querySelector('span').text;
                            voyage_2 = detailRows[1].querySelectorAll('td')[5].querySelector('span').text;
                        }
                        // travel to screen 4 o-<-<
                        await page.evaluate((rowNumber) => {
                            let elem = document
                                .getElementById('schedules_interactive_f:hl164')
                                .getElementsByTagName('tbody')[0]
                                .getElementsByTagName('tr')[rowNumber]
                                .getElementsByClassName('hl-radio')[0] as HTMLElement;
                            elem.click();
                        }, indexVoage[0]);
                        await page.evaluate(() => {
                            document.getElementById('schedules_interactive_f:hl164:hl192').click();
                        })
                        await page.waitForNavigation();
                        await page.evaluate(() => {
                            document.getElementById('schedules_interactive_f:hl40:hl54').click();
                        })
                        await page.waitForNavigation();
                        let cutOff = null;
                        let vgmCutoff = null;
                        let from_sch_cfs = null;
                        let from_sch_si = null;
                        //find Table in screen 4
                        const lastTable = await page.evaluate(() => {
                            return document.getElementById('schedules_interactive_f:hl201').innerHTML
                        })
                        const parseLT = parse(lastTable);
                        //find cut off table
                        const vcutOffTable = (parseLT as any).querySelector('#schedules_interactive_f:hl232');
                        const cutOffDate = vcutOffTable.querySelector('#schedules_interactive_f:hl234').querySelectorAll('span');
                        const cutOffTime = vcutOffTable.querySelector('#schedules_interactive_f:hl260').querySelectorAll('span');
                        //find from_sch_cy (cutOff)
                        cutOff = `${cutOffDate[1].innerHTML} ${cutOffTime[1].innerHTML}`
                        //find from_sch_cfs (lcl)
                        from_sch_cfs = `${cutOffDate[5].innerHTML} ${cutOffTime[5].innerHTML}`
                        //find from_sch_vgm
                        vgmCutoff = `${cutOffDate[0].innerHTML} ${cutOffTime[0].innerHTML}`
                        //find Document Closure table
                        const documentTable = (parseLT as any).querySelector('#schedules_interactive_f:hl218');
                        const documentDate = documentTable.querySelector('#schedules_interactive_f:hl219').querySelectorAll('span');
                        const documentTime = documentTable.querySelector('#schedules_interactive_f:hl225').querySelectorAll('span');

                        //get from_sch_si
                        from_sch_si = `${documentDate[0]['innerHTML']} ${documentTime[0]['innerHTML']}`


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
                        roueTemp.from_sch_cy = cutOff;
                        roueTemp.from_sch_cfs = from_sch_cfs;
                        roueTemp.from_sch_rece = null;
                        roueTemp.from_sch_si = from_sch_si;
                        roueTemp.from_sch_vgm = vgmCutoff;
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
                        roueTemp.siteId = 7;
                        //!!!!
                        await this.scrap.saveRoute(roueTemp);
                        GlobalSchedule.hapagScheduleCount++;
                        //dispose variables
                        roueTemp = null;
                        //back to previes page
                        await page.goBack()
                        await page.goBack()
                    }

                }
            } catch (e) {
                util.writeLog(e.message)
            } finally {
                await browser.close();
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
            let url = `https://o-www.yangming.com/e-service/schedule/PointToPoint_LocList.ashx?q=${code.trim().toLowerCase()}&limit=99999&timestamp=${Date.now()}&p_Type=F&p_floc=`;
            request(url, (err, res, body) => {
                try {
                    if (err) {
                        resolve('')
                    } else {
                        let obj = JSON.parse(body);
                        if (obj.length !== 0) {
                            resolve({ code: obj[0]['LOC_CD'], name: obj[0]['LOC_NAME'].split(',')[0] });
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
}