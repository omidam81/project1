"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const config_1 = require("../config");
class User {
    loginUser(loginOData) {
        let qry = 'SpLogin';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('Email', loginOData.username)
                    .input('Password', loginOData.password)
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
    register(user) {
        let qry = 'SpSignUp';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('UserCo', user.id)
                    .input('Name', user.name)
                    .input('Lastname', user.family)
                    .input('Email', user.email)
                    .input('Password', user.password)
                    .input('TypeCo', user.type)
                    .input('PhoneNo', user.phone)
                    .input('Active', user.active)
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
    loadUsers(userId, userType) {
        let qry = 'SpLoadUsers';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('UserCo', userId)
                    .input('UserType', userType)
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
    deleteUser(id) {
        let qry = 'SpLoadUsers';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('IDUser', id)
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
    changePassword(id, oldPass, newPass) {
        let qry = 'SpChangePassword';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('UserId', id)
                    .input('OldPassword', oldPass)
                    .input('NewPassword', newPass)
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
    changeActiveUser(userId, active, newPass) {
        let qry = 'SpActiveOrInActiveUser';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('UserCo', userId)
                    .input('Active', active)
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
    saveEmailSetting(masterId, time) {
        let qry = 'Sp_InsertOrUpdateEmailSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('FldPkEmailSetting', masterId)
                    .input('FldSendTime', time)
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
    saveEmail(masterId, email) {
        let qry = 'Sp_InsertEmail';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('PkMasterSetting', masterId)
                    .input('Email', email)
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
    deleteEmail(emailId) {
        let qry = 'Sp_DeleteEmail';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('PkEmail', emailId)
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
    loadAllEmails(emailSettingId = -1) {
        let qry = 'Sp_LoadEmail';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('FkEmailSetting', emailSettingId)
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
    loadEmailSetting(settingId = -1) {
        let qry = 'Sp_LoadEmailSetting';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('PkEmaillSetting', settingId)
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
    saveSystemEmail(systemEmail) {
        let qry = 'Sp_InsertOrUpdateSystemEmail';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('FldEmail', systemEmail.email)
                    .input('FldServer', systemEmail.server)
                    .input('FldPort', systemEmail.port)
                    .input('FldUserName', systemEmail.username)
                    .input('FldPass', systemEmail.password)
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
    loadSystemEmails(emailId = -1) {
        let qry = 'Sp_LoadSystemEmail';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbRouteconfig)
                .connect()
                .then(pool => {
                return pool
                    .request()
                    .input('PkSystemEmail', emailId)
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
exports.default = User;
//# sourceMappingURL=user.js.map