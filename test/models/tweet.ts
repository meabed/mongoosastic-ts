import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface ITweetModel extends Document, MongoosasticDocument {
  user?: string;
  userId?: number;
  post_date?: Date;
  message?: string;
}

const TweetSchema = new mongoose.Schema<ITweetModel>({
  user: String,
  userId: Number,
  post_date: Date,
  message: String,
});

TweetSchema.plugin(mongoosastic, {
  index: 'tweets',
  type: 'tweet',
});

export const tweetModel = mongoose.model<ITweetModel, MongoosasticModel<ITweetModel>>('Tweet', TweetSchema);
