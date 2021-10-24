import mongoose, { Document, Model } from 'mongoose';

const mongoosastic = require('../../lib/mongoosastic');

interface MongoosasticModel extends Model<ITweetModel> {
  search: (params: any, opt?: any) => Promise<any>;
}

interface MongoosasticDocument {
  index: (opt?: any) => Promise<any>;
}

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

export const tweetModel = mongoose.model<ITweetModel, MongoosasticModel>('Tweet', TweetSchema);
