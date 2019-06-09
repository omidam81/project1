import * as express from 'express';
import * as bodyParser from 'body-parser';
import User from './user';
import * as userModel from './userModel';
import { constants } from 'os';
import Jwt from '../autorize';
import SendMail from '../services/sendEmail';
class MainControler {
    public router: express.router;
    public user: User;
    public sendMail: SendMail;
    constructor() {
        this.router = express.Router();
        this.user = new User();
        this.sendMail = new SendMail();
        this.config();
        this.call();
    }
    private config(): void {
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(bodyParser.json());
    }
    private call(): void {
        this.router.post('/api/user/login', (req, res) => {
            let loginOData = new userModel.loginOData();
            loginOData.username = req.body.username;
            loginOData.password = req.body.password;
            this.user
                .loginUser(loginOData)
                .then(data => {
                    if (data[0]['message'] === 'succeed') {
                        let token = Jwt.createToken(
                            data[0]['UserCo'],
                            data[0]['FldFkTypeCo']
                        );
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
                    } else {
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
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/changePassword', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
            if (status === 200) {
                let oldPass = req.body.oldPass;
                let newPass = req.body.newPass;
                let userId = Jwt.getId(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/deleteUser', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkTokenforAdmin(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/addEmail', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/loadAllemails', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/saveSystemEmail', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/user/loadSystemEmails', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });

        this.router.post('/api/user/saveEmailSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });

        this.router.post('/api/user/loadEmailSetting', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });

        this.router.post('/api/user/deleteEmail', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
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
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
    }
}

export default new MainControler().router;
