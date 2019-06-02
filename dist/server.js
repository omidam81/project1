"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const app_1 = require("./app");
const compression = require("compression");
const PORT = 411;
app_1.default.use(compression()); //Compress all routes
app_1.default.listen(PORT, () => {
    console.log('Express server listening on port ' + PORT);
});
//# sourceMappingURL=server.js.map