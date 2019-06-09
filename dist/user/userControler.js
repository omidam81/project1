"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const user_1 = require("./user");
const userModel = require("./userModel");
const autorize_1 = require("../autorize");
const sendEmail_1 = require("../services/sendEmail");
class MainControler {
    constructor() {
        this.router = express.Router();
        this.user = new user_1.default();
        this.sendMail = new sendEmail_1.default();
        this.config();
        this.call();
    }
    config() {
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(bodyParser.json());
    }
    call() {
        this.router.post('/api/user/login', (req, res) => {
            let loginOData = new userModel.loginOData();
            loginOData.username = req.body.username;
            loginOData.password = req.body.password;
            this.user
                .loginUser(loginOData)
                .then(data => {
                if (data[0]['message'] === 'succeed') {
                    let token = autorize_1.default.createToken(data[0]['UserCo'], data[0]['FldFkTypeCo']);
                    let result = {
                        msg: 'success',
                        token: token,
                        user: data[0]['FldFkTypeCo']
                    };
                    res.status(200).send({
                        data: result,
                        status: 200,
                        msg: 'success'
                    });
                }
                else {
                    res.status(200).send({
                        data: data,
                        status: 400,
                        msg: 'success'
                    });
                }
            })
                .catch(err => {
                res.status(200).send({
                    data: err,
                    status: 400,
                    msg: 'fail'
                });
            });
        });
        this.router.post('/api/user/register', (req, res) => {
            let userOData = new userModel.userOData();
            userOData.name = req.body.name;
            userOData.family = req.body.family;
            userOData.email = req.body.email;
            userOData.password = req.body.password;
            userOData.phone = req.body.phone;
            userOData.type = req.body.type;
            userOData.active = req.body.active || 1;
            userOData.id = req.body.id || -1;
            this.user
                .register(userOData)
                .then(data => {
                res.status(200).send({
                    data: data,
                    status: 200,
                    msg: 'success'
                });
            })
                .catch(err => {
                res.status(200).send({
                    data: err,
                    status: 400,
                    msg: 'fail'
                });
            });
        });
        this.router.post('/api/user/loadUsers', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let userId = req.body.userId;
                let userType = req.body.userType || -1;
                this.user
                    .loadUsers(userId, userType)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/changePassword', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let oldPass = req.body.oldPass;
                let newPass = req.body.newPass;
                let userId = autorize_1.default.getId(token);
                this.user
                    .changePassword(userId, oldPass, newPass)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/deleteUser', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkTokenforAdmin(token);
            if (status === 200) {
                let userId = req.body.userId;
                this.user
                    .deleteUser(userId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/addEmail', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let masterId = req.body.masterId;
                let email = req.body.email;
                this.user
                    .saveEmail(masterId, email)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/loadAllemails', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let emailId = req.body.emailId || -1;
                this.user
                    .loadAllEmails(emailId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/saveSystemEmail', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let setting = new userModel.systemEmail();
                setting.email = req.body.email;
                setting.password = req.body.password;
                setting.port = req.body.port;
                setting.server = req.body.server;
                setting.username = req.body.username;
                this.user
                    .saveSystemEmail(setting)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/loadSystemEmails', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let emailId = req.body.emailId || -1;
                this.user
                    .loadSystemEmails(emailId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/saveEmailSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let masterId = req.body.masterId || -1;
                let time = req.body.time;
                let saveTime = req.body.saveTime;
                this.sendMail.main(time);
                this.user
                    .saveEmailSetting(masterId, saveTime)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/loadEmailSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let masterId = req.body.masterId || -1;
                this.user
                    .loadEmailSetting(masterId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/deleteEmail', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = autorize_1.default.checkToken(token);
            if (status === 200) {
                let emalId = req.body.emalId;
                this.user
                    .deleteEmail(emalId)
                    .then(data => {
                    res.status(200).send({
                        data: data,
                        status: 200,
                        msg: 'success'
                    });
                })
                    .catch(err => {
                    res.status(200).send({
                        data: err,
                        status: 400,
                        msg: 'fail'
                    });
                });
            }
            else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
    }
}
exports.default = new MainControler().router;
//# sourceMappingURL=userControler.js.map