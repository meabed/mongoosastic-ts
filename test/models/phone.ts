import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

export interface IPhoneModel extends Document, MongoosasticDocument {
  name?: string;
}

const PhoneSchema = new Schema<IPhoneModel>({
  name: {
    type: String,
    es_indexed: true,
  },
});

PhoneSchema.plugin(mongoosastic, {
  index: 'phones',
  type: 'phone',
  transform: function (data, phone) {
    data.created = new Date(phone._id.getTimestamp().getSeconds() * 1000);
    return data;
  },
  customProperties: {
    created: {
      type: 'date',
    },
  },
} as MongoosasticPluginOpts<IPhoneModel>);

export const phoneModel = model<IPhoneModel, MongoosasticModel<IPhoneModel>>('Phone', PhoneSchema);
