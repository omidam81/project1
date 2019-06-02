// src/server.ts
import app from './app';
import * as compression from 'compression';

import service from 'services/onelineScrapService';
const PORT = 411;

app.use(compression()); //Compress all routes

app.listen(PORT, () => {
    console.log('Express server listening on port ' + PORT);

});
