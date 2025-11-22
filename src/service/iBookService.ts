import {Book} from "../model/book.js";

export interface BookService{
    getAllBooks: () => Promise<Book[]>;
    getBooksByGenre: (genre: string) => Promise<Book[]>;
    getBooksByAuthor: (author: string) => Promise<Book[]>;
    addBook: (book: Book) => Promise<void>;
    removeBook: (id: string) => Promise<Book>;
    pickBook: (id: string, reader: string, readerId:number) => Promise<void>;
    returnBook: (id: string) => Promise<void>;
}