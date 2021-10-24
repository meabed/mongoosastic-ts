import { Model } from 'mongoose';

export interface MongoosasticModel<T> extends Model<T> {
  search: (params: any, opt?: any) => Promise<any>;
  createMapping: (opt?: any) => Promise<any>;
  esTruncate: (opt?: any) => Promise<any>;
}

export interface MongoosasticDocument {
  index: (opt?: any) => Promise<any>;
}
