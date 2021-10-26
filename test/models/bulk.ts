import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IBulkModel extends Document, MongoosasticDocument {
  title?: string;
  user?: string;
  userId?: number;
  random?: number;
  post_date?: Date;
  message?: string;
}

const BulkSchema = new Schema<IBulkModel>({
  title: String,
  user: String,
  random: { type: Number, es_type: 'keyword', es_boost: 2.0 },
  userId: Number,
  post_date: Date,
  message: String,
});

BulkSchema.plugin(mongoosastic, {
  index: 'bulks',
  type: 'bulk',
  bulk: {
    size: 2,
    delay: 100,
  },
} as MongoosasticPluginOpts);

export const bulkModel = model<IBulkModel, MongoosasticModel<IBulkModel>>('Bulk', BulkSchema);
