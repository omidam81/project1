import * as jwt from 'jsonwebtoken';
import config from './config';
import * as cryptoJSON from 'crypto-json';
export default class jsontoken {
    public static createToken(id: number, type: number) {
        let data = {
            id: id,
            type: type
        };
        const output = cryptoJSON.encrypt(data, config.password);
        let token = jwt.sign(output, config.key, {
            expiresIn: 604800
        });
        return token;
    }
    public static checkToken(token: string) {
        if (!token) return 401;
        try {
            jwt.verify(token, config.key);
            return 200;
        } catch {
            return 401;
        }
    }
    public static getId(token: string) {
        var decoded = jwt.verify(token, config.key);
        delete decoded.exp;
        delete decoded.iat;
        let data = cryptoJSON.decrypt(decoded, config.password);
        return data.id;
    }
    public static getType(token: string) {
        var decoded = jwt.verify(token, config.key);
        delete decoded.exp;
        delete decoded.iat;
        let data = cryptoJSON.decrypt(decoded, config.password);
        return data.type;
    }
    public static checkTokenforAdmin(token: string) {
        if (!token) return 401;

        try {
            var decoded = jwt.verify(token, config.key);
            delete decoded.exp;
            delete decoded.iat;
            let data = cryptoJSON.decrypt(decoded, config.password);
            if (data.type === 1) {
                return 200;
            } else {
                return 401;
            }
        } catch {
            return 401;
        }
    }
}
