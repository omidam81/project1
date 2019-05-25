import * as sql from 'mssql';
import Config from '../config';
import * as ScrapModel from './scrapModel';
export default class Scrap {
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
    insertMasterRoute() {
        let qry = 'Sp_InsertMasterRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('Date', null)
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
    saveXML(id, xml) {
        let qry = 'SP_InserXmlRoute';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(Config.dbconfig)
                .connect()
                .then(pool => {
                    return pool
                        .request()
                        .input('FKmasterRoute', id)
                        .input('XML', xml)
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
            new sql.ConnectionPool(Config.dbconfig)
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
}
