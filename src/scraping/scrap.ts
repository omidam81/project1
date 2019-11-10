import * as sql from 'mssql';
import Config from '../config';
import * as ScrapModel from './scrapModel';
import config from '../config';
export default class Scrap {
    RouteConnection;
    RouteConfig;
    constructor() {
        this.RouteConnection = new sql.ConnectionPool(Config.dbNewRout);
        this.RouteConfig = new sql.ConnectionPool(config.dbRouteconfig);
    }
    saveFile(portOData: ScrapModel.PortOData) {
        let qry = 'Sp_InsertPort';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('Port', portOData.portName)
                        .input('Code', portOData.PortCode)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    insertMasterRoute(time, siteId) {
        let qry = 'Sp_InsertMasterRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('FldTime', time)
                        .input('FkSite', siteId)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    loadPoints(portId) {
        let qry = 'Sp_LoadPort';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('PkPort', portId)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    loadSites(siteId) {
        let qry = 'Sp_LoadSite';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('PkSite', siteId)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    saveSettingForSite(siteSettingOData: ScrapModel.siteSetting) {
        let qry = 'Sp_InsertOrUpdateMasterSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('FkSite', siteSettingOData.SiteId)
                        .input('Time', siteSettingOData.Time)
                        .input('TypeSchedule', siteSettingOData.TypeSchedule)
                        .input('DayOfMounth', siteSettingOData.DayOfMounth)
                        .input(
                            'LenghtToScraping',
                            siteSettingOData.LenghtToScraping
                        )
                        .input('FldString', siteSettingOData.String)
                        .input('DisableEnable', siteSettingOData.DisableEnable)
                        .input('Subsidiary_id', siteSettingOData.SubsidiaryId)
                        .input('com_code', siteSettingOData.ComCode)
                        .input('breakTime', siteSettingOData.breakTime)

                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    savePorttoPort(portOPortOData: ScrapModel.PortToPort) {
        let qry = 'Sp_InsertDetailsSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('Fksite', portOPortOData.siteId)
                        .input('FkFromPort', portOPortOData.from)
                        .input('FkToPort', portOPortOData.to)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    loadSetting(siteId) {
        let qry = 'Sp_LoadMasterSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('FkSite', siteId)
                        .input('SiteName', -1)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    loadDetailSetting(siteId,rowId) {
        let qry = 'Sp_LoadDetailsSetting';
        return new Promise((resolve, reject) => {
            this.RouteConfig
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('FkSite', siteId)
                        .input('RowID', rowId)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    this.RouteConfig.close();
                    return resolve(rows);
                })
                .catch(err => {
                    this.RouteConfig.close();
                    return reject(err);
                });
        });
    }
    saveRoute(routOData: ScrapModel.Route) {
        let qry = 'Sp_InsertRoute';
        return new Promise((resolve, reject) => {
            this.RouteConnection
                .connect()
                .then(pool => {
                    return (
                        pool
                            .request()
                            .input('from_port_id', routOData.from_port_id)
                            .input('from_port_name', routOData.from_port_name)
                            .input('to_port_id', routOData.to_port_id)
                            .input('to_port_name', routOData.to_port_name)
                            .input('etd', routOData.etd)
                            .input('eta', routOData.eta)
                            .input('vessel', routOData.vessel)
                            .input('voyage', routOData.voyage)
                            .input('modify_date', routOData.modify_date)
                            .input('imp_exp', routOData.imp_exp)
                            .input('service', routOData.service)
                            .input('from_sch_cy', routOData.from_sch_cy)
                            .input('from_sch_cfs', routOData.from_sch_cfs)
                            .input('from_sch_rece', routOData.from_sch_rece)
                            .input('from_sch_si', routOData.from_sch_si)
                            .input('from_sch_vgm', routOData.from_sch_vgm)
                            .input('ts_port_name', routOData.ts_port_name)
                            .input('vessel_2', routOData.vessel_2)
                            .input('voyage_2', routOData.voyage_2)
                            .input('FkSite', routOData.siteId)
                            .input('Subsidiary_id', routOData.subsidiary_id)
                            .input('com_code', routOData.com_code)
                            .input('DisableEnable', routOData.DisableEnable)
                            .input('FldFkMasterRoute', routOData.masterSetting)
                            .execute(qry)
                    );
                })
                .then(result => {
                    let rows = result.recordset;
                    this.RouteConnection.close();
                    return resolve(rows);
                })
                .catch(err => {
                    this.RouteConnection.close();
                    return reject(err);
                });
        });
    }
    loadReport() {
        let qry = 'SP_EmailReportNumberOfPortAndScrap';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input(
                            'GetDate',
                            new Date().toISOString().split('T')[0]
                        )
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    ScrapReport(reportOData: ScrapModel.scrapReport) {
        let qry = 'Sp_ReportAllRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbNewRout)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('FromPort', reportOData.from)
                        .input('ToPort', reportOData.to)
                        .input('ToInland', reportOData.toTime)
                        .input('FromInlandTime', reportOData.fromTime)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    deletePortToPort(id) {
        let qry = 'Sp_DeleteDetailSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('PkDetailSetting', id)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    getLastPort() {
        let qry = 'Sp_LoadEndPortInScraper';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    loadNewPorts(id){
        let qry = 'Sp_LoadNewPort';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('PortId',id)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    insertNewPorts(newPort:ScrapModel.newPort){
        let qry = 'Sp_InsertPortFromDbPort';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('port_id',newPort.port_id)
                        .input('port_code',newPort.port_code)
                        .input('port_name',newPort.port_name)
                        .input('port_chi_name',newPort.port_chi_name)
                        .input('ctry_id',newPort.ctry_id)
                        .input('phone_fax_no',newPort.phone_fax_no)
                        .input('create_user',newPort.create_user)
                        .input('modify_user',newPort.modify_user)
                        .input('create_date',newPort.create_date)
                        .input('modify_date',newPort.modify_date)
                        .input('job_id',newPort.job_id)
                        .input('un_code',newPort.un_code)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    getLastRoute() {
        let qry = 'Sp_LoadEndRouteInScraper';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    
    loadNewRouts(id){
        let qry = 'Sp_LoadNewRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbNewRout)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('route_id',id)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    insertNewRoutes(routOData:ScrapModel.Route){
        let qry = 'Sp_InsertRouteFromDbRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('from_port_id', routOData.from_port_id)
                            .input('from_port_name', routOData.from_port_name)
                            .input('to_port_id', routOData.to_port_id)
                            .input('to_port_name', routOData.to_port_name)
                            .input('etd', routOData.etd)
                            .input('eta', routOData.eta)
                            .input('vessel', routOData.vessel)
                            .input('voyage', routOData.voyage)
                            .input('modify_date', routOData.modify_date)
                            .input('imp_exp', routOData.imp_exp)
                            .input('service', routOData.service)
                            .input('from_sch_cy', routOData.from_sch_cy)
                            .input('from_sch_cfs', routOData.from_sch_cfs)
                            .input('from_sch_rece', routOData.from_sch_rece)
                            .input('from_sch_si', routOData.from_sch_si)
                            .input('from_sch_vgm', routOData.from_sch_vgm)
                            .input('ts_port_name', routOData.ts_port_name)
                            .input('vessel_2', routOData.vessel_2)
                            .input('voyage_2', routOData.voyage_2)
                            .input('FkSite', routOData.siteId)
                            .input('Subsidiary_id', routOData.subsidiary_id)
                            .input('com_code', routOData.com_code)
                            .input('DisableEnable', routOData.DisableEnable)
                            .input('FldFkMasterRoute', routOData.masterSetting)
                            .input('route_id', routOData.route_id)

                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    loadPagindPortPair(id){
        let qry = 'Sp_LoadAllPortPair';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('RowID', id)
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
    newPorts(){
        let qry = 'Sp_LoadNewPort';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbRouteconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .execute(qry);
                })
                .then(result => {
                    let rows = result.recordset;
                    sql.close();
                    return resolve(rows);
                })
                .catch(err => {
                    sql.close();
                    return reject(err);
                });
        });
    }
}