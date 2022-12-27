import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface IRefreshModel extends Document, MongoosasticDocument {
  title?: string;
}

const RefreshSchema = new Schema<IRefreshModel>({
  title: {
    type: String,
  },
});

RefreshSchema.plugin(mongoosastic, {
  index: 'refreshes',
  type: 'refresh',
} as MongoosasticPluginOpts<IRefreshModel>);

export const refreshModel = model<IRefreshModel, MongoosasticModel<IRefreshModel>>('Refresh', RefreshSchema);
