import {BookService} from "./iBookService.js";
import {Book, BookStatus} from "../model/book.js";
import {HttpError} from "../errorHandler/HttpError.js";
import {RowDataPacket} from "mysql2";
import {pool} from "../app.js";

export class BookServiceImpSql implements BookService {
    async addBook(book: Book): Promise<void> {
        await pool.query('INSERT INTO books VALUES(?,?,?,?,?,?)',
            [book._id, book.title, book.author, book.genre, book.status, book.year])
            .catch((err) => {
                throw new HttpError(500, err.message + '@addBook')
            })

    }

    async formPickList(bookId: string) {
        const [result] = await pool.query<RowDataPacket[]>
        ('SELECT * FROM books_readers INNER JOIN readers ' +
            'ON books_readers.readerId=readers.readerId AND books_readers.bookId=?', bookId)
        return Promise.resolve(result.map(unit => {
            delete unit.bookId
            return unit;
        }));
    }

    async getBook(query: string){
        const result = await pool.query<RowDataPacket[]>(query).then(async data => {
            const [result] = data;
            return result.map(async book => {
                book = {...book, pickList: []};
                const pickList = await this.formPickList(book.bookId)
                book.pickList.push(...pickList);
                return book;
            })
        }).catch((err) => {
            throw new HttpError(500, err.message + '@getAllBooks')
        })
        return Promise.resolve(await Promise.all(result) as Book[]);
    }

    async getAllBooks(): Promise<Book[]> {
        return await this.getBook('SELECT * FROM books');
    }

    async getBooksByGenre(genre: string): Promise<Book[]> {
        return await this.getBook(`SELECT * FROM books WHERE genre = '${genre}'`);
    }

    async getBooksByAuthor(author: string): Promise<Book[]> {
        return await this.getBook(`SELECT * FROM books WHERE author = '${author}'`);
    }

    async removeBook(bookId: string): Promise<Book> {
        const result = await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.ON_HAND)
                    throw new HttpError(409, `book with id ${bookId} is on hand and can't be removed@removeBook`);
                if (result[0].status === BookStatus.IN_STOCK) {
                    await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.REMOVED, bookId])
                        .then(() => {
                            result[0].status = BookStatus.REMOVED;
                        })
                        .catch(err => {
                            throw new HttpError(500, err.message + '@removeBook')
                        });
                } else
                    await pool.query('DELETE FROM books WHERE bookId = ?', [bookId])
                        .then(() => {
                            result[0].status = BookStatus.DELETED;
                        })
                        .catch(err => {
                            throw new HttpError(500, err.message + '@removeBook')
                        })
            } else
                throw new HttpError(409, `book with id ${bookId} is not found@removeBook`);
            return Promise.resolve(result[0] as Book);
        }).catch((err) => {
            throw new HttpError(500, err.message + '@removeBook');
        })
        return Promise.resolve(result as Book);
    }

    async pickBook(bookId: string, readerName: string, readerId: number): Promise<void> {
        await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.ON_HAND)
                    throw new HttpError(409, `book with id ${bookId} is already on hand@pickBook`);
                if (result[0].status === BookStatus.REMOVED)
                    throw new HttpError(409, `book with id ${bookId} is already removed and can't be picked@pickBook`);
                await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.ON_HAND, bookId])
                    .catch(err => {
                        throw new HttpError(500, err.message + '@pickBook')
                    });
                await pool.query('INSERT INTO readers VALUES(?,?) ON DUPLICATE KEY UPDATE readerName=?',
                    [readerId, readerName, readerName])
                    .catch(err => {
                        throw new HttpError(500, err.message + '@pickBook')
                    });
                await pool.query('INSERT INTO books_readers VALUES(?,?,?,?)',
                    [bookId, readerId, new Date().toISOString(), null])
                    .catch(err => {
                        throw new HttpError(500, err.message + '@pickBook')
                    });
            } else
                throw new HttpError(409, `book with id ${bookId} is not found@pickBook`);
        }).catch((err) => {
            throw new HttpError(500, err.message + '@pickBook');
        })
    }

    async returnBook(bookId: string): Promise<void> {
        await pool.query<RowDataPacket[]>('SELECT * FROM books WHERE bookId = ?', bookId).then(async data => {
            const [result] = data;
            if (result.length) {
                if (result[0].status === BookStatus.IN_STOCK)
                    throw new HttpError(409, `book with id ${bookId} is already in stock and can't be returned@returnBook`);
                if (result[0].status === BookStatus.REMOVED)
                    throw new HttpError(409, `book with id ${bookId} is already removed and can't be returned@returnBook`);
                await pool.query('UPDATE books SET status = ? WHERE bookId = ?', [BookStatus.IN_STOCK, bookId])
                    .catch(err => {
                        throw new HttpError(500, err.message + '@returnBook')
                    });
                await pool.query('UPDATE books_readers SET returnDate = ? WHERE bookId = ? AND returnDate IS NULL ',
                    [new Date().toISOString(), bookId])
                    .catch(err => {
                        throw new HttpError(500, err.message + '@returnBook')
                    });
            } else
                throw new HttpError(409, `book with id ${bookId} is not found@returnBook`);
        }).catch((err) => {
            throw new HttpError(500, err.message + '@returnBook');
        })
    }
}

export const bookServiceSql = new BookServiceImpSql();