import {model, Schema} from "mongoose";
import dotenv from "dotenv";
import * as mongoose from "mongoose";
import {Book} from "../model/book.js";
import { v4 as uuidv4 } from 'uuid';

const pickListSchema = new mongoose.Schema({
    readerId: {type: Number, min: 1, max: 999999999, required:true},
    readerName: {type: String, required:true},
    pickDate: {type: String, required:true},
    returnDate: {type: String, default: null}
}, {
    _id:false
});

export const bookMongoShema = new Schema({
    _id:{type:String, default: () => uuidv4(),unique:true },
    title: {type: String, required: true},
    author: {type: String, required: true},
    genre: {type: String, required: true},
    year: {type: Number, required: true},
    status: {type: String, required: true},
    pickList: {type:[pickListSchema], default: []},
    quantity: {type: Number, required: false},
},{
    versionKey: false
})

export async function mongoConnect(){
    try {
        dotenv.config({quiet: true});
        const mongoCluster = process.env.MONGO_CLASTER ||
            "mongodb+srv://nikitadyugurov:tRcFf0Yt2J0ASgBN@cluster0.p1mqnme.mongodb.net/";
        const mongoDatabase = process.env.MONGO_DATABASE || 'libraryServer';
        const mongoCollection = process.env.MONGO_COLLECTION || 'books';
        await mongoose.connect(mongoCluster + mongoDatabase);
        return Promise.resolve(model<Book>('Books', bookMongoShema, mongoCollection));
    } catch (e) {
        return Promise.reject(e);
    }
}

//export const databaseConnect = mongoConnect;