import { commentModel } from './models/comment';
import { deleteIndexIfExists, sleep } from './helper';

describe('Count', async () => {
  before(async () => {
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

  after(async () => {
    await deleteIndexIfExists(['comments']);
    await commentModel.deleteMany();
  });

  it('should count a type', async () => {
    await sleep(1000);
    const results = await commentModel.esCount({
      term: {
        user: 'terry',
      },
    });
    results.count.should.eql(1);
  });

  it('should count a type without query', async () => {
    const results = await commentModel.esCount();
    results.count.should.eql(2);
  });
});
