import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface IMappingModel extends Document, MongoosasticDocument {
  string?: string;
  mixed_field?: any;
  mixed_arr_field?: any;
  obj_mixed?: any;
}

const MappingSchema = new Schema<IMappingModel>({
  string: String,
  mixed_field: {
    type: Schema.Types.Mixed,
  },
  mixed_arr_field: {
    type: [Schema.Types.Mixed],
  },
  obj_mixed: {
    mixed: {
      type: Schema.Types.Mixed,
    },
  },
});

MappingSchema.plugin(mongoosastic, {
  index: 'mappings',
  type: 'mapping',
} as MongoosasticPluginOpts<IMappingModel>);

export const mappingModel = model<IMappingModel, MongoosasticModel<IMappingModel>>('Mapping', MappingSchema);
