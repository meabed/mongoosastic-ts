import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

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
  random: { type: Number, es_type: 'keyword' },
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
} as MongoosasticPluginOpts);

export const commentModel = model<ICommentModel, MongoosasticModel<ICommentModel>>('Comment', CommentSchema);
