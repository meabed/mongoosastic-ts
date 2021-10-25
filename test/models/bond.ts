import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IBondModel extends Document, MongoosasticDocument {
  name?: string;
  type?: string;
  price?: number;
}

const BondSchema = new mongoose.Schema<IBondModel>({
  name: String,
  type: {
    type: String,
    default: 'Other Bond',
  },
  price: Number,
});

BondSchema.plugin(mongoosastic, {
  index: 'bonds',
  type: 'bond',
} as MongoosasticOpts<IBondModel>);

export const bondModel = mongoose.model<IBondModel, MongoosasticModel<IBondModel>>('Bond', BondSchema);
