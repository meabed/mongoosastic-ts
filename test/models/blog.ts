import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

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
});

export const blogModel = model<IBlogModel, MongoosasticModel<IBlogModel>>('Blog', BlogSchema);
