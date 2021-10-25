import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface IPhoneModel extends Document, MongoosasticDocument {
  name?: string;
}

const PhoneSchema = new mongoose.Schema<IPhoneModel>({
  name: {
    type: String,
    es_indexed: true,
  },
});

PhoneSchema.plugin(mongoosastic, {
  index: 'phones',
  type: 'phone',
  transform: (data, phone) => {
    data.created = new Date(phone._id.getTimestamp().getSeconds() * 1000);
    return data;
  },
  customProperties: {
    created: {
      type: 'date',
    },
  },
} as MongoosasticOpts<IPhoneModel>);

export const phoneModel = mongoose.model<IPhoneModel, MongoosasticModel<IPhoneModel>>('Phone', PhoneSchema);
