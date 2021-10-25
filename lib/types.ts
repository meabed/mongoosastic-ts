import { Document, LeanDocument, Model, Schema, Types } from 'mongoose';
import { Client, IndexDocumentParams, NameList } from 'elasticsearch';

export type MongoosasticNestedOpts = Record<
  string,
  string | boolean | number | Record<string, string | boolean | number>
>;

export interface IMongoosasticSearchParam {
  query_string?: Record<string, any>;
  match_all?: Record<string, any>;
  match?: Record<string, any>;
  range?: Record<string, any>;
  term?: Record<string, any>;
}

export interface IMongoosasticSearchOpts {
  suggest?: any;
  sort?: any;
  min_score?: number;
  aggs?: any;
  highlight?: boolean;
  index?: string;
  routing?: string;
  hydrate?: boolean;
  hydrateOptions?: { lean?: boolean; sort?: string; select?: string };
}

export interface MongoosasticModel<T> extends Model<T> {
  search: (params: IMongoosasticSearchParam, opt?: IMongoosasticSearchOpts) => Promise<any>;
  createMapping: (settings?: any, mappings?: any) => Promise<any>;
  esTruncate: (opt?: MongoosasticNestedOpts) => Promise<any>;
  esCount: (opt?: MongoosasticNestedOpts) => Promise<any>;
  index: (opt?: MongoosasticNestedOpts) => Promise<any>;
  flush: (opt?: MongoosasticNestedOpts) => Promise<any>;
  refresh: (opt?: MongoosasticNestedOpts) => Promise<any>;
  esClient: Client;
}

export interface MongoosasticDocument {
  index: (opt?: any) => Promise<any>;
  unIndex: (opt?: any) => Promise<any>;
}

export interface MongoosasticBulkIndexOpts extends Partial<IndexDocumentParams<any>> {
  model?: any;
  _id?: string;
}

export interface MongoosasticSchema<T> extends Schema<T> {
  statics: MongoosasticModel<any> & Schema<T>['statics'];
}

export interface MongoosasticOpts<T = any> {
  log?: string;
  auth?: string;
  protocol?: string;
  port?: number;
  host?: string;
  hosts?: string[];
  esClient?: Client;
  saveOnSynchronize?: boolean;
  indexAutomatically?: boolean;
  forceIndexRefresh?: boolean;
  customSerialize?: (doc?: any, mapping?: any) => any;
  customProperties?: any;
  routing?: (document: LeanDocument<T>) => any;
  transform: (
    json: LeanDocument<T> & Record<string | number, any>,
    document: Document<Types.ObjectId, any, T> & Omit<LeanDocument<T>, '_id'>
  ) => any;
  filter: (doc: any) => any;
  bulk: {
    batch: number; // preferred number of docs to bulk index
    size: number; // preferred number of docs to bulk index
    delay: number; // milliseconds to wait for enough docs to meet size constraint
  };
  hydrateOptions: { lean?: boolean; sort?: string; select?: string };
  hydrate?: boolean;
  populate: string[];
  index?: string;
  type: string;
}
