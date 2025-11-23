import {JsonDB, Config} from "node-json-db";
import dotenv from "dotenv";

export async function JSONConnect() {
    try {
        dotenv.config({quiet: true});
        const databaseName = process.env.JSON_DB_NAME || 'libraryServer';
        const database = new JsonDB(new Config("./database/" + databaseName, true, true, '/'))
        await database.getData('/books').catch(async err => {
            if (err.id === 5) await database.push('/books', [])
            else throw new Error(err.message);
        })

        return Promise.resolve(database);
    } catch (e) {
        return Promise.reject(e);
    }
}
