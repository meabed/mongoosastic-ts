import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

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
