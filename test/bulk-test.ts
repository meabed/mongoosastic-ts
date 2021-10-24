import { bookTitlesArray, deleteIndexIfExists, getEsClient, sleep } from './helper';
import { bulkModel } from './models/bulk';
import { expect } from 'chai';

describe('Bulk mode', async () => {
  before(async () => {
    await deleteIndexIfExists(['bulks']);
    await bulkModel.deleteMany();
  });

  before(async () => {
    for (const title of bookTitlesArray()) {
      await bulkModel.create({ title, random: Math.random() });
    }
  });

  after(async () => {
    await deleteIndexIfExists(['bulks']);
    await bulkModel.deleteMany();
  });

  it('should index all objects and support deletions too', async () => {
    await sleep(1500);
    // This timeout is important, as Elasticsearch is "near-realtime" and the index/deletion takes time that
    // needs to be taken into account in these tests
    const res = await bulkModel.search({
      match_all: {},
    });

    expect(res?.hits?.total).to.be.eql(53);
  });

  it('should be able to truncate all documents', async () => {
    await bulkModel.esTruncate();
    await sleep(200);
    const res = await bulkModel.search({
      match_all: {},
    });
    expect(res.hits.total).to.be.eql(0);
  });

  it('should be able to re-create the correct index mapping after truncate', async () => {
    await sleep(200);
    const res = await getEsClient().indices.getMapping({
      index: 'bulks',
    });

    const props = res.bulks.mappings.properties;
    expect(props.random.type).to.be.eql('keyword');
    expect(props.random.boost).to.be.eql(2.0);
  });

  it('should be able to index documents after truncate', async () => {
    await bulkModel.create({ title: 'test-index-after-truncate', random: Math.random() });
    await sleep(1000);
    const res = await bulkModel.search({
      match_all: {},
    });
    expect(res.hits.total).to.be.eql(1);
  });
});
