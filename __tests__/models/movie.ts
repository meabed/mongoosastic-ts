import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface IMovieModel extends Document, MongoosasticDocument {
  title?: string;
  genre?: string;
}

const MovieSchema = new Schema<IMovieModel>({
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
  filter: function (self) {
    return self.genre === 'action';
  },
} as MongoosasticPluginOpts);

export const movieModel = model<IMovieModel, MongoosasticModel<IMovieModel>>('Movie', MovieSchema);
