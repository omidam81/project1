import * as fs from 'fs';
import * as path from 'path'

export default class UtilService{
    public static writeLog(errorMsg){
        fs.appendFile(path.resolve(__dirname,`../log/${(new Date()).toLocaleDateString().replace(/\//g,'-')}.txt`),'\n'+(new Date()).toLocaleTimeString()+':'+errorMsg,(err)=>{
            if(err){
                console.log(err);
            }
              
        })
    }


}