import { deleteIndexIfExists, sleep } from './helper';
import { taskModel } from './models/task';
import { repoModel } from './models/repo';

describe('Transform mode', async () => {
  before(async () => {
    await deleteIndexIfExists(['repos']);
    await taskModel.deleteMany();
  });

  after(async () => {
    await deleteIndexIfExists(['repos']);
    await taskModel.deleteMany();
  });
  it('should index with field "fullTitle"', async () => {
    await repoModel.create({
      name: 'LOTR',
      settingLicense: '',
      detectedLicense: 'Apache',
    });
    await sleep(1000);
    const results = await repoModel.search({
      query_string: {
        query: 'Apache',
      },
    });
    results.hits.total.should.eql(1);
  });
});
