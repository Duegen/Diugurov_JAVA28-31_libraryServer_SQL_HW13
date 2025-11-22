import express from "express";
import {bookRouter} from "./bookRouter.js";
import {logRouter} from "./logRouter.js";

export const apiRouter = express.Router();

apiRouter.use('/books', bookRouter);
apiRouter.use('/logger',logRouter);