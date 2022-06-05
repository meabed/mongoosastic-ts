import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

export interface IBlogModel extends Document, MongoosasticDocument {
  title?: string;
  user?: string;
  rank?: number;
  userId?: number;
  post_date?: Date;
  message?: string;
}

const BlogSchema = new Schema<IBlogModel>({
  title: {
    type: String,
  },
  user: String,
  rank: Number,
  userId: String,
  post_date: {
    type: Date,
    es_type: 'date',
  },
  message: {
    type: String,
  },
});

BlogSchema.plugin(mongoosastic, {
  index: 'blogs',
  type: 'blog',
  log: 'trace',
} as MongoosasticPluginOpts<IBlogModel>);

export const blogModel = model<IBlogModel, MongoosasticModel<IBlogModel>>('Blog', BlogSchema);
