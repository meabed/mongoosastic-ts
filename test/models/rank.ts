import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

export interface IRankModel extends Document, MongoosasticDocument {
  title?: string;
  user?: string;
  rank?: number;
  userId?: number;
  post_date?: Date;
  message?: string;
}

const RankSchema = new Schema<IRankModel>({
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

RankSchema.plugin(mongoosastic, {
  index: 'ranks',
  type: 'rank',
});

export const rankModel = model<IRankModel, MongoosasticModel<IRankModel>>('Rank', RankSchema);
