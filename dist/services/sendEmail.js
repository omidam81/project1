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
const scrap_1 = require("../scraping/scrap");
const user_1 = require("../user/user");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const globalSheduleList_1 = require("./globalSheduleList");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
class sendMail {
    constructor() {
        this.scrap = new scrap_1.default();
        this.user = new user_1.default();
    }
    main(scheduleTime) {
        return __awaiter(this, void 0, void 0, function* () {
            let scheduleString;
            if (scheduleTime === -1) {
            }
            else {
                scheduleString = scheduleTime;
            }
            if (globalSheduleList_1.GlobalSchedule.sendEmail) {
                globalSheduleList_1.GlobalSchedule.sendEmail.cancel();
            }
            globalSheduleList_1.GlobalSchedule.sendEmail = schedule.scheduleJob(scheduleTime, () => __awaiter(this, void 0, void 0, function* () {
                let testAccount = yield nodemailer.createTestAccount();
                let emailConfig = yield this.user.loadSystemEmails();
                let emailList = yield this.user.loadAllEmails(1);
                let report = yield this.scrap.loadReport();
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
                let html = fs.readFileSync(path.resolve(__dirname, '../htmlTemplate/email.html'), { encoding: 'utf-8' });
                html = html.replace('{port}', report[0]['NumberOfScrap']);
                html = html.replace('{scrap}', report[0]['NumberOfPort']);
                var template = handlebars.compile(html);
                var replacements = {
                    TenantLink: report[0]['NumberOfPort'],
                    photoLink: report[0]['NumberOfPort']
                };
                var htmlToSend = template(replacements);
                let mailOptions = {
                    from: 'scrapreport20@gmail.com',
                    to: list,
                    subject: 'Scrap Report',
                    html: htmlToSend // html body
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                });
            }));
        });
    }
}
exports.default = sendMail;
//# sourceMappingURL=sendEmail.js.map