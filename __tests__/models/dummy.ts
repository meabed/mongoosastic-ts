import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticModel } from '../../src/types';
import { Schema, model } from 'mongoose';

const indexName = 'es-test';

const DummySchema = new Schema({
  text: String,
});
const DummySchemaRefresh = new Schema({
  text: String,
});

DummySchema.plugin(mongoosastic, {
  index: indexName,
  type: '_doc',
});

DummySchemaRefresh.plugin(mongoosastic, {
  index: indexName,
  type: '_doc',
  forceIndexRefresh: true,
});

export const Dummy = model<typeof DummySchema, MongoosasticModel<typeof DummySchema>>('Dummy', DummySchema);

export const DummyRefresh = model<typeof DummySchemaRefresh, MongoosasticModel<typeof DummySchemaRefresh>>(
  'DummyRefresh',
  DummySchemaRefresh
);
