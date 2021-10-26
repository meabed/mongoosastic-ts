import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface ITaskModel extends Document, MongoosasticDocument {
  content?: string;
  random?: number;
}

const TaskSchema = new Schema<ITaskModel>({
  content: {
    type: String,
  },
  random: { type: Number, es_type: 'string', es_boost: 2.0 },
});

TaskSchema.plugin(mongoosastic, {
  index: 'tasks',
  type: 'task',
  routing: function (doc) {
    return doc.content;
  },
  transform: function (json, document) {
    if (json.random) {
      // @ts-ignore
      json.random = String(document.random);
    }
    return json;
  },
} as MongoosasticPluginOpts<ITaskModel>);

export const taskModel = model<ITaskModel, MongoosasticModel<ITaskModel>>('Task', TaskSchema);
