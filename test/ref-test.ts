import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { postCommentModel, postModel, userModel } from './models/post';
import * as should from 'should';

describe('references', async function () {
  before(async function () {
    await postModel.deleteMany();
    await postCommentModel.deleteMany();
    await userModel.deleteMany();
    await deleteIndexIfExists(['posts', 'users', 'postcomments']);
  });

  after(async function () {
    await postModel.deleteMany();
    await postCommentModel.deleteMany();
    await userModel.deleteMany();
    await deleteIndexIfExists(['posts', 'users', 'postcomments']);
  });

  describe('indexing', async function () {
    before(async function () {
      const savedUser = await userModel.create({
        name: 'jake',
      });
      await postModel.create({
        body: 'A very short post',
        author: savedUser._id,
      });
      await sleep(1000);
    });

    it('should index selected fields from referenced schema', async function () {
      const post = await postModel.findOne({});
      const res: any = await getEsClient().get({
        type: undefined,
        index: 'posts',
        id: post._id.toString(),
      });
      res._source.author.name.should.eql('jake');
    });

    it('should be able to execute a simple query', async function () {
      await sleep(1000);
      const results = await postModel.search({
        query_string: {
          query: 'jake',
        },
      });
      results.hits.total.should.eql(1);
      results.hits.hits[0]._source.body.should.eql('A very short post');
    });

    describe('arrays of references', async function () {
      before(async function () {
        const user = await userModel.findOne();
        const post = await postModel.findOne();
        const c1 = await postCommentModel.create({ author: user._id, text: 'good post' });
        const c2 = await postCommentModel.create({ author: user._id, text: 'really' });
        post.comments = [c1._id, c2._id];
        await post.save();
        await sleep(1000);
      });

      it('should correctly index arrays', async function () {
        const post = await postModel.findOne({});
        const res: any = await getEsClient().get({
          type: undefined,
          index: 'posts',
          id: post._id.toString(),
        });
        res._source.comments[0].text.should.eql('good post');
        res._source.comments[1].text.should.eql('really');
      });

      it('should respect populate options', async function () {
        const post = await postModel.findOne({});
        const res: any = await getEsClient().get({
          type: undefined,
          index: 'posts',
          id: post._id.toString(),
        });
        res._source.comments[0].text.should.eql('good post');
        should.not.exist(res._source.comments[0].author);
      });
    });
  });
});
