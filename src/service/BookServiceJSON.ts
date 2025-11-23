import {BookService} from "./iBookService.js";
import {Book, BookEdit, BookStatus} from "../model/book.js";
import {database} from "../app.js";
import {JsonDB} from "node-json-db";
import {HttpError} from "../errorHandler/HttpError.js";

export class BookServiceJSON implements BookService{
    async addBook(book: Book): Promise<void> {
        const jsonDB = database as JsonDB;
        await jsonDB.push(`/books[]`, book).catch( err => {
            throw new Error('database error: ' + err.message + '@addBooks');
        });
        return Promise.resolve();
    }

    async getAllBooks(): Promise<Book[]> {
        const jsonDB = database as JsonDB;
        const result = await jsonDB.getData('/books').catch(err => {
            throw new Error('database error: ' + err.message + '@getAllBooks');
        });
        return Promise.resolve(result);
    }

    async getBooks(path: string, property: string, value: string): Promise<Book[]> {
        try {
            const jsonDB = database as JsonDB;
            const books: Book[] = [];
            const booksCount = await jsonDB.count('/books');
            for (let i = 0; i < booksCount; i++) {
                if (await jsonDB.getData(path + `[${i}]/` + property) === value) {
                    const book: Book = await jsonDB.getData(path + `[${i}]/`);
                    books.push(book);
                }
            }
            return Promise.resolve(books);
        } catch (err) {
            throw new Error('database error');
        }
    }

    async getBooksByAuthor(author: string): Promise<Book[]> {
        return await this.getBooks('/books', 'author', author).catch(err => {
            throw new Error(err.message + '@getBooksByAuthor');
        });
    }

    async getBooksByGenre(genre: string): Promise<Book[]> {
        return await this.getBooks('/books', 'genre', genre).catch(err => {
            throw new Error(err.message + '@getBooksByGenre');
        });
    }

    async pickBook(bookId: string, readerName: string, readerId: number): Promise<void> {
        const jsonDB = database as JsonDB;
        const index = await jsonDB.getIndex('/books', bookId, '_id');
        if(index === -1)
            throw new HttpError(409, `book with id ${bookId} is not found@pickBook`)
        const status = await jsonDB.getData(`/books[${index}]/status`);
        if(status === BookStatus.ON_HAND)
            throw new HttpError(409, `book with id ${bookId} is already on hand and can't be picked@pickBook`);
        if(status === BookStatus.REMOVED)
            throw new HttpError(409, `book with id ${bookId} is removed and can't be picked@pickBook`);
        await jsonDB.push(`/books[${index}]/status`, BookStatus.ON_HAND);
        await jsonDB.push(`/books[${index}]/pickList[]`,{
            readerId: readerId,
            readerName: readerName,
            pickDate: new Date().toLocaleDateString(),
            returnDate: null
        })
        return Promise.resolve();
    }

    async returnBook(bookId: string): Promise<void> {
        const jsonDB = database as JsonDB;
        const index = await jsonDB.getIndex('/books', bookId, '_id');
        if(index === -1)
            throw new HttpError(409, `book with id ${bookId} is not found@pickBook`)
        const status = await jsonDB.getData(`/books[${index}]/status`);
        if(status === BookStatus.IN_STOCK)
            throw new HttpError(409, `book with id ${bookId} is already in stock and can't be returned@pickBook`);
        if(status === BookStatus.REMOVED)
            throw new HttpError(409, `book with id ${bookId} is removed and can't be returned@pickBook`);
        const pickIndex = await jsonDB.getIndex(`/books[${index}]/pickList`, null!, 'returnDate');
        await jsonDB.push(`/books[${index}]/pickList[${pickIndex}]/returnDate`, new Date().toLocaleDateString());
        await jsonDB.push(`/books[${index}]/status`, BookStatus.IN_STOCK);
        return Promise.resolve();
    }

    async editBook(data: BookEdit): Promise<Book> {
        const jsonDB = database as JsonDB;
        const index = await jsonDB.getIndex('/books', data._id, '_id');
        if(index === -1)
            throw new HttpError(409, `book with id ${data._id} is not found@pickBook`)
        const status = await jsonDB.getData(`/books[${index}]/status`);
        if(status === BookStatus.REMOVED)
            throw new HttpError(409, `book with id ${data._id} is removed and can't be edited@pickBook`);
        const book = await jsonDB.getData(`/books[${index}]`);
        book.title = data.title || book.title;
        book.author = data.author || book.author;
        book.genre = data.genre || book.genre;
        book.year = data.year || book.year;
        await jsonDB.push(`/books[${index}]`, book);
        return Promise.resolve(book)
    }

    async removeBook(bookId: string): Promise<Book> {
        const jsonDB = database as JsonDB;
        const index = await jsonDB.getIndex('/books', bookId, '_id');
        if(index === -1)
            throw new HttpError(409, `book with id ${bookId} is not found@pickBook`)
        const status = await jsonDB.getData(`/books[${index}]/status`);
        if(status === BookStatus.ON_HAND)
            throw new HttpError(409, `book with id ${bookId} is already on hand and can't be removed@pickBook`);
        if(status === BookStatus.REMOVED){
            await jsonDB.push(`/books[${index}]/status`, BookStatus.DELETED);
            const book = await jsonDB.getData(`/books[${index}]`);
            await jsonDB.delete(`/books[${index}]`);
            return Promise.resolve(book);
        }else{
            await jsonDB.push(`/books[${index}]/status`, BookStatus.REMOVED);
            return Promise.resolve(await jsonDB.getData(`/books[${index}]`));
        }

    }

    async restoreBook(bookId: string): Promise<Book> {
        const jsonDB = database as JsonDB;
        const index = await jsonDB.getIndex('/books', bookId, '_id');
        if(index === -1)
            throw new HttpError(409, `book with id ${bookId} is not found@pickBook`)
        const status = await jsonDB.getData(`/books[${index}]/status`);
        if(status !== BookStatus.REMOVED)
            throw new HttpError(409, `book with id ${bookId} is not removed and can't be removed@pickBook`);
        await jsonDB.push(`/books[${index}]/status`, BookStatus.IN_STOCK);
        return Promise.resolve(await jsonDB.getData(`/books[${index}]`));
    }
}

export const bookServiceJSON = new BookServiceJSON();