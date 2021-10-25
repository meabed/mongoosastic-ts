import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IFoodModel extends Document, MongoosasticDocument {
  name?: string;
}

const FoodSchema = new mongoose.Schema<IFoodModel>({
  name: String,
});

FoodSchema.virtual('type').get(() => {
  return 'dinner';
});
FoodSchema.set('toObject', { getters: true, virtuals: true, versionKey: false });

FoodSchema.plugin(mongoosastic, {
  index: 'foods',
  type: 'food',
  customSerialize: (model) => {
    const data = model.toObject();
    delete data.id;
    delete data._id;
    return data;
  },
} as MongoosasticOpts);

export const foodModel = mongoose.model<IFoodModel, MongoosasticModel<IFoodModel>>('Food', FoodSchema);
