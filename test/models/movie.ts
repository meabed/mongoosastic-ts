import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IMovieModel extends Document, MongoosasticDocument {
  title?: string;
  genre?: string;
}

const MovieSchema = new mongoose.Schema<IMovieModel>({
  title: {
    type: String,
    required: true,
    default: '',
    es_indexed: true,
  },
  genre: {
    type: String,
    required: true,
    default: '',
    enum: ['horror', 'action', 'adventure', 'other'],
    es_indexed: true,
  },
});

MovieSchema.plugin(mongoosastic, {
  index: 'movies',
  type: 'movie',
} as MongoosasticOpts);

export const movieModel = mongoose.model<IMovieModel, MongoosasticModel<IMovieModel>>('Movie', MovieSchema);
