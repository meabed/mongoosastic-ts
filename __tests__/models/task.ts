import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface ITaskModel extends Document, MongoosasticDocument {
  content?: string;
  random?: number;
}

const TaskSchema = new Schema<ITaskModel>({
  content: {
    type: String,
  },
  random: { type: Number, es_type: 'string' },
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
