"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const config_1 = require("../config");
class User {
    loginUser(loginOData) {
        let qry = 'SpLogin';
        return new Promise((resolve, reject) => {
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
            new sql.ConnectionPool(config_1.default.dbconfig)
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
}
exports.default = User;
//# sourceMappingURL=user.js.map