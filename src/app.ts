import {launchServer} from "./server.js";
import {loggerWinston} from "./winston/logger.js";
import {Pool} from "mysql2/promise";
import * as mongoose from "mongoose";
import {Book} from "./model/book.js";
import {databaseConnect} from "./database/databaseConfig.js";

export const database: mongoose.Model<Book> | Pool = await databaseConnect().then(data => {
    launchServer()
        .then(() => {
            loggerWinston.warn("database is successfully connected");
        }).catch((err) => {
            loggerWinston.warn("starting server is failed: " + err.message);
        })
    return data;
}).catch(() => {
    loggerWinston.warn("connection to database is failed");
    process.exit(1)
});
