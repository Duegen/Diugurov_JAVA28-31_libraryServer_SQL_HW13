import BaseJoi, { Extension, Root } from 'joi'
import JoiDate from '@joi/date'
import {BookGenres} from "../model/book.js";

const Joi = BaseJoi.extend(JoiDate as unknown as Extension) as Root

export const bookDtoShema = Joi.object({
    title: Joi.string().min(2).max(30).required(),
    author: Joi.string().min(2).max(30).required(),
    genre: Joi.string().valid(...Object.values(BookGenres)).required(),
    year: Joi.number().min(1900).max(new  Date().getFullYear()).integer().required(),
    quantity: Joi.number().min(1).positive().max(100).optional(),
})

export const genreShema = Joi.object({
    genre: Joi.string().valid(...Object.values(BookGenres)).required(),
})

export const idShema = Joi.object({
    bookId: Joi.string().required(),
})

export const picBookShema = Joi.object({
    bookId: Joi.string().required(),
    readerName: Joi.string().min(3).required(),
    readerId: Joi.number().integer().min(1).required(),
})

export const authorShema = Joi.object({
    author: Joi.string().required(),
})

export const dateLogShema = Joi.object({
    date: Joi.date().format('DD.MM.YYYY').max('now').required(),
})