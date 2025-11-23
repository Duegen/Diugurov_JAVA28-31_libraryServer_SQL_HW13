import express from "express";
import {bookController} from "../controllers/BookController.js";
import {validationBody, validationParams, validationQuery} from "../validation/validation.js";
import {authorShema, bookDtoShema, bookShema, genreShema, idShema, picBookShema} from "../joi/joiShema.js";

export const bookRouter = express.Router();

bookRouter.get("/", bookController.getAllBooks);

bookRouter.get('/genres/:genre', validationParams(genreShema), bookController.getBooksByGenre)

bookRouter.get('/authors/:author', validationParams(authorShema), bookController.getBooksByAuthor)

bookRouter.post("/", validationBody(bookDtoShema), bookController.addBook);

bookRouter.delete('/', validationQuery(idShema), bookController.removeBook);

bookRouter.patch('/', validationBody(bookShema), bookController.editBook)

bookRouter.patch('/restore', validationQuery(idShema), bookController.restoreBook);

bookRouter.patch("/pick", validationQuery(picBookShema),bookController.pickBook)

bookRouter.patch("/return", validationQuery(idShema),bookController.returnBook)
