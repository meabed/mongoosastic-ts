import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface ITweetModel extends Document, MongoosasticDocument {
  user?: string;
  userId?: number;
  post_date?: Date;
  message?: string;
}

const TweetSchema = new Schema<ITweetModel>({
  user: String,
  userId: Number,
  post_date: Date,
  message: String,
});

TweetSchema.plugin(mongoosastic, {
  index: 'tweets',
  type: 'tweet',
});

export const tweetModel = model<ITweetModel, MongoosasticModel<ITweetModel>>('Tweet', TweetSchema);
