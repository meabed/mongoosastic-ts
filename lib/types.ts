import mongoose, { Document, LeanDocument, Model, Schema, Types } from 'mongoose';
import { Client, IndexDocumentParams } from 'elasticsearch';

export interface MongoosasticModel<T> extends Model<T> {
  search: (params: any, opt?: any) => Promise<any>;
  createMapping: (settings?: any, mappings?: any) => Promise<any>;
  esTruncate: (opt?: any) => Promise<any>;
  esCount: (opt?: any) => Promise<any>;
  index: (opt?: any) => Promise<any>;
  flush: (opt?: any) => Promise<any>;
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
  routing?: (model: LeanDocument<T>) => any;
  transform: (json: LeanDocument<T> & Record<string | number, any>, model: Document<Types.ObjectId, any, T>) => any;
  filter: (doc: any) => any;
  bulk: {
    batch: number; // preferred number of docs to bulk index
    size: number; // preferred number of docs to bulk index
    delay: number; // milliseconds to wait for enough docs to meet size constraint
  };
  hydrateOptions: any;
  hydrate?: boolean;
  populate: string[];
  index?: string;
  type: string;
}
