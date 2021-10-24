import { bookTitlesArray, deleteIndexIfExists, sleep } from './helper';
import { bulkModel } from './models/bulk';
import { expect } from 'chai';

describe('Bulk mode', async () => {
  before(async () => {
    await deleteIndexIfExists(['bulks']);
    await bulkModel.deleteMany();
  });

  before(async () => {
    for (const title of bookTitlesArray()) {
      await bulkModel.create({ title });
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
});
