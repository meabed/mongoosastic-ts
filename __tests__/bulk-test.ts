import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { bulkModel } from './models/bulk';
import { expect } from 'chai';

export function bookTitlesArray(): string[] {
  const books = ['American Gods', 'Gods of the Old World', 'American Gothic'];
  let idx;
  for (idx = 0; idx < 50; idx++) {
    books.push('ABABABA' + idx);
  }
  return books;
}

describe('Bulk mode', async function () {
  before(async function () {
    await deleteIndexIfExists(['bulks']);
    await bulkModel.deleteMany();
  });

  before(async function () {
    for (const title of bookTitlesArray()) {
      await bulkModel.create({ title, random: Math.random() });
    }
  });

  after(async function () {
    await deleteIndexIfExists(['bulks']);
    await bulkModel.deleteMany();
  });

  it('should index all objects and support deletions too', async function () {
    await sleep(1500);
    // This timeout is important, as Elasticsearch is "near-realtime" and the index/deletion takes time that
    // needs to be taken into account in these tests
    const res = await bulkModel.search({
      match_all: {},
    });

    expect(res?.hits?.total).to.be.eql(53);
  });

  it('should be able to truncate all documents', async function () {
    await bulkModel.esTruncate();
    await sleep(200);
    const res = await bulkModel.search({
      match_all: {},
    });
    expect(res.hits.total).to.be.eql(0);
  });

  it('should be able to re-create the correct index mapping after truncate', async function () {
    await sleep(200);
    const res = await getEsClient().indices.getMapping({
      index: 'bulks',
    });

    const props = res.bulks.mappings.properties;
    expect(props.random.type).to.be.eql('keyword');
  });

  it('should be able to index documents after truncate', async function () {
    await bulkModel.create({ title: 'test-index-after-truncate', random: Math.random() });
    await sleep(1000);
    const res = await bulkModel.search({
      match_all: {},
    });
    expect(res.hits.total).to.be.eql(1);
  });
});
