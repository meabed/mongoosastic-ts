import { deleteIndexIfExists } from './helper';
import { refreshModel } from './models/refresh';

describe('Refresh', function () {
  before(async () => {
    await deleteIndexIfExists(['refreshes']);
    await refreshModel.deleteMany();
  });

  after(async () => {
    await deleteIndexIfExists(['refreshes']);
    await refreshModel.deleteMany();
  });
  it('should flushed after refresh', async () => {
    await refreshModel.createMapping();
    await refreshModel.create({ title: `${Date.now()}` });
    const refreshRes = await refreshModel.refresh();
    const results = await refreshModel.search({
      match_all: {},
    });
    refreshRes._shards.successful.should.eql(1);
    results.hits.total.should.eql(1);
  });
});
