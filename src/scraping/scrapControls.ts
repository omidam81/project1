import * as express from 'express';
import * as bodyParser from 'body-parser';
import Scrap from './scrap';
import { constants } from 'os';
import Jwt from '../autorize';
import oneLineService from '../services/onelineScrapService';
import * as ScrapModel from './scrapModel';
class scrapControler {
    public router: express.router;
    public scrap: Scrap;
    public oneLine;
    constructor() {
        this.router = express.Router();
        this.scrap = new Scrap();
        this.oneLine = new oneLineService();
        this.config();
        this.call();
    }
    private config(): void {
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(bodyParser.json());
    }

    private call(): void {
        this.router.get('/api/scrap/saveAllPort', async (req, res) => {
            let ports = oneLineService.loadports();
            for (let i = 0; i < ports.length; i++) {
                let portOData = new ScrapModel.PortOData();
                portOData.PortCode = ports[i]['locCd'];
                portOData.portName = ports[i]['locNm'];
                await this.scrap.saveFile(portOData);
            }
            return res.status(200).send({
                msg: 'success',
                status: 200
            });
        });
        this.router.get('/api/scrap/loadSchedulePerPoint', (req, res) => {
            this.oneLine.loadPortToPortSchedule().then(ports => {
                return res.status(200).send({
                    msg: 'success',
                    status: 200
                });
            });
        });
        this.router.post('/api/scrap/loadPoints', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
            if (status === 200) {
                let portId = req.body.portId;
                this.scrap
                    .loadPoints(portId)
                    .then(data => {
                        res.status(200).send({
                            data: data,
                            msg: 'success',
                            status: 200
                        });
                    })
                    .catch(err => {
                        res.status(200).send({
                            data: err,
                            msg: 'fail'
                        });
                    });
            } else {
                res.status(status).send({
                    msg: 'fail'
                });
            }
        });
        this.router.post('/api/scrap/loadSites', (req, res) => {
            let token = req.headers['x-access-token'];
            let status = Jwt.checkToken(token);
            if (status === 200) {
                let siteId = req.body.siteId;

                this.scrap
                    .loadSites(siteId)
                    .then(data => {
                        res.status(200).send({
                            data: data,
                            msg: 'success',
                            status: 200
                        });
                    })
                    .catch(err => {
                        res.status(200).send({
                            data: err,
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

export default new scrapControler().router;
