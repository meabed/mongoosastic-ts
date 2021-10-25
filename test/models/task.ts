import mongoose, { Document } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface ITaskModel extends Document, MongoosasticDocument {
  content?: string;
}

const TaskSchema = new mongoose.Schema<ITaskModel>({
  content: {
    type: String,
  },
});

TaskSchema.plugin(mongoosastic, {
  index: 'tasks',
  type: 'task',
  routing: (doc) => {
    return doc.content;
  },
} as MongoosasticOpts<ITaskModel>);

export const taskModel = mongoose.model<ITaskModel, MongoosasticModel<ITaskModel>>('Task', TaskSchema);
