import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

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
  random: { type: Number, es_type: 'keyword' },
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
