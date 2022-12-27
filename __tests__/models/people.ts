import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface IPeopleModel extends Document, MongoosasticDocument {
  name?: string;
  phone?: string;
  address?: string;
  life?: { born?: number; died?: number };
  bowlingBall?: any;
  games?: { score?: number; date?: Date }[];
  somethingToCast?: string;
}

export const PeopleSchema = new Schema<IPeopleModel>({
  name: {
    type: String,
    es_indexed: true,
  },
  phone: {
    type: String,
    es_indexed: true,
  },
  address: String,
  life: {
    born: {
      type: Number,
      es_indexed: true,
    },
    died: {
      type: Number,
      es_indexed: true,
    },
  },
});

PeopleSchema.plugin(mongoosastic, {
  index: 'people',
  type: 'dude',
  hydrate: true,
  hydrateOptions: {
    lean: true,
    sort: '-name',
    select: 'address name life',
  },
} as MongoosasticPluginOpts<IPeopleModel>);

export const peopleModel = model<IPeopleModel, MongoosasticModel<IPeopleModel>>('People', PeopleSchema);

export interface ITalkModel extends Document, MongoosasticDocument {
  speaker?: string;
  year?: number;
  title?: string;
  abstract?: string;
  bio?: string;
}

export const TalkSchema = new Schema<ITalkModel>({
  speaker: String,
  year: {
    type: Number,
    es_indexed: true,
  },
  title: {
    type: String,
    es_indexed: true,
  },
  abstract: {
    type: String,
    es_indexed: true,
  },
  bio: String,
});

TalkSchema.plugin(mongoosastic);

export const talkModel = model<ITalkModel, MongoosasticModel<ITalkModel>>('Talk', TalkSchema);

export interface IBumModel extends Document, MongoosasticDocument {
  name?: string;
}

const BumSchema = new Schema<IBumModel>({
  name: String,
});
BumSchema.plugin(mongoosastic, {
  index: 'ms_sample',
  type: 'bum',
});

export const bumModel = model<IBumModel, MongoosasticModel<IBumModel>>('Bum', BumSchema);

export interface IDogModel extends Document, MongoosasticDocument {
  name?: string;
}

const DogSchema = new Schema<IDogModel>({
  name: { type: String, es_indexed: true },
});

DogSchema.plugin(mongoosastic, {
  indexAutomatically: false,
} as MongoosasticPluginOpts<IDogModel>);

export const dogModel = model<IDogModel, MongoosasticModel<IDogModel>>('Dog', DogSchema);
