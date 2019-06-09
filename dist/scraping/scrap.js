"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const config_1 = require("../config");
class Scrap {
    saveFile(portOData) {
        let qry = 'Sp_InsertPort';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
    saveSettingForSite(siteSettingOData) {
        let qry = 'Sp_InsertOrUpdateMasterSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('FkSite', siteSettingOData.SiteId)
                    .input('Time', siteSettingOData.Time)
                    .input('TypeSchedule', siteSettingOData.TypeSchedule)
                    .input('DayOfMounth', siteSettingOData.DayOfMounth)
                    .input('LenghtToScraping', siteSettingOData.LenghtToScraping)
                    .input('FldString', siteSettingOData.String)
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
    savePorttoPort(portOPortOData) {
        let qry = 'Sp_InsertDetailsSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
    loadDetailSetting(siteId) {
        let qry = 'Sp_LoadDetailsSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
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
    saveRoute(routOData) {
        let qry = 'Sp_InsertRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('From', routOData.from)
                    .input('To', routOData.to)
                    .input('Inland', routOData.inland)
                    .input('PortTime', routOData.portTime)
                    .input('DepDate', routOData.depDate)
                    .input('ArrivalDate', routOData.arrivalDate)
                    .input('Vessel', routOData.vessel)
                    .input('Ocean', routOData.ocean)
                    .input('Total', routOData.total)
                    .input('PkMasterRoute', routOData.siteId)
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
    loadReport() {
        let qry = 'SP_EmailReportNumberOfPortAndScrap';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('GetDate', new Date())
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
    ScrapReport(reportOData) {
        let qry = 'Sp_ReportAllRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('FromPort', reportOData.from)
                    .input('ToPort', reportOData.to)
                    .input('ToInland', reportOData.toTime)
                    .input('FromInlandTime', reportOData.toTime)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
}
exports.default = Scrap;
//# sourceMappingURL=scrap.js.map