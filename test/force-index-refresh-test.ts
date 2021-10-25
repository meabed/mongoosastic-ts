import { deleteIndexIfExists, sleep } from './helper';
import { Dummy, DummyRefresh } from './models/dummy';

const indexName = 'es-test';

describe('forceIndexRefresh connection option', async function () {
  before(async function () {
    await deleteIndexIfExists([indexName]);
    // recreate the index
    await Dummy.createMapping({
      analysis: {
        analyzer: {
          content: {
            type: 'custom',
            tokenizer: 'whitespace',
          },
        },
      },
    });
    await Dummy.deleteMany();
    await DummyRefresh.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists([indexName]);
    await Dummy.deleteMany();
    await DummyRefresh.deleteMany();
  });

  it('should always succeed: refresh the index immediately on insert', async function () {
    const d = await DummyRefresh.create({ text: 'Text1' });
    await sleep(1200);
    const results = await DummyRefresh.search({
      term: { _id: d._id },
    });
    results.hits.total.should.eql(1);
  });

  it('should fail randomly: refresh the index every 1s on insert', async function () {
    const d = await Dummy.create({ text: 'Text1' });
    await sleep(1200);
    const results = await Dummy.search({
      term: { _id: d._id },
    });
    results.hits.total.should.eql(1);
  });

  it('should always succeed: refresh the index immediately on update', async function () {
    const d = await DummyRefresh.create({ text: 'Text1' });
    await DummyRefresh.findOneAndUpdate({ _id: d._id }, { text: 'this is the new text' }, { new: true });
    await sleep(1000);
    const results = await DummyRefresh.search({
      term: { _id: d._id },
    });
    results.hits.total.should.eql(1);
    results.hits.hits[0]._source.text.should.eql('this is the new text');
  });

  it('should fail randomly: refresh the index every 1s on update', async function () {
    const d = await Dummy.create({ text: 'Text1' });
    await Dummy.findOneAndUpdate({ _id: d._id }, { text: 'this is the new text' }, { new: true });
    await sleep(1000);
    const results = await Dummy.search({
      term: { _id: d._id },
    });
    results.hits.total.should.eql(1);
    results.hits.hits[0]._source.text.should.eql('this is the new text');
  });
});
