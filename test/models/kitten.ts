import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IKittenModel extends Document, MongoosasticDocument {
  name?: string;
  breed?: string;
}

const KittenSchema = new mongoose.Schema<IKittenModel>({
  name: {
    type: String,
    es_type: 'completion',
    es_analyzer: 'simple',
    es_indexed: true,
  },
  breed: {
    type: String,
  },
});

KittenSchema.plugin(mongoosastic, {
  index: 'kittens',
  type: 'kitten',
});

export const kittenModel = mongoose.model<IKittenModel, MongoosasticModel<IKittenModel>>('Kitten', KittenSchema);
