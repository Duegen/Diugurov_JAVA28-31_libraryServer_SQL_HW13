import {BookService} from "./iBookService.js";
import {Book, BookEdit, BookStatus} from "../model/book.js";
import {HttpError} from "../errorHandler/HttpError.js";
import {RowDataPacket} from "mysql2";
import {database} from "../app.js";
import {Pool} from "mysql2/promise";

export class BookServiceImpSql implements BookService {
    async addBook(book: Book): Promise<void> {
        const pool = database as Pool;
        await pool.query(`INSERT INTO books VALUES(?,?,?,?,?,?)`,
            [book._id, book.title, book.author, book.genre, book.status, book.year])
            .catch(() => {
                throw new Error('database connection error@addBook')
            })
    }

    async formPickList(bookId: string) {
        const pool = database as Pool;
        const [result] = await pool.query<RowDataPacket[]>
        ('SELECT * FROM books_readers INNER JOIN readers ' +
            'ON books_readers.readerId=readers.readerId AND books_readers.bookId=?', bookId)
            .catch(() => {
                throw new Error('database connection error@getAllBooks')
            })
        return Promise.resolve(result.map(unit => {
            delete unit.bookId
            return unit;
        }));
    }

    async getBook(query: string) {
        const pool = database as Pool;
        const result = await pool.query<RowDataPacket[]>(query).then(async data => {
            const [result] = data;
            return result.map(async book => {
                book = {...book, pickList: []};
                const pickList = await this.formPickList(book.bookId)
                book.pickList.push(...pickList);
                return book;
            })
        }).catch((err) => {
            if(err instanceof HttpError) throw new HttpError(409, err.message);
            else throw new Error(err.message);
        })
        return Promise.resolve(await Promise.all(result) as Book[]);
    }

    async getAllBooks(): Promise<Book[]> {
        return await this.getBook('SELECT * FROM books').catch(err => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@getAllBooks');
            else throw new Error(err.message + '@getAllBooks');
        });
    }

    async getBooksByGenre(genre: string): Promise<Book[]> {
        return await this.getBook(`SELECT * FROM books WHERE genre = '${genre}'`).catch(err => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@getBooksByGenre');
            else throw new Error(err.message + '@getBooksByGenre');
        });
    }

    async getBooksByAuthor(author: string): Promise<Book[]> {
        return await this.getBook(`SELECT * FROM books WHERE author = '${author}'`).catch(err => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@getBooksByAuthor');
            else throw new Error(err.message + '@getBooksByAuthor');
        });
    }

    async removeBook(bookId: string): Promise<Book> {
        const pool = database as Pool;
        const result = await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.ON_HAND)
                    throw new HttpError(409, `book with id ${bookId} is on hand and can't be removed`);
                if (result[0].status === BookStatus.IN_STOCK) {
                    await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.REMOVED, bookId])
                        .then(() => {
                            result[0].status = BookStatus.REMOVED;
                        })
                        .catch(() => {
                            throw new Error('database connection error')
                        });
                } else
                    await pool.query('DELETE FROM books WHERE bookId = ?', [bookId])
                        .then(() => {
                            result[0].status = BookStatus.DELETED;
                        })
                        .catch(() => {
                            throw new Error('database connection error')
                        })
            } else
                throw new HttpError(409, `book with id ${bookId} is not found`);
            return Promise.resolve(result[0] as Book);
        }).catch((err) => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@removeBook');
            else throw new Error( err.message + '@removeBook');
        })
        return Promise.resolve(result as Book);
    }

    async editBook(editData: BookEdit): Promise<Book>{
        const pool = database as Pool;
        const result = await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', editData._id)
            .then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.REMOVED)
                    throw new HttpError(409, `book with id ${editData._id} is removed and can't be edited`);
                await pool.query('UPDATE books SET title = ?, author = ?, genre = ?, year = ? WHERE bookId = ?',
                    [editData.title || result[0].title, editData.author || result[0].author
                        , editData.genre || result[0].genre, editData.year || result[0].year, editData._id])
                    .then(() => {
                        result[0].title = editData.title || result[0].title;
                        result[0].author = editData.author || result[0].author;
                        result[0].genre = editData.genre || result[0].genre;
                        result[0].year = editData.year || result[0].year;
                    })
                    .catch(() => {
                        throw new Error('database connection error')
                    });
            } else
                throw new HttpError(409, `book with id ${editData._id} is not found`);
            return Promise.resolve(result[0] as Book);
        }).catch((err) => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@editBook');
            else throw new Error( err.message + '@editBook');
        })
        return Promise.resolve(result as Book);
    };

    async restoreBook(bookId: string): Promise<Book> {
        const pool = database as Pool;
        const result = await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status !== BookStatus.REMOVED)
                    throw new HttpError(409, `book with id ${bookId} is not removed and can't be restored`);
                await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.IN_STOCK, bookId])
                    .then(() => {
                        result[0].status = BookStatus.IN_STOCK;
                    })
                    .catch(() => {
                        throw new Error('database connection error')
                    });
            } else
                throw new HttpError(409, `book with id ${bookId} is not found`);
            return Promise.resolve(result[0] as Book);
        }).catch((err) => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@restoreBook');
            else throw new Error( err.message + '@restoreBook');
        })
        return Promise.resolve(result as Book);
    }

    async pickBook(bookId: string, readerName: string, readerId: number): Promise<void> {
        const pool = database as Pool;
        await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.ON_HAND)
                    throw new HttpError(409, `book with id ${bookId} is already on hand`);
                if (result[0].status === BookStatus.REMOVED)
                    throw new HttpError(409, `book with id ${bookId} is already removed and can't be picked`);
                await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.ON_HAND, bookId])
                    .catch(() => {
                        throw new HttpError(500, 'database connection error')
                    });
                await pool.query('INSERT INTO readers VALUES(?,?) ON DUPLICATE KEY UPDATE readerName=?',
                    [readerId, readerName, readerName])
                    .catch(() => {
                        throw new HttpError(500, 'database connection error')
                    });
                await pool.query('INSERT INTO books_readers VALUES(?,?,?,?)',
                    [bookId, readerId, new Date().toISOString(), null])
                    .catch(() => {
                        throw new HttpError(500, 'database connection error')
                    });
            } else
                throw new HttpError(409, `book with id ${bookId} is not found`);
        }).catch((err) => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@pickBook');
            else throw new Error( err.message + '@pickBook');
        })
    }

    async returnBook(bookId: string): Promise<void> {
        const pool = database as Pool;
        await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.IN_STOCK)
                    throw new HttpError(409, `book with id ${bookId} is already in stock and can't be returned`);
                if (result[0].status === BookStatus.REMOVED)
                    throw new HttpError(409, `book with id ${bookId} is already removed and can't be returned`);
                await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.IN_STOCK, bookId])
                    .catch(() => {
                        throw new HttpError(500, 'database connection error')
                    });
                await pool.query('UPDATE books_readers SET returnDate = ? WHERE bookId = ? AND returnDate IS NULL ',
                    [new Date().toISOString(), bookId])
                    .catch(() => {
                        throw new HttpError(500, 'database connection error')
                    });
            } else
                throw new HttpError(409, `book with id ${bookId} is not found`);
        }).catch((err) => {
            if(err instanceof HttpError) throw new HttpError(409, err.message + '@returnBook');
            else throw new Error( err.message + '@returnBook');
        })
    }
}

export const bookServiceSql = new BookServiceImpSql();