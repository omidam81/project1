"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
class UtilService {
    static writeLog(errorMsg) {
        fs.appendFile(path.resolve(__dirname, `../log/${(new Date()).toLocaleDateString().replace(/\//g, '-')}.txt`), '\n' + (new Date()).toLocaleTimeString() + ':' + errorMsg, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    static writeTime(Message) {
        fs.appendFile(path.resolve(__dirname, `../log/APLTime${(new Date()).toLocaleDateString().replace(/\//g, '-')}.txt`), '\n' + (new Date()).toLocaleTimeString() + ':' + Message, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
}
exports.default = UtilService;
//# sourceMappingURL=utilService.js.map