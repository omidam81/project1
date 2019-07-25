import Scrap from '../scraping/scrap';
import User from '../user/user';
import * as nodemailer from 'nodemailer';
import * as schedule from 'node-schedule';
import { GlobalSchedule } from './globalSheduleList';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
export default class sendMail {
    scrap: Scrap;
    user: User;
    constructor() {
        this.scrap = new Scrap();
        this.user = new User();
    }

    async main(scheduleTime) {
        let scheduleString;
        if (scheduleTime === -1) {
        } else {
            scheduleString = scheduleTime;
        }
        if (GlobalSchedule.sendEmail) {
            GlobalSchedule.sendEmail.cancel();
        }
        GlobalSchedule.sendEmail = schedule.scheduleJob(
            scheduleTime,
            async () => {
                let testAccount = await nodemailer.createTestAccount();
                let emailConfig = await this.user.loadSystemEmails();
                let emailList: any = await this.user.loadAllEmails(1);
                let report: any = await this.scrap.loadReport();
                let list = '';
                for (let i = 0; i < emailList.length; i++) {
                    list = list + emailList[i]['FldEmail'] + ',';
                }

                // create reusable transporter object using the default SMTP transport
                // let transporter = nodemailer.createTransport({
                //     host: emailConfig[0]['FldServer'],
                //     port: emailConfig[0]['FldPort'],
                //     secure: emailConfig[0]['FldPort'] === '465', // true for 465, false for other ports
                //     auth: {
                //         user: emailConfig[0]['FldUserName'], // generated ethereal user
                //         pass: emailConfig[0]['FldPass'] // generated ethereal password
                //     }
                // });
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                           user: 'scrapreport20@gmail.com',
                           pass: 'brpCreative@1990'
                       }
                });
                let html = fs.readFileSync(
                    path.resolve(__dirname, '../htmlTemplate/email.html'),
                    { encoding: 'utf-8' }
                );

                html = html.replace('{port}', report[0]['NumberOfScrap']);
                html = html.replace('{scrap}', report[0]['NumberOfPort']);
                var template = handlebars.compile(html);
                var replacements = {
                    TenantLink: report[0]['NumberOfPort'],
                    photoLink: report[0]['NumberOfPort']
                };
                var htmlToSend = template(replacements);
                let mailOptions = {
                    from: 'scrapreport20@gmail.com', // sender address
                    to: list, // list of receivers
                    subject: 'Scrap Report', // Subject line
                    html: htmlToSend // html body
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }

                });
            }
        );
    }
}
