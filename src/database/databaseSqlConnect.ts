import dotenv from "dotenv";
import mysql, {Pool} from "mysql2/promise";

const tableBooks = 'CREATE TABLE IF NOT EXISTS books(' +
    'bookId varchar(36) not null PRIMARY KEY,' +
    'title varchar(40) not null default \'No name\',' +
    'author varchar(25) not null default \'Anonymous\',' +
    'genre varchar(10) not null default \'\',' +
    'status varchar(10) not null default \'in_stock\',\n' +
    'year int unsigned not null default 2000' +
    ');';

const tableReaders = 'CREATE TABLE IF NOT EXISTS readers(' +
    'readerId int unsigned not null default 0 PRIMARY KEY,' +
    'readerName varchar(25) not null default \'Anonymous\'' +
    ');';

const tableBooksReaders = 'CREATE TABLE IF NOT EXISTS books_readers(' +
    'bookId varchar(36) not null,' +
    'readerId int unsigned not null,' +
    'pickDate varchar(10) not null,' +
    'returnDate varchar(10),' +
    'FOREIGN KEY (bookId) REFERENCES books(bookId) ON DELETE CASCADE,' +
    'FOREIGN KEY (readerId) REFERENCES readers(readerId) ON DELETE CASCADE' +
    ');';

async function initialDatabase(pool: Pool){
    try{
        await pool.query(tableBooks);
        await pool.query(tableReaders);
        await pool.query(tableBooksReaders);
        return Promise.resolve();
    }catch (e){
        throw new Error('database error');
    }
}

export async function sqlConnect(): Promise<Pool> {
    try {
        dotenv.config({quiet: true});
        const options ={
            host: process.env.SQL_HOST || 'localhost',
            port: +process.env.SQL_PORT! || 3306,
            user: process.env.SQL_USER || 'root',
            password: process.env.SQL_PASSWORD || '',
            database: process.env.SQL_DB_NAME || 'libraryServer',
        }
        const connection = mysql.createPool(options);
        await connection.query('SELECT 1');
        await initialDatabase(connection)
        return Promise.resolve(connection)
    } catch (err) {
        return Promise.reject(err);
    }
}
