import dotenv from "dotenv";
import {sqlConnect} from "./databaseSqlConnect.js";
import {mongoConnect} from "./databaseMongoConnect.js";
import {bookServiceSql} from "../service/BookServiceImpSql.js";
import {bookServiceMongo} from "../service/BookServiceImpMongo.js";
import {loggerWinston} from "../winston/logger.js";

dotenv.config({quiet: true});

let connectFunc;
let service;

switch (process.env.DATABASE_MODE){
    case 'SQL':{
        loggerWinston.warn("SQL database is used");
        connectFunc = sqlConnect;
        service = bookServiceSql;
        break;
    }
    case 'MONGO':{
        loggerWinston.warn("MongoDB database is used");
        connectFunc = mongoConnect
        service = bookServiceMongo;
        break;
    }
    case 'NODE_JSON':{
        loggerWinston.warn("Node JSON database is used");
        connectFunc = mongoConnect
        service = bookServiceMongo;
        break;
    }
    default:{
        loggerWinston.warn("Node JSON database is used");
        connectFunc = mongoConnect
        service = bookServiceMongo;
    }
}

export const databaseConnect = connectFunc;
export const bookService = service;