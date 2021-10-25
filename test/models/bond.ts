import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IBondModel extends Document, MongoosasticDocument {
  name?: string;
  type?: string;
  price?: number;
}

const BondSchema = new Schema<IBondModel>({
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

export const bondModel = model<IBondModel, MongoosasticModel<IBondModel>>('Bond', BondSchema);
