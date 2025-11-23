import {BookService} from "./iBookService.js";
import {Book, BookEdit, BookStatus} from "../model/book.js";
import {database} from "../app.js";
import * as mongoose from "mongoose";
import {v4 as uuidv4} from 'uuid';
import {HttpError} from "../errorHandler/HttpError.js";

class BookServiceImpMongo implements BookService {
    async getBooks(options: Object){
        const model = database as mongoose.Model<Book>
        return await model.find(options)
            .then(data => data)
            .catch((err) => {
                throw new Error('database error: ' + err.message);
            });
    }

    async getAllBooks(): Promise<Book[]> {
        return await this.getBooks({}).then(data => data).catch(err => {
            throw new Error(err.message + '@getAllBooks');
        });
    }

    async getBooksByAuthor(author: string): Promise<Book[]> {
        return await this.getBooks({author: author}).then(data => data).catch(err => {
            throw new Error(err.message + '@getBooksByAuthor');
        });
    }

    async getBooksByGenre(genre: string): Promise<Book[]> {
        return await this.getBooks({genre:genre}).then(data => data).catch(err => {
            throw new Error(err.message + '@getBooksByGenre');
        });
    }

    async addBook(book: Book): Promise<void> {
        const model = database as mongoose.Model<Book>;
        await model.create({...book, _id: uuidv4()}).catch((err) => {
            throw new Error('database error: ' + err.message + '@addBook')
        });
    }

    async getBookById(bookId: string){
        const model = database as mongoose.Model<Book>;
        const bookDoc = await model.findById(bookId)
            .then(bookDoc => bookDoc)
            .catch((err) => {
                throw new Error('database error: ' + err.message)
            });
        if(!bookDoc)
            throw new HttpError(409, `book with id ${bookId} is not found`)
        return bookDoc;
    }

    async removeBook(bookId: string): Promise<Book> {
        const bookDoc = await this.getBookById(bookId)
            .then(data => data)
            .catch( err => {
                if(err instanceof HttpError) throw new HttpError(409, err.message + '@removeBook')
                else throw new Error(err.message + '@removeBook')
        })
        if(bookDoc.status === BookStatus.ON_HAND)
            throw new HttpError(409, `book with id '${bookId}' is on hand and can't be removed@removeBook`)
        if(bookDoc.status === BookStatus.REMOVED){
            bookDoc.status = BookStatus.DELETED;
            await bookDoc.deleteOne().catch(err => {
                throw new Error('database error: ' + err.message + '@removeBook');
            });
        }else{
            bookDoc.status = BookStatus.REMOVED;
            await bookDoc.save().catch(err => {
                throw new Error('database error: ' + err.message + '@removeBook');
            });
        }
        return Promise.resolve(bookDoc as Book);
    }

    async editBook(editData: BookEdit):Promise<Book>{
        const bookDoc = await this.getBookById(editData._id)
            .then(data => data)
            .catch( err => {
                if(err instanceof HttpError) throw new HttpError(409, err.message + '@editBook')
                else throw new Error(err.message + '@editBook')
            })
        if(bookDoc.status === BookStatus.REMOVED)
            throw new HttpError(409, `book with id '${editData._id}' is removed and can't be edited@editBook`)
        bookDoc.title = editData.title || bookDoc.title;
        bookDoc.author = editData.author || bookDoc.author;
        bookDoc.genre = editData.genre || bookDoc.genre;
        bookDoc.year = editData.year || bookDoc.year;
        await bookDoc.save().catch(err => {
            throw new Error('database error: ' + err.message + '@editBook');
        });
        return Promise.resolve(bookDoc as Book);
    };

    async restoreBook(bookId: string):Promise<Book>{
        const bookDoc = await this.getBookById(bookId)
            .then(data => data)
            .catch( err => {
                if(err instanceof HttpError) throw new HttpError(409, err.message + '@restoreBook')
                else throw new Error(err.message + '@restoreBook')
            })
        if(bookDoc.status !== BookStatus.REMOVED)
            throw new HttpError(409, `book with id '${bookId}' is not removed and can't be restored@restoreBook`)
        bookDoc.status = BookStatus.IN_STOCK;
        await bookDoc.save().catch(err => {
            throw new Error('database error: ' + err.message + '@restoreBook');
        });
        return Promise.resolve(bookDoc as Book);
    }

    async pickBook(bookId: string, readerName: string, readerId: number): Promise<void> {
        const bookDoc = await this.getBookById(bookId)
            .then(data => data)
            .catch( err => {
                if(err instanceof HttpError) throw new HttpError(409, err.message + '@pickBook')
                else throw new Error(err.message + '@pickBook')
            })
        if (bookDoc.status === BookStatus.REMOVED)
            throw new HttpError(409, `book with id ${bookId} is removed and can't be picked@pickBook`);
        if (bookDoc.status === BookStatus.ON_HAND)
            throw new HttpError(409, `book with id ${bookId} is already on hand@pickBook`)
        bookDoc.status = BookStatus.ON_HAND;
        bookDoc.pickList.push({
            readerId: readerId,
            readerName: readerName,
            pickDate: new Date().toLocaleDateString(),
            returnDate: null
        })
        await bookDoc.save().then(() => {
            return Promise.resolve();
        }).catch(err => {
            throw new Error('database error: ' + err.message + '@pickBook');
        });
    }

    async returnBook(bookId: string): Promise<void> {
        const bookDoc = await this.getBookById(bookId)
            .then(data => data)
            .catch( err => {
                if(err instanceof HttpError) throw new HttpError(409, err.message + '@returnBook')
                else throw new Error(err.message + '@returnBook')
            })
        if (bookDoc.status === BookStatus.REMOVED)
            throw new HttpError(409, `book with id '${bookId}' is removed and can't be returned@returnBook`)
        if (bookDoc.status === BookStatus.IN_STOCK)
            throw new HttpError(409, `book with id '${bookId}' is not on hand and can't be returned@returnBook`)
        bookDoc.status = BookStatus.IN_STOCK;
        const index = bookDoc.pickList.findIndex(list => !list.returnDate)
        bookDoc.pickList[index].returnDate = new Date().toLocaleDateString();
        await bookDoc.save().then(() => {
            return Promise.resolve();
        }).catch(err => {
            throw new Error('database error: ' + err.message + '@returnBook');
        });
    }
}

export const bookServiceMongo = new BookServiceImpMongo();