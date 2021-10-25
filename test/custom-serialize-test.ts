import { deleteIndexIfExists, sleep } from './helper';
import { foodModel } from './models/food';

describe('Custom Serialize', async function () {
  before(async function () {
    await deleteIndexIfExists(['foods']);
    await foodModel.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists(['foods']);
    await foodModel.deleteMany();
  });

  it('should index all fields returned from the customSerialize function', async function () {
    await foodModel.create({ name: 'pizza' });
    await sleep(1000);
    const results = await foodModel.search({ query_string: { query: 'pizza' } });

    results.hits.hits[0]._source.name.should.eql('pizza');
    results.hits.hits[0]._source.type.should.eql('dinner');
  });
});
