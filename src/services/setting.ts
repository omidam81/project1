import Scrap from '../scraping/scrap';
import * as schedule from 'node-schedule';
export default class oneLineService {
    scrap;
    constructor() {
        this.scrap = new Scrap();
    }

    public;
}

// let driver = new Builder().forBrowser('chrome').build();
// driver.get(pointUrl);
// driver

//     .findElement(By.id('btnSearch'))
//     .click()
//     .then()
//     .catch(err => {
//         console.log(err);
//     });
// (async function example() {
//     let driver = await new Builder().forBrowser('firefox').build();
//     try {
//         await driver.get('http://www.google.com/ncr');
//         await driver
//             .findElement(By.name('q'))
//             .sendKeys('webdriver', Key.RETURN);
//         await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
//         await driver.findElement(By.name('btnK')).click();
//     } finally {
//         await driver.quit();
//     }
// })();
