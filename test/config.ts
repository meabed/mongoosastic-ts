const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: 'localhost:9200',
  deadTimeout: 0,
  keepAlive: false,
});

const INDEXING_TIMEOUT = process.env.INDEXING_TIMEOUT || 4000;
const BULK_ACTION_TIMEOUT = process.env.BULK_ACTION_TIMEOUT || 6000;

async function deleteIndexIfExists(indexes: any) {
  for (const index of indexes) {
    try {
      await esClient.indices.delete({ index });
    } catch (e) {
      // console.error(e);
    }
  }
}

async function deleteDocs(models: any) {
  for (const model of models) {
    try {
      await model.deleteMany();
    } catch (e) {
      // console.error(e);
    }
  }
}

async function createModelAndEnsureIndex(Model: any, obj: any, cb: any) {
  return Model.create(obj);
}

function createModelAndSave(Model: any, obj: any, cb: any) {
  const dude = new Model(obj);
  dude.save(cb);
}

function saveAndWaitIndex(model: any, cb: any) {
  model.save(function (err: any) {
    if (err) cb(err);
    else {
      model.once('es-indexed', cb);
      model.once('es-filtered', cb);
    }
  });
}

function bookTitlesArray() {
  const books = ['American Gods', 'Gods of the Old World', 'American Gothic'];
  let idx;
  for (idx = 0; idx < 50; idx++) {
    books.push('ABABABA' + idx);
  }
  return books;
}

module.exports = {
  mongoUrl: 'mongodb://0.0.0.0:27017/es-test',
  mongoOpts: {},
  INDEXING_TIMEOUT: INDEXING_TIMEOUT,
  BULK_ACTION_TIMEOUT: BULK_ACTION_TIMEOUT,
  deleteIndexIfExists: deleteIndexIfExists,
  deleteDocs: deleteDocs,
  createModelAndEnsureIndex: createModelAndEnsureIndex,
  createModelAndSave: createModelAndSave,
  saveAndWaitIndex: saveAndWaitIndex,
  bookTitlesArray: bookTitlesArray,
  getClient: function () {
    return esClient;
  },
  close: function () {
    esClient.close();
  },
};
