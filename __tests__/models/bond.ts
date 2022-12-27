import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

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
} as MongoosasticPluginOpts<IBondModel>);

export const bondModel = model<IBondModel, MongoosasticModel<IBondModel>>('Bond', BondSchema);
