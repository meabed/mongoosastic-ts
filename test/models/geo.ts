import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

export interface IGeoModel extends Document, MongoosasticDocument {
  myId?: number;
  frame?: { coordinates?: any[]; type?: string; geo_shape?: string };
}

const GeoSchema = new Schema<IGeoModel>({
  myId: Number,
  frame: {
    coordinates: [],
    type: {
      type: String,
    },
    geo_shape: {
      type: String,
      es_type: 'geo_shape',
      // es_tree: 'quadtree', // deprecated https://www.elastic.co/guide/en/elasticsearch/reference/7.17/breaking-changes-7.0.html
      // es_precision: '10km', // deprecated https://www.elastic.co/guide/en/elasticsearch/reference/7.17/breaking-changes-7.0.html
    },
  },
});

GeoSchema.plugin(mongoosastic, {
  index: 'geos',
  type: 'geo',
});

export const geoModel = model<IGeoModel, MongoosasticModel<IGeoModel>>('Geo', GeoSchema);
