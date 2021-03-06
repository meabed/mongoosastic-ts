import { deleteIndexIfExists, sleep } from './helper';
import { commentModel } from './models/comment';

describe('Count', async function () {
  before(async function () {
    await deleteIndexIfExists(['comments']);
    await commentModel.deleteMany();
    await commentModel.create({
      user: 'terry',
      title: 'Ilikecars',
    });
    await commentModel.create({
      user: 'fred',
      title: 'Ihatefish',
    });
  });

  after(async function () {
    await deleteIndexIfExists(['comments']);
    await commentModel.deleteMany();
  });

  it('should count a type', async function () {
    await sleep(1000);
    const results = await commentModel.esCount({
      term: {
        user: 'terry',
      },
    });
    results.count.should.eql(1);
  });

  it('should count a type without query', async function () {
    const results = await commentModel.esCount();
    results.count.should.eql(2);
  });
});
