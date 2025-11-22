import {NextFunction, Request, Response} from "express";
import {HttpError} from "../errorHandler/HttpError.js";
import Joi from "joi";

export const validationQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const {error} = schema.validate(req.query);
        if (error) throw new HttpError(400, error.message);
        next();
    }
}

export const validationParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const {error} = schema.validate(req.params);
        if (error) throw new HttpError(400, error.message);
        next();
    }
}

export const validationBody = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const {error} = schema.validate(req.body);
        if (error) throw new HttpError(400, error.message);
        next();
    }
}