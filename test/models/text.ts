import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

export interface ITextModel extends Document, MongoosasticDocument {
  title?: string;
  quote?: number;
}

const TextSchema = new Schema<ITextModel>({
  title: String,
  quote: String,
});

TextSchema.plugin(mongoosastic, {
  index: 'texts',
  type: 'text',
} as MongoosasticPluginOpts<ITextModel>);

export const textModel = model<ITextModel, MongoosasticModel<ITextModel>>('Text', TextSchema);
