import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IBlogModel extends Document, MongoosasticDocument {
  title?: string;
  user?: string;
  userId?: number;
  post_date?: Date;
  message?: string;
}

const BlogSchema = new mongoose.Schema<IBlogModel>({
  title: {
    type: String,
    es_boost: 2.0,
  },
  user: String,
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

export const blogModel = mongoose.model<IBlogModel, MongoosasticModel<IBlogModel>>('Blog', BlogSchema);
