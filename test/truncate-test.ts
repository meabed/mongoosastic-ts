import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { taskModel } from './models/task';
import { expect } from 'chai';

describe('Truncate', async function () {
  before(async function () {
    await deleteIndexIfExists(['tasks']);
    await taskModel.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists(['tasks']);
    await taskModel.deleteMany();
  });

  describe('esTruncate', async function () {
    it('should be able to truncate all documents', async function () {
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await sleep(1200);
      const indexRes = await taskModel.search({ match_all: {} });
      indexRes.hits.total.should.eql(5);
      // truncate
      await taskModel.esTruncate();
      await sleep(1200);
      const res = await taskModel.search({
        match_all: {},
      });
      res.hits.total.should.eql(0);
    });

    it('should have same index mapping after truncate', async function () {
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await taskModel.create({ content: Date.now(), random: Math.random() });
      await sleep(1200);

      const res = await getEsClient().indices.getMapping({
        index: 'tasks',
      });

      const props = res.tasks.mappings.properties;
      expect(props.random.type).to.be.eql('text');
      expect(props.random.boost).to.be.eql(2.0);

      const searchRes = await taskModel.search({
        match_all: {},
      });
      searchRes.hits.total.should.eql(2);
      searchRes.hits.hits.forEach(function (model: any) {
        expect(typeof model._source.random).to.be.eql('string');
      });
    });
  });
});
