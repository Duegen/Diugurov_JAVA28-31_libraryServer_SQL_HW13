import {NextFunction, Response, Request} from "express";
import {HttpError} from "./HttpError.js";
import {loggerWinston} from "../winston/logger.js";

export const errorHandler =
    (err: unknown, req: Request, res: Response, next: NextFunction) => {
        if (err) {
            let message = ""
            if (err instanceof SyntaxError && 'body' in err)
                message = "invalid JSON in POST request";
            else if (err instanceof HttpError)
                message = err.message.replace(/"/g, "'");
            else if (err instanceof Error)
                message = 'incorrect request ' + err.message;
            else
                message = "unknown server Error " + err;
            res.status(400).send(message);
            loggerWinston.error(message);
        }
    }