import {launchServer} from "./server.js";
import {databaseConnect} from "./database/databaseConnect.js";
import {loggerWinston} from "./winston/logger.js";

export const pool = await databaseConnect().then(pool => {
    launchServer()
        .then(() => {
            loggerWinston.warn("database is successfully connected");
        }).catch((err) => {
            loggerWinston.warn("starting server is failed: " + err.message);
        })
    return pool;
}).catch(() => {
    loggerWinston.warn("connection to database is failed");
    process.exit(1)
});