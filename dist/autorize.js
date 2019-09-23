"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const config_1 = require("./config");
const cryptoJSON = require("crypto-json");
class jsontoken {
    static createToken(id, type) {
        let data = {
            id: id,
            type: type
        };
        const output = cryptoJSON.encrypt(data, config_1.default.password);
        let token = jwt.sign(output, config_1.default.key, {
            expiresIn: 604800
        });
        return token;
    }
    static checkToken(token) {
        if (!token)
            return 401;
        try {
            jwt.verify(token, config_1.default.key);
            return 200;
        }
        catch (_a) {
            return 401;
        }
    }
    static getId(token) {
        var decoded = jwt.verify(token, config_1.default.key);
        delete decoded.exp;
        delete decoded.iat;
        let data = cryptoJSON.decrypt(decoded, config_1.default.password);
        return data.id;
    }
    static getType(token) {
        var decoded = jwt.verify(token, config_1.default.key);
        delete decoded.exp;
        delete decoded.iat;
        let data = cryptoJSON.decrypt(decoded, config_1.default.password);
        return data.type;
    }
    static checkTokenforAdmin(token) {
        if (!token)
            return 401;
        try {
            var decoded = jwt.verify(token, config_1.default.key);
            delete decoded.exp;
            delete decoded.iat;
            let data = cryptoJSON.decrypt(decoded, config_1.default.password);
            if (data.type === 1) {
                return 200;
            }
            else {
                return 401;
            }
        }
        catch (_a) {
            return 401;
        }
    }
}
exports.default = jsontoken;
//# sourceMappingURL=autorize.js.map