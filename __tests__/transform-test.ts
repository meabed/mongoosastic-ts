import { deleteIndexIfExists, sleep } from './helper';
import { repoModel } from './models/repo';
import { taskModel } from './models/task';

describe('Transform mode', async function () {
  before(async function () {
    await deleteIndexIfExists(['repos']);
    await taskModel.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists(['repos']);
    await taskModel.deleteMany();
  });
  it('should index with field "fullTitle"', async function () {
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
