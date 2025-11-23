import {BookService} from "../service/iBookService.js";
import {Response, Request} from "express";
import {Book, BookDto, BookEdit, BookStatus} from "../model/book.js";
import {convertBookDtoToBook} from "../utils/tools.js";
import {loggerWinston} from "../winston/logger.js";
import {bookService} from "../database/databaseConfig.js";

export class BookController {
    private service: BookService = bookService;

    addBook = async (req: Request, res: Response): Promise<void> => {
        const dto = req.body as BookDto;
        const book:Book = convertBookDtoToBook(dto);
        const result = await this.service.addBook(book);
        res.status(201).json(result);
        loggerWinston.info(`book with id '${book._id}' is added@addBook`)
    }

    getAllBooks = async (req:Request, res: Response)=> {
        const result = await this.service.getAllBooks();
        if(result.length){
            res.status(200).json(result);
            loggerWinston.info(`all books are responsed@getAllBooks`);
        }else{
            res.status(200).send(`book list is empty@getAllBooks`);
            loggerWinston.error(`book list is empty@getAllBooks`);
        }
    }

    getBooksByGenre = async (req:Request, res: Response): Promise<void> => {
        const result = await this.service.getBooksByGenre(req.params.genre);
        if(result.length){
            res.status(200).json(result);
            loggerWinston.info(`all books with genre '${req.params.genre}' are responsed@getBooksByGenre`)
        }else{
            res.status(200).send(`books with genre '${req.params.genre}' not found@getBooksByGenre`);
            loggerWinston.error(`books with genre '${req.params.genre}' not found@getBooksByGenre`)
        }
    }

    getBooksByAuthor = async (req:Request, res: Response): Promise<void> => {
        const result = await this.service.getBooksByAuthor(req.params.author);
        if(result.length){
            res.status(200).json(result);
            loggerWinston.info(`all books with author '${req.params.author}' are responsed@getBooksByAuthor`)
        }else{
            res.status(200).send(`books with author '${req.params.author}' not found@getBooksByAuthor`);
            loggerWinston.error(`books with author '${req.params.author}' not found@getBooksByAuthor`)
        }
    }

    editBook = async (req:Request, res: Response): Promise<void> => {
        const body = req.body as BookEdit;
        const result = await this.service.editBook(body);
        res.status(200).json(result);
        loggerWinston.info(`book with id '${body._id}' is edited@editBook`)
    }

    removeBook = async (req:Request, res: Response): Promise<void> => {
        const result = await this.service.removeBook(req.query.bookId + "");
        res.status(200).json(result);
        if(result.status === BookStatus.REMOVED)
            loggerWinston.info(`book with id '${req.query.bookId}' is marked as removed@removeBook`)
        else
            loggerWinston.info(`book with id '${req.query.bookId}' is deleted@removeBook`)
    }

    restoreBook = async (req:Request, res: Response): Promise<void> => {
        const result = await this.service.restoreBook(req.query.bookId + "");
        res.status(200).json(result);
        loggerWinston.info(`book with id '${req.query.bookId}' is restored@restoreBook`)
    }

    pickBook =  async (req: Request, res: Response): Promise<void> => {
        const result = await this.service.pickBook(req.query.bookId + "", req.query.readerName + "", +req.query.readerId!);
        res.status(200).json(result);
        loggerWinston.info(`book with id '${req.query.bookId}' is picked@pickBook`)
    }

    returnBook = async (req: Request, res: Response): Promise<void> => {
        const  result = await this.service.returnBook(req.query.bookId + "")
        res.status(200).json(result);
        loggerWinston.info(`book with id '${req.query.id}' is returned@returnBook`)
    }
}

export const bookController =  new BookController();