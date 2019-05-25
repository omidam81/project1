import * as express from 'express';
import * as bodyParser from 'body-parser';
import User from './user';
import * as userModel from './userModel';
import { constants } from 'os';
import Jwt from '../autorize';

class MainControler {
    public router: express.router;
    public user: User;
    constructor() {
        this.router = express.Router();
        this.user = new User();
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
                        let token = Jwt.createToken(data[0]['UserCo'], data[0]['FldFkTypeCo']);
                        let result = {
                            msg: 'success',
                            token: token
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
            userOData.active = req.body.active;
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
                let userId = req.body.userId;
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
    }
}

export default new MainControler().router;
