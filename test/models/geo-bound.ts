import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

export interface IGeoBoundModel extends Document, MongoosasticDocument {
  text?: string;
  geo_with_lat_lon?: { geo_point?: string };
  post_date?: number;
  lon?: number;
}

const GeoBoundSchema = new Schema<IGeoBoundModel>({
  text: {
    type: String,
    es_indexed: true,
  },
  geo_with_lat_lon: {
    geo_point: {
      type: String,
      es_type: 'geo_point',
      es_indexed: true,
    },
    lat: { type: Number },
    lon: { type: Number },
  },
});

GeoBoundSchema.plugin(mongoosastic, {
  index: 'geobounds',
  type: 'geobound',
});

export const geoBoundModel = model<IGeoBoundModel, MongoosasticModel<IGeoBoundModel>>('GeoBound', GeoBoundSchema);
