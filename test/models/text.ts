import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

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
