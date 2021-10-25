import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IBookModel extends Document, MongoosasticDocument {
  title?: string;
}

const BookSchema = new Schema<IBookModel>({
  title: {
    type: String,
    required: true,
  },
});

BookSchema.plugin(mongoosastic, {
  index: 'books',
  type: 'book',
} as MongoosasticOpts);

export let bookModelSaveCounter = 0;

export function setBookModelSaveCounter(n: number) {
  bookModelSaveCounter = n;
}

BookSchema.pre('save', function (next) {
  // Count save
  ++bookModelSaveCounter;
  next();
});

export const bookModel = model<IBookModel, MongoosasticModel<IBookModel>>('Book', BookSchema);
