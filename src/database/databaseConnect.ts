import dotenv from "dotenv";
import mysql, {Pool} from "mysql2/promise";

async function sqlConnect(): Promise<Pool> {
    try {
        dotenv.config({quiet: true});
        const connection = mysql.createPool({
            host: process.env.SQL_HOST,
            port: +process.env.SQL_PORT!,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DB_NAME,
        });
        await connection.query('SELECT 1');
        return Promise.resolve(connection)
    } catch (e) {
        return Promise.reject(e);
    }
}

export const databaseConnect = sqlConnect;