import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface ICommentModel extends Document, MongoosasticDocument {
  title?: string;
  user?: string;
  userId?: number;
  random?: number;
  post_date?: Date;
  message?: string;
}

const CommentSchema = new Schema<ICommentModel>({
  title: String,
  user: String,
  random: { type: Number, es_type: 'keyword', es_boost: 2.0 },
  userId: Number,
  post_date: Date,
  message: String,
});

CommentSchema.plugin(mongoosastic, {
  index: 'comments',
  type: 'comment',
  bulk: {
    size: 2,
    delay: 100,
  },
} as MongoosasticOpts);

export const commentModel = model<ICommentModel, MongoosasticModel<ICommentModel>>('Comment', CommentSchema);
