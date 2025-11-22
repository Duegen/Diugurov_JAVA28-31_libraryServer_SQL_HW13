import {fileURLToPath} from "node:url";
import path from "node:path";
import * as fs from "node:fs";

export class LogService {
    private logDir = path.join(path.dirname(fileURLToPath(import.meta.url)),"../../../logs/")
    private pattern = /^\d{2}.\d{2}.\d{4}.txt$/;

    getLog(date = ''):string{
        let files = fs.readdirSync(this.logDir);
        files = files.filter(file => {
            return !!file.match(this.pattern);
        })
        files.reverse();
        if(date){
            const file = files.find(file => file === date + '.txt')
            return file ? this.logDir + '\\' + file : '';
        }
        else
            return files[0] ? this.logDir + '\\' + files[0] : '';
    }
}

export const logService = new LogService();