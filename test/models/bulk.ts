import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IBulkModel extends Document, MongoosasticDocument {
  user?: string;
  userId?: number;
  post_date?: Date;
  message?: string;
}

const BulkSchema = new mongoose.Schema<IBulkModel>({
  user: String,
  userId: Number,
  post_date: Date,
  message: String,
});

BulkSchema.plugin(mongoosastic, {
  index: 'bulks',
  type: 'bulk',
});

export const bulkModel = mongoose.model<IBulkModel, MongoosasticModel<IBulkModel>>('Bulk', BulkSchema);
