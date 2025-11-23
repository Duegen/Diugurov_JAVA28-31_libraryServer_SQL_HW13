export type BookDto = {
    title: string,
    author: string,
    genre: string,
    year: number,
    quantity?: number,
}

export type Book = {
    _id?: string,
    title: string,
    author: string,
    genre: BookGenres,
    year: number,
    status: BookStatus,
    pickList: PickRecord[];
    quantity?: number,
}

export type BookEdit = {
    _id: string,
    title?: string,
    author?: string,
    genre?: BookGenres,
    year?: number,
}

export enum BookGenres {
    CLASSIC = 'classic',
    DETECTIVE = 'detective',
    ROMANTIC = 'romantic',
    DYSTOPIA = 'dystopia',
    FANTASY = 'fantasy',
    KIDS = 'kids',
}

export enum BookStatus {
    IN_STOCK = 'in_stock',
    ON_HAND = 'on_hand',
    REMOVED = 'removed',
    DELETED = 'deleted',
}

export type PickRecord = {
    readerId: number,
    readerName: string,
    pickDate: string,
    returnDate: string | null
}