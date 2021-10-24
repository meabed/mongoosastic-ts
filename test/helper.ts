const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  host: 'localhost:9200',
  deadTimeout: 0,
  keepAlive: false,
});

export async function deleteIndexIfExists(indexes: any) {
  for (const index of indexes) {
    try {
      await esClient.indices.delete({ index });
    } catch (e) {
      // console.error(e);
    }
  }
}

export async function deleteDocs(models: any) {
  for (const model of models) {
    try {
      await model.deleteMany();
    } catch (e) {
      // console.error(e);
    }
  }
}

export async function createModelAndEnsureIndex(Model: any, obj: any) {
  const doc = Model.create(obj);
  await sleep(200);
  return doc;
}

export async function createModelAndSave(Model: any, obj: any) {
  const doc = Model.create(obj);
  await sleep(200);
  return doc;
}

export function saveAndWaitIndex(model: any, cb: any) {
  model.save(function (err: any) {
    if (err) cb(err);
    else {
      model.once('es-indexed', cb);
      model.once('es-filtered', cb);
    }
  });
}

export function bookTitlesArray() {
  const books = ['American Gods', 'Gods of the Old World', 'American Gothic'];
  let idx;
  for (idx = 0; idx < 50; idx++) {
    books.push('ABABABA' + idx);
  }
  return books;
}

export function getExClient() {
  return esClient;
}

export function CloseEsClient() {
  esClient.close();
}

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
