import { Generator } from './mapping-generator';
import { serialize } from './serialize';
import {
  IMongoosasticSearchOpts,
  MongoosasticBulkIndexOpts,
  MongoosasticModel,
  MongoosasticPluginOpts,
  MongoosasticSchema,
} from './types';
import { ConfigOptions, Client as EsClient, IndexDocumentParams, SearchParams } from 'elasticsearch';
import events from 'events';
import { Model, Query, Schema } from 'mongoose';

function isString(subject: unknown) {
  return typeof subject === 'string';
}

function isStringArray(arr: any) {
  return arr.filter && arr.length === arr.filter((item: any) => typeof item === 'string').length;
}

function createEsClient(options: MongoosasticPluginOpts) {
  const esOptions: ConfigOptions = {};

  const {
    host = 'localhost',
    port = 9200,
    protocol = 'http',
    auth = null,
    keepAlive = false,
    hosts,
    log = null,
  } = options;
  if (Array.isArray(hosts)) {
    esOptions.host = hosts;
  } else {
    esOptions.host = {
      host,
      port,
      protocol,
      auth,
      keepAlive,
    };
  }

  esOptions.log = log;

  return new EsClient(esOptions);
}

function filterMappingFromMixed(props: any) {
  const filteredMapping: Record<string, any> = {};
  Object.keys(props).map((key) => {
    const field = props[key];
    if (field.type !== 'mixed') {
      filteredMapping[key] = field;
      if (field.properties) {
        filteredMapping[key].properties = filterMappingFromMixed(field.properties);
        if (!Object.keys(filteredMapping[key].properties).length) {
          delete filteredMapping[key].properties;
        }
      }
    }
  });
  return filteredMapping;
}

async function createMappingIfNotPresent(options: {
  client: EsClient;
  indexName: string;
  typeName: string;
  schema: Schema<any>;
  settings: any;
  mappings?: any;
  properties: any;
}) {
  const { client, indexName, typeName, schema, properties, mappings, settings } = options;

  const completeMapping: Record<string, any> = {};

  if (!mappings) {
    completeMapping[typeName] = Generator.generateMapping(schema);
    console.log('completeMapping', typeName, completeMapping[typeName]);
    completeMapping[typeName].properties = filterMappingFromMixed(completeMapping[typeName].properties);
    if (properties) {
      Object.keys(properties).map((key) => {
        completeMapping[typeName].properties[key] = properties[key];
      });
    }
  } else {
    completeMapping[typeName] = mappings;
  }

  const inputMapping = completeMapping[typeName];

  const exists = await client.indices.exists({
    index: indexName,
  });

  if (exists) {
    return await client.indices.putMapping({
      type: undefined, // deprecated -- use esVersion 7.x
      index: indexName,
      body: inputMapping,
    });
  }

  return await client.indices.create({
    index: indexName,
    body: { settings, mappings: inputMapping },
  });
}

async function hydrate(res: any, model: any, options: any) {
  const results = res.hits;
  const resultsMap: Record<string, string> = {};
  const ids = results.hits.map((result: any, idx: any) => {
    resultsMap[result._id] = idx;
    return result._id;
  });

  const query = model.find({
    _id: {
      $in: ids,
    },
  });
  const hydrateOptions = options.hydrateOptions;

  // Build Mongoose query based on hydrate options
  // Example: {lean: true, sort: '-name', select: 'address name'}
  Object.keys(hydrateOptions).forEach((option) => {
    query[option](hydrateOptions[option]);
  });

  const docs = await query.exec();
  let hits;
  const docsMap: Record<string, string> = {};

  if (!docs || docs.length === 0) {
    results.hits = [];
    res.hits = results;
    return res;
  }

  if (hydrateOptions.sort) {
    // Hydrate sort has precedence over ES result order
    hits = docs;
  } else {
    // Preserve ES result ordering
    docs.forEach((doc: any) => {
      docsMap[doc._id] = doc;
    });
    hits = results.hits.map((result: any) => docsMap[result._id]);
  }

  if (options.highlight || options.hydrateWithESResults) {
    hits.forEach((doc: any) => {
      const idx = resultsMap[doc._id];
      if (options.highlight) {
        doc._highlight = results.hits[idx].highlight;
      }
      if (options.hydrateWithESResults) {
        // Add to doc ES raw result (with, e.g., _score value)
        doc._esResult = results.hits[idx];
        if (!options.hydrateWithESResults.source) {
          // Remove heavy load
          delete doc._esResult._source;
        }
      }
    });
  }

  results.hits = hits;
  res.hits = results;
  return res;
}

type DeleteOpts = {
  index: string;
  client: EsClient;
  model: any;
  routing?: string;
  tries?: number;
};

async function deleteByMongoId(options: DeleteOpts) {
  const { index, client, model, tries = 0, routing } = options;
  return client
    .delete({
      maxRetries: tries,
      type: undefined, // deprecated -- use esVersion 7.x
      index: index,
      id: model._id.toString(),
      routing: routing,
    })
    .then((res) => {
      if (res.result === 'deleted') {
        model.emit('es-removed', undefined, res);
      } else {
        model.emit('es-removed', res, res);
      }
    })
    .catch((e) => {
      model.emit('es-removed', e, undefined);
    });
}

export function mongoosastic(schema: MongoosasticSchema<any>, pluginOpts: MongoosasticPluginOpts) {
  const options = pluginOpts || ({} as MongoosasticPluginOpts);

  let bulkTimeout: any;
  let bulkBuffer: any = [];
  const {
    populate,
    hydrate: alwaysHydrate,
    hydrateOptions: defaultHydrateOptions,
    filter,
    transform,
    routing,
    customProperties,
    customSerialize,
    forceIndexRefresh,
  } = options;

  const mapping = Generator.generateMapping(schema);
  const indexAutomatically = !(options && options.indexAutomatically === false);
  const saveOnSynchronize = !(options && options.saveOnSynchronize === false);
  const bulkErrEm = new events.EventEmitter();
  const esClient = options.esClient ?? createEsClient(options);
  let { index: indexName, type: typeName, bulk } = options;

  const { esVersion = '8' } = options;

  function setIndexNameIfUnset(model) {
    const modelName = model.toLowerCase();
    if (!indexName) {
      indexName = `${modelName}s`;
    }

    if (!typeName) {
      typeName = modelName;
    }
  }

  async function postSave(doc: Model<any>) {
    let _doc: MongoosasticModel<any> & Query<any, any>;

    function onIndex(err: any, res: any) {
      if (!filter || !filter(doc)) {
        doc.emit('es-indexed', err, res);
      } else {
        doc.emit('es-filtered', err, res);
      }
    }

    if (doc) {
      // todo check populate and fix constructor typing
      // @ts-expect-error ts-migrate(2351) FIXME: This expression is not constructable.
      _doc = new doc.constructor(doc);
      if (populate && populate.length) {
        const popDoc = await _doc.populate(populate);
        popDoc
          .index()
          .then((res) => {
            onIndex(undefined, res);
          })
          .catch((e) => {
            onIndex(e, undefined);
          });
      } else {
        return _doc
          .index()
          .then((res) => {
            onIndex(undefined, res);
          })
          .catch((e) => {
            onIndex(e, undefined);
          });
      }
    }
  }

  function clearBulkTimeout() {
    clearTimeout(bulkTimeout);
    bulkTimeout = undefined;
  }

  async function bulkAdd(instruction: any) {
    bulkBuffer.push(instruction);

    // Return because we need the doc being indexed
    // Before we start inserting
    if (instruction?.index?._index) {
      return;
    }

    if (bulkBuffer.length >= (bulk?.size || 1000)) {
      await schema.statics.flush();
      clearBulkTimeout();
    } else if (bulkTimeout === undefined) {
      bulkTimeout = setTimeout(async () => {
        await schema.statics.flush();
        clearBulkTimeout();
      }, bulk?.delay || 1000);
    }
  }

  async function bulkDelete(opts: { index?: string; routing?: string; model: any }) {
    return await bulkAdd({
      delete: {
        _index: opts.index || indexName,
        _id: opts.model._id.toString(),
        routing: opts.routing,
      },
    });
  }

  async function bulkIndex(opts: { index?: string; routing?: string; model: any; _id?: string }) {
    await bulkAdd({
      index: {
        _index: opts.index || indexName,
        _id: opts._id.toString(),
        routing: opts.routing,
      },
    });
    await bulkAdd(opts.model);
  }

  /**
   * ElasticSearch Client
   */
  schema.statics.esClient = esClient;

  /**
   * Create the mapping. Takes an optional settings parameter
   * and a callback that will be called once the mapping is created
   */
  schema.statics.createMapping = async function createMapping(inSettings: any, inMappings?: any) {
    setIndexNameIfUnset(this.modelName);

    return await createMappingIfNotPresent({
      client: esClient,
      indexName: indexName,
      typeName: typeName,
      schema: schema,
      settings: inSettings,
      mappings: inMappings,
      properties: customProperties,
    });
  };

  /**
   * Get the mapping.
   */
  schema.statics.getMapping = function getMapping() {
    return Generator.generateMapping(schema);
  };

  /**
   * Get clean tree.
   */
  schema.statics.getCleanTree = function getCleanTree() {
    return Generator.getCleanTree(schema);
  };

  schema.methods.index = async function schemaIndex(inOpts: any = {}) {
    let serialModel;
    const opts = inOpts;

    if (filter && filter(this)) {
      return this.unIndex();
    }

    setIndexNameIfUnset(this.constructor['modelName']);

    const index = opts.index || indexName;

    /**
     * Serialize the model, and apply transformation
     */
    if (typeof customSerialize === 'function') {
      serialModel = customSerialize(this, mapping);
    } else {
      serialModel = serialize(this.toObject(), mapping);
    }

    if (transform) serialModel = transform(serialModel, this);

    const _opts: MongoosasticBulkIndexOpts = {
      model: undefined,
      index: index,
      refresh: forceIndexRefresh,
    };
    if (routing) {
      _opts.routing = routing(this);
    }

    if (bulk) {
      _opts.model = serialModel;
      _opts._id = this._id;
      await bulkIndex(_opts);
      return this;
    } else {
      _opts.id = this._id.toString();
      _opts.body = serialModel;
      // indexing log in-case of slow queries in elasticsearch
      return esClient.index(_opts as IndexDocumentParams<any>);
    }
  };

  /**
   * Unset elasticsearch index
   */
  schema.methods.unIndex = async function unIndex(inOpts: any = {}) {
    setIndexNameIfUnset(this.constructor['modelName']);

    inOpts.index = inOpts.index || indexName;
    inOpts.type = inOpts.type || typeName;
    inOpts.model = this;
    inOpts.client = esClient;
    inOpts.tries = inOpts.tries || 3;
    if (routing) {
      inOpts.routing = routing(this);
    }

    if (bulk) {
      return await bulkDelete(inOpts);
    } else {
      return await deleteByMongoId(inOpts);
    }
  };

  /**
   * Delete all documents from a type/index
   */
  schema.statics.esTruncate = async function esTruncate(inOpts: any = {}) {
    setIndexNameIfUnset(this.modelName);

    // todo fix pagination and only get ids
    // or recreate index better?
    inOpts.index = inOpts.index || indexName;

    const settingsRes = await esClient.indices.getSettings(inOpts);

    const indexSettings = settingsRes?.[indexName].settings || {};
    delete indexSettings?.index?.creation_date;
    delete indexSettings?.index?.provided_name;
    delete indexSettings?.index?.uuid;
    delete indexSettings?.index?.version;

    // pass this to override the mapping from default // todo
    // const mappingsRes = await esClient.indices.getMapping(opts);
    // const indexMappings = mappingsRes?.[indexName].mappings || {};

    try {
      await esClient.indices.delete(inOpts);
    } catch (e) {}

    return await this.createMapping(indexSettings);
  };

  /**
   * Synchronize an existing collection
   */
  schema.statics.synchronize = function synchronize(inQuery: any, inOpts: any) {
    const em = new events.EventEmitter();
    let closeValues: any = [];
    let counter = 0;
    const query = inQuery || {};
    const close = function close() {
      em.emit.apply(em, ['close'].concat(closeValues));
    };

    const _saveOnSynchronize =
      inOpts && inOpts.saveOnSynchronize !== undefined ? inOpts.saveOnSynchronize : saveOnSynchronize;

    // Set indexing to be bulk when synchronizing to make synchronizing faster
    // Set default values when not present
    bulk = {
      delay: (bulk && bulk.delay) || 1000,
      size: (bulk && bulk.size) || 1000,
      batch: (bulk && bulk.batch) || 50,
    };

    setIndexNameIfUnset(this.modelName);

    const stream = this.find(query).batchSize(bulk.batch).cursor();

    stream.on('data', (doc: any) => {
      stream.pause();
      counter++;

      function onIndex(indexErr: any, inDoc: any) {
        counter--;
        if (indexErr) {
          em.emit('error', indexErr);
        } else {
          em.emit('data', undefined, inDoc);
        }
        stream.resume();
      }

      doc.on('es-indexed', onIndex);
      doc.on('es-filtered', onIndex);

      if (_saveOnSynchronize) {
        // Save document with Mongoose first
        doc.save((err: any) => {
          if (err) {
            counter--;
            em.emit('error', err);
            return stream.resume();
          }
        });
      } else {
        postSave(doc).then();
      }
    });

    stream.on('close', (pA: any, pB: any) => {
      closeValues = [pA, pB];
      const closeInterval = setInterval(() => {
        if (counter === 0 && bulkBuffer.length === 0) {
          clearInterval(closeInterval);
          close();
          bulk = options && options.bulk;
        }
      }, 1000);
    });

    stream.on('error', (err: any) => {
      em.emit('error', err);
    });

    return em;
  };

  /**
   * ElasticSearch search function
   * Wrapping schema.statics.es_search().
   */
  schema.statics.search = async function search(inQuery: any, inOpts: any) {
    const opts = inOpts;
    const query = inQuery === null ? undefined : inQuery;

    const fullQuery = {
      query: query,
    };

    const esSearch = schema.statics.esSearch.bind(this);

    return esSearch(fullQuery, opts);
  };

  /**
   * ElasticSearch true/raw search function
   *
   * Elastic search query: provide full query object.
   * Useful, e.g., for paged requests.
   *
   * @param inQuery - **full** query object to perform search with
   * @param inOpts - (optional) special search options, such as hydrate
   */
  schema.statics.esSearch = async function (inQuery: any, inOpts: IMongoosasticSearchOpts) {
    const opts = inOpts ?? ({} as IMongoosasticSearchOpts);
    const query = inQuery === null ? undefined : inQuery;

    opts.hydrateOptions = opts?.hydrateOptions || defaultHydrateOptions || {};

    setIndexNameIfUnset(this.modelName);

    const esQuery: SearchParams = {
      body: query,
      index: opts.index || indexName,
    };

    if (opts.routing) {
      esQuery.routing = opts.routing;
    }

    if (opts.highlight) {
      esQuery.body.highlight = opts.highlight;
    }

    if (opts.suggest) {
      esQuery.body.suggest = opts.suggest;
    }

    if (opts.aggs) {
      esQuery.body.aggs = opts.aggs;
    }

    if (opts.min_score) {
      esQuery.body.min_score = opts.min_score;
    }

    Object.keys(opts).forEach((opt) => {
      if (!opt.match(/(hydrate|sort|aggs|highlight|suggest)/) && opts.hasOwnProperty(opt)) {
        esQuery[opt] = opts[opt];
      }

      if (opts.sort) {
        if (isString(opts.sort) || isStringArray(opts.sort)) {
          esQuery.sort = opts.sort;
        } else {
          esQuery.body.sort = opts.sort;
        }
      }
    });

    // search query for elasticsearch
    const res = await esClient.search(esQuery);

    const resp = reformatESTotalNumber(res);
    if (alwaysHydrate || opts.hydrate) {
      return hydrate(resp, this, opts);
    }
    return resp;
  };

  function reformatESTotalNumber(res: any) {
    Object.assign(res.hits, {
      total: res.hits.total.value,
      extTotal: res.hits.total,
    });
    return res;
  }

  schema.statics.esCount = async function esCount(query?: Record<string, string>) {
    setIndexNameIfUnset(this.modelName);

    const esQuery = {
      body: {
        query: query ?? { match_all: {} },
      },
      index: indexName,
    };

    return await esClient.count(esQuery);
  };

  schema.statics.flush = async function flush() {
    const res = await esClient.bulk({
      body: bulkBuffer,
    });
    if (res.errors) bulkErrEm.emit('error', res.errors, res);
    if (res.items && res.items.length) {
      for (let i = 0; i < res.items.length; i++) {
        const info = res.items[i];
        if (info && info.index && info.index.error) {
          bulkErrEm.emit('error', undefined, info.index);
        }
      }
    }
    bulkBuffer = [];
  };

  schema.statics.refresh = async function refresh(inOpts: any = {}) {
    setIndexNameIfUnset(this.modelName);
    return await esClient.indices.refresh({
      index: inOpts.index || indexName,
    });
  };

  async function postRemove(doc: any) {
    if (!doc) {
      return;
    }

    const opts: DeleteOpts = {
      index: indexName,
      tries: 3,
      model: doc,
      client: esClient,
    };

    if (routing) {
      opts.routing = routing(doc);
    }

    setIndexNameIfUnset(doc.constructor.modelName);

    if (bulk) {
      await bulkDelete(opts);
    } else {
      await deleteByMongoId(opts);
    }
  }

  schema.statics.bulkError = function bulkError() {
    return bulkErrEm;
  };

  /**
   * Use standard Mongoose Middleware hooks
   * to persist to Elasticsearch
   */
  function setUpMiddlewareHooks(inSchema: any) {
    /**
     * Remove in elasticsearch on remove
     */
    inSchema.post('remove', postRemove);
    inSchema.post('findOneAndRemove', postRemove);

    /**
     * Save in elasticsearch on save.
     */
    inSchema.post('save', postSave);
    inSchema.post('findOneAndUpdate', postSave);
    inSchema.post('insertMany', (docs: any) => {
      docs.forEach((doc: any) => postSave(doc));
    });
  }

  if (indexAutomatically) {
    setUpMiddlewareHooks(schema);
  }
}
