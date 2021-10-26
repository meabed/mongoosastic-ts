import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IFoodModel extends Document, MongoosasticDocument {
  name?: string;
}

const FoodSchema = new Schema<IFoodModel>({
  name: String,
});

FoodSchema.virtual('type').get(function () {
  return 'dinner';
});
FoodSchema.set('toObject', { getters: true, virtuals: true, versionKey: false });

FoodSchema.plugin(mongoosastic, {
  index: 'foods',
  type: 'food',
  customSerialize: function (model) {
    const data = model.toObject();
    delete data.id;
    delete data._id;
    return data;
  },
} as MongoosasticPluginOpts);

export const foodModel = model<IFoodModel, MongoosasticModel<IFoodModel>>('Food', FoodSchema);
