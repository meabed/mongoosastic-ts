import { Document, model, Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';

import { mongoosastic } from '../../lib/mongoosastic';

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
      es_tree: 'quadtree',
      es_precision: '1km',
    },
  },
});

GeoSchema.plugin(mongoosastic, {
  index: 'geos',
  type: 'geo',
});

export const geoModel = model<IGeoModel, MongoosasticModel<IGeoModel>>('Geo', GeoSchema);
