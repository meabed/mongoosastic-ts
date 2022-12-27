import { mongoosastic } from '../../src/mongoosastic';
import { MongoosasticDocument, MongoosasticModel, MongoosasticPluginOpts } from '../../src/types';
import { Document, Schema, model } from 'mongoose';

export interface IRepoModel extends Document, MongoosasticDocument {
  name?: string;
  settingLicense?: string;
  detectedLicense?: string;
}

const RepoSchema = new Schema<IRepoModel>({
  name: {
    type: String,
    es_indexed: true,
  },
  settingLicense: {
    type: String,
  },
  detectedLicense: {
    type: String,
  },
});

RepoSchema.plugin(mongoosastic, {
  index: 'repos',
  type: 'repo',
  transform: function (data, repo) {
    data.license = repo.settingLicense || repo.detectedLicense;
    return data;
  },
} as MongoosasticPluginOpts<IRepoModel>);

export const repoModel = model<IRepoModel, MongoosasticModel<IRepoModel>>('Repo', RepoSchema);
