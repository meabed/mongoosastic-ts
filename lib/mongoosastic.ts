import elasticsearch, { Client as EsClient } from 'elasticsearch';
import events from 'events';
import { Generator } from './mapping-generator';
import { serialize } from './serialize';

const nop = function nop() {};

function isString(subject: any) {
  return typeof subject === 'string';
}

function isStringArray(arr: any) {
  return arr.filter && arr.length === arr.filter((item: any) => typeof item === 'string').length;
}

function createEsClient(options: any) {
  const esOptions = {};

  if (Array.isArray(options.hosts)) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'host' does not exist on type '{}'.
    esOptions.host = options.hosts;
  } else {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'host' does not exist on type '{}'.
    esOptions.host = {
      host: options && options.host ? options.host : 'localhost',
      port: options && options.port ? options.port : 9200,
      protocol: options && options.protocol ? options.protocol : 'http',
      auth: options && options.auth ? options.auth : null,
      keepAlive: false,
    };
  }

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'log' does not exist on type '{}'.
  esOptions.log = options ? options.log : null;

  return new elasticsearch.Client(esOptions);
}

function filterMappingFromMixed(props: any) {
  const filteredMapping = {};
  Object.keys(props).map((key) => {
    const field = props[key];
    if (field.type !== 'mixed') {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      filteredMapping[key] = field;
      if (field.properties) {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        filteredMapping[key].properties = filterMappingFromMixed(field.properties);
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (!Object.keys(filteredMapping[key].properties).length) {
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          delete filteredMapping[key].properties;
        }
      }
    }
  });
  return filteredMapping;
}

function createMappingIfNotPresent(options: any, cb: any) {
  const client = options.client;
  const indexName = options.indexName;
  const typeName = options.typeName;
  const schema = options.schema;
  const settings = options.settings;
  const properties = options.properties;

  const completeMapping = {};
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  completeMapping[typeName] = Generator.generateMapping(schema);

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  completeMapping[typeName].properties = filterMappingFromMixed(completeMapping[typeName].properties);

  if (properties) {
    Object.keys(properties).map((key) => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      completeMapping[typeName].properties[key] = properties[key];
    });
  }

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const inputMapping = completeMapping[typeName];
  client.indices.exists(
    {
      index: indexName,
    },
    (err: any, exists: any) => {
      if (err) {
        return cb(err);
      }

      if (exists) {
        return client.indices.putMapping(
          {
            index: indexName,
            body: inputMapping,
          },
          (err: any) => {
            cb(err, inputMapping);
          }
        );
      }
      return client.indices.create(
        {
          index: indexName,
          body: settings,
        },
        (indexErr: any) => {
          if (indexErr) {
            return cb(indexErr);
          }

          client.indices.putMapping(
            {
              index: indexName,
              body: inputMapping,
            },
            (err: any) => {
              cb(err, inputMapping);
            }
          );
        }
      );
    }
  );
}

async function hydrate(res: any, model: any, options: any) {
  const results = res.hits;
  const resultsMap = {};
  const ids = results.hits.map((result: any, idx: any) => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
  const docsMap = {};

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
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      docsMap[doc._id] = doc;
    });
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    hits = results.hits.map((result: any) => docsMap[result._id]);
  }

  if (options.highlight || options.hydrateWithESResults) {
    hits.forEach((doc: any) => {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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

async function deleteByMongoId(options: any) {
  const index = options.index;
  const client: EsClient = options.client;
  const model = options.model;
  const routing = options.routing;
  let tries = options.tries;

  const res = await client.delete({
    type: '_doc',
    index: index,
    id: model._id.toString(),
    routing: routing,
  });
  //         options.tries = --tries;
  //         setTimeout(async () => {
  //           await deleteByMongoId(options);
  //         }, 500);
  model.emit('es-removed', null, res);
}

export function mongoosastic(schema: any, pluginOpts: any) {
  const options = pluginOpts || {};

  let bulkTimeout: any;
  let bulkBuffer: any = [];
  let esClient: EsClient;
  const populate = options && options.populate;
  const mapping = Generator.generateMapping(schema);

  let indexName = options && options.index;
  let typeName = options && options.type;
  const alwaysHydrate = options && options.hydrate;
  const defaultHydrateOptions = options && options.hydrateOptions;
  let bulk = options && options.bulk;
  const filter = options && options.filter;
  const transform = options && options.transform;
  const routing = options && options.routing;

  const customProperties = options && options.customProperties;
  const customSerialize = options && options.customSerialize;
  const forceIndexRefresh = options && options.forceIndexRefresh;
  const indexAutomatically = !(options && options.indexAutomatically === false);
  const saveOnSynchronize = !(options && options.saveOnSynchronize === false);

  const bulkErrEm = new events.EventEmitter();

  if (options.esClient) {
    esClient = options.esClient;
  } else {
    esClient = createEsClient(options);
  }

  function setIndexNameIfUnset(model: any) {
    const modelName = model.toLowerCase();
    if (!indexName) {
      indexName = `${modelName}s`;
    }

    if (!typeName) {
      typeName = modelName;
    }
  }

  function postSave(doc: any) {
    let _doc: any;

    function onIndex(err: any, res: any) {
      if (!filter || !filter(doc)) {
        doc.emit('es-indexed', err, res);
      } else {
        doc.emit('es-filtered', err, res);
      }
    }

    if (doc) {
      _doc = new doc.constructor(doc);
      if (populate && populate.length) {
        populate.forEach((populateOpts: any) => {
          _doc.populate(populateOpts);
        });
        _doc
          .execPopulate()
          .then((popDoc: any) => {
            popDoc.index(onIndex);
          })
          .catch(onIndex);
      } else {
        _doc.index(onIndex);
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
    if (instruction.index && instruction.index._index) {
      return;
    }

    if (bulkBuffer.length >= ((bulk && bulk.size) || 1000)) {
      schema.statics.flush();
      clearBulkTimeout();
    } else if (bulkTimeout === undefined) {
      bulkTimeout = setTimeout(() => {
        schema.statics.flush();
        clearBulkTimeout();
      }, (bulk && bulk.delay) || 1000);
    }
  }

  async function bulkDelete(opts: any) {
    return bulkAdd({
      delete: {
        _index: opts.index || indexName,
        _id: opts.model._id.toString(),
        routing: opts.routing,
      },
    });
  }

  async function bulkIndex(opts: any) {
    bulkAdd({
      index: {
        _index: opts.index || indexName,
        _id: opts._id.toString(),
        routing: opts.routing,
      },
    });
    bulkAdd(opts.model);
  }

  /**
   * ElasticSearch Client
   */
  schema.statics.esClient = esClient;

  /**
   * Create the mapping. Takes an optional settings parameter
   * and a callback that will be called once the mapping is created

   * @param inSettings
   * @param inCb
   */
  schema.statics.createMapping = async function createMapping(inSettings: any, inCb: any) {
    let cb = inCb;
    let settings = inSettings;
    if (arguments.length < 2) {
      cb = inSettings || nop;
      settings = undefined;
    }

    setIndexNameIfUnset(this.modelName);

    createMappingIfNotPresent(
      {
        client: esClient,
        indexName: indexName,
        typeName: typeName,
        schema: schema,
        settings: settings,
        properties: customProperties,
      },
      cb
    );
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

  /**
   * @param inOpts
   */
  schema.methods.index = async function schemaIndex(inOpts: any) {
    let serialModel;
    let opts = inOpts;

    if (arguments.length < 2) {
      opts = {};
    }

    if (filter && filter(this)) {
      return this.unIndex();
    }

    setIndexNameIfUnset(this.constructor.modelName);

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

    const _opts = {
      index: index,
      refresh: forceIndexRefresh,
    };
    if (routing) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'routing' does not exist on type '{ index... Remove this comment to see the full error message
      _opts.routing = routing(this);
    }

    if (bulk) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'model' does not exist on type '{ index: ... Remove this comment to see the full error message
      _opts.model = serialModel;
      // @ts-expect-error ts-migrate(2339) FIXME: Property '_id' does not exist on type '{ index: an... Remove this comment to see the full error message
      _opts._id = this._id;
      await bulkIndex(_opts);
      return this;
    } else {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{ index: any... Remove this comment to see the full error message
      _opts.id = this._id.toString();
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'body' does not exist on type '{ index: a... Remove this comment to see the full error message
      _opts.body = serialModel;
      return esClient.index(_opts as any);
    }
  };

  /**
   * Unset elasticsearch index
   * @param inOpts
   */
  schema.methods.unIndex = async function unIndex(inOpts?: any) {
    let opts = inOpts;

    if (arguments.length < 2) {
      opts = {};
    }

    setIndexNameIfUnset(this.constructor.modelName);

    opts.index = opts.index || indexName;
    opts.type = opts.type || typeName;
    opts.model = this;
    opts.client = esClient;
    opts.tries = opts.tries || 3;
    if (routing) {
      opts.routing = routing(this);
    }

    if (bulk) {
      return bulkDelete(opts);
    } else {
      return deleteByMongoId(opts);
    }
  };

  /**
   * Delete all documents from a type/index
   * @param inOpts
   * @param inCb
   */
  schema.statics.esTruncate = async function esTruncate(inOpts: any, inCb: any) {
    let opts = inOpts;
    let cb = inCb;

    if (arguments.length < 2) {
      cb = inOpts || nop;
      opts = {};
    }

    setIndexNameIfUnset(this.modelName);

    opts.index = opts.index || indexName;

    const esQuery = {
      body: {
        query: {
          match_all: {},
        },
      },
      index: opts.index,
    };

    esClient.search(esQuery, (err: any, res: any) => {
      if (err) {
        return cb(err);
      }
      res = reformatESTotalNumber(res);
      if (res.hits.total) {
        res.hits.hits.forEach((doc: any) => {
          opts.model = doc;
          if (routing) {
            doc._source._id = doc._id;
            opts.routing = routing(doc._source);
          }
          bulkDelete(opts);
        });
      }
      cb();
    });
  };

  /**
   * Synchronize an existing collection
   *
   * @param inQuery
   * @param inOpts
   */
  schema.statics.synchronize = async function synchronize(inQuery: any, inOpts: any) {
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
          em.emit('data', null, inDoc);
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
        postSave(doc);
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
   *
   * Wrapping schema.statics.es_search().
   *
   * @param inQuery - query object to perform search with
   * @param inOpts - (optional) special search options, such as hydrate
   * @param inCb - callback called with search results
   */
  schema.statics.search = async function search(inQuery: any, inOpts: any, inCb: any) {
    let cb = inCb;
    let opts = inOpts;
    const query = inQuery === null ? undefined : inQuery;

    if (arguments.length === 2) {
      cb = arguments[1];
      opts = {};
    }

    const fullQuery = {
      query: query,
    };

    const esSearch = schema.statics.esSearch.bind(this);

    return esSearch(fullQuery, opts, cb);
  };

  /**
   * ElasticSearch true/raw search function
   *
   * Elastic search query: provide full query object.
   * Useful, e.g., for paged requests.
   *
   * @param inQuery - **full** query object to perform search with
   * @param inOpts - (optional) special search options, such as hydrate
   * @param inCb - callback called with search results
   */
  schema.statics.esSearch = async function (inQuery: any, inOpts: any, inCb: any) {
    const _this = this;
    let cb = inCb;
    let opts = inOpts ?? {};
    const query = inQuery === null ? undefined : inQuery;

    if (arguments.length === 2) {
      cb = arguments[1];
      opts = {};
    }

    opts.hydrateOptions = opts?.hydrateOptions || defaultHydrateOptions || {};

    setIndexNameIfUnset(this.modelName);

    const esQuery = {
      body: query,
      index: opts.index || indexName,
    };

    if (opts.routing) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'routing' does not exist on type '{ body:... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        esQuery[opt] = opts[opt];
      }

      if (opts.sort) {
        if (isString(opts.sort) || isStringArray(opts.sort)) {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'sort' does not exist on type '{ body: an... Remove this comment to see the full error message
          esQuery.sort = opts.sort;
        } else {
          esQuery.body.sort = opts.sort;
        }
      }
    });

    const res = await esClient.search(esQuery);

    const resp = reformatESTotalNumber(res);
    if (alwaysHydrate || opts.hydrate) {
      return hydrate(resp, _this, opts);
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

  schema.statics.esCount = function esCount(inQuery: any, inCb: any) {
    let cb = inCb;
    let query = inQuery;

    setIndexNameIfUnset(this.modelName);

    if (!cb && typeof query === 'function') {
      cb = query;
      query = {
        match_all: {},
      };
    }

    const esQuery = {
      body: {
        query: query,
      },
      index: indexName,
    };

    esClient.count(esQuery, cb);
  };

  schema.statics.flush = function flush(inCb: any) {
    const cb = inCb || nop;
    esClient.bulk(
      {
        body: bulkBuffer,
      },
      (err: any, res: any) => {
        if (err) bulkErrEm.emit('error', err, res);
        if (res.items && res.items.length) {
          for (let i = 0; i < res.items.length; i++) {
            const info = res.items[i];
            if (info && info.index && info.index.error) {
              bulkErrEm.emit('error', null, info.index);
            }
          }
        }
        cb();
      }
    );

    bulkBuffer = [];
  };

  schema.statics.refresh = async function refresh(inOpts: any, inCb: any) {
    let cb = inCb;
    let opts = inOpts;
    if (arguments.length < 2) {
      cb = inOpts || nop;
      opts = {};
    }

    setIndexNameIfUnset(this.modelName);
    esClient.indices.refresh(
      {
        index: opts.index || indexName,
      },
      cb
    );
  };

  async function postRemove(doc: any) {
    if (!doc) {
      return;
    }

    const opts = {
      index: indexName,
      tries: 3,
      model: doc,
      client: esClient,
    };
    if (routing) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'routing' does not exist on type '{ index... Remove this comment to see the full error message
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
