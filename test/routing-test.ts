import { deleteIndexIfExists, sleep } from './helper';
import { taskModel } from './models/task';

describe('Routing', async function () {
  before(async function () {
    await deleteIndexIfExists(['tasks']);
    await taskModel.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists(['tasks']);
    await taskModel.deleteMany();
  });

  it('should found task if no routing', async function () {
    const task = await taskModel.create({ content: Date.now() });
    await sleep(1200);
    const res = await taskModel.search({
      query_string: {
        query: task.content,
      },
    });
    res.hits.total.should.eql(1);
    // res._shards.total.should.above(1)
    await task.remove();
  });

  it('should found task if routing with task.content', async function () {
    const now = Date.now();
    const task = await taskModel.create({ content: now });
    await sleep(1200);
    const res = await taskModel.search(
      {
        query_string: {
          query: task.content,
        },
      },
      {
        routing: task.content,
      }
    );
    res.hits.total.should.eql(1);
    res._shards.total.should.eql(1);
    await task.remove();
  });

  it('should not found task if routing with invalid routing', async function () {
    const now = Date.now();
    const task = await taskModel.create({ content: now });

    await sleep(1200);
    const res = await taskModel.search(
      {
        query_string: {
          query: task.content,
        },
      },
      {
        routing: `${now + 1}`,
      }
    );
    res._shards.total.should.eql(1);
    await task.remove();
  });

  it('should not found task after remove', async function () {
    const task = await taskModel.create({ content: Date.now() });
    await sleep(1200);
    await task.remove();
    await sleep(1200);
    const res = await taskModel.search({
      query_string: {
        query: task.content,
      },
    });
    res.hits.total.should.eql(0);
  });

  it('should not found task after unIndex', async function () {
    const task = await taskModel.create({ content: Date.now() });
    await sleep(1200);
    await task.unIndex();
    await sleep(1200);
    const res = await taskModel.search({
      query_string: {
        query: task.content,
      },
    });
    res.hits.total.should.eql(0);
    // res._shards.total.should.above(1)
    await task.remove();
  });

  it('should not found task after esTruncate', async function () {
    const task = await taskModel.create({ content: Date.now() });
    await sleep(1200);
    await taskModel.esTruncate();
    await sleep(1200);
    const res = await taskModel.search({
      query_string: {
        query: task.content,
      },
    });

    res.hits.total.should.eql(0);
    // res._shards.total.should.above(1)
    await task.remove();
  });
});
