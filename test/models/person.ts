import { Document, model, Schema, Types } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export const bowlingBallModel = model('BowlingBall', new Schema());

export interface IPersonModel extends Document, MongoosasticDocument {
  name?: string;
  dob?: Date;
  bowlingBall?: any;
  games?: { score?: number; date?: Date }[];
  somethingToCast?: string;
}

export const PersonSchema = new Schema<IPersonModel>({
  name: {
    first: String,
    last: String,
  },
  dob: Date,
  bowlingBall: {
    type: Types.ObjectId,
    ref: 'BowlingBall',
  },
  games: [
    {
      score: Number,
      date: Date,
    },
  ],
  somethingToCast: {
    type: String,
    es_cast: function (element: string) {
      return element + ' has been cast';
    },
  },
});

PersonSchema.plugin(mongoosastic, {
  index: 'persons',
  type: 'person',
} as MongoosasticOpts<IPersonModel>);

export const personModel = model<IPersonModel, MongoosasticModel<IPersonModel>>('Person', PersonSchema);
