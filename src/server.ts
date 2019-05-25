// src/server.ts
import app from './app';
import * as compression from 'compression';
import * as schedule from 'node-schedule';
import service from 'services/onelineScrapService';
const PORT = 411;

app.use(compression()); //Compress all routes

app.listen(PORT, () => {
    console.log('Express server listening on port ' + PORT);
    var j = schedule.scheduleJob('30 30 12 * * *', () => {
        console.log('service one-line call');
    });
});
