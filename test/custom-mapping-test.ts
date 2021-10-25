import { deleteIndexIfExists, sleep } from './helper';
import { phoneModel } from './models/phone';

describe('Custom Properties for Mapping', async function () {
  before(async function () {
    await deleteIndexIfExists(['phones']);
    await phoneModel.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists(['phones']);
    await phoneModel.deleteMany();
  });

  it('should index with field "fullTitle"', async function () {
    await phoneModel.create({
      name: 'iPhone',
    });
    await sleep(1200);
    const results = await phoneModel.search(
      {
        query_string: {
          query: 'iPhone',
        },
      },
      {
        sort: 'created:asc',
      }
    );
    results.hits.total.should.eql(1);
  });
});
