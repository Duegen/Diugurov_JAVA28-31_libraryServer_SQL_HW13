import {Request, Response} from "express";
import {loggerWinston} from "../winston/logger.js";
import path from "node:path";
import {logService} from "../service/LogService.js";

export class LogController {

    async getLogFile(req: Request, res: Response) {
        let filePath = '';
        if (Object.values(req.query).length)
            filePath = logService.getLog(req.query.date + "")
        else filePath = logService.getLog();
        if (filePath)
            res.sendFile(filePath, (err) => {
                if (err) {
                    res.status(500).send('log file not found');
                    loggerWinston.error("log file not found");
                } else
                    loggerWinston.info(`log file for date ${path.parse(filePath).name} successfully sent`);
            })
        else{
            res.status(500).send('log file not found');
            loggerWinston.error("log file not found");
        }
    }
}

export const logController = new LogController();