import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { bumModel, dogModel, peopleModel, talkModel } from './models/people';
import { ITweetModel, tweetModel } from './models/tweet';
import should from 'should';

describe('indexing', async function () {
  before(async function () {
    await tweetModel.deleteMany();
    await peopleModel.deleteMany();
    await talkModel.deleteMany();
    await bumModel.deleteMany();
    await dogModel.deleteMany();
    await deleteIndexIfExists(['tweets', 'talks', 'people', 'ms_sample', 'dogs']);
  });

  after(async function () {
    await tweetModel.deleteMany();
    await peopleModel.deleteMany();
    await talkModel.deleteMany();
    await bumModel.deleteMany();
    await dogModel.deleteMany();
    await deleteIndexIfExists(['tweets', 'talks', 'people', 'ms_sample', 'dogs']);
  });

  describe('Creating Index', async function () {
    it('should create index if none exists', async function () {
      const response = await tweetModel.createMapping();
      should.exists(response);
      response.should.not.have.property('error');
    });

    it('should create index with settings if none exists', async function () {
      const response = await tweetModel.createMapping({
        analysis: {
          analyzer: {
            stem: {
              tokenizer: 'standard',
              filter: ['standard', 'lowercase', 'stop', 'porter_stem'],
            },
          },
        },
      });
      should.exists(response);
      response.should.not.have.property('error');
    });

    it('should update index if one already exists', async function () {
      const response = await tweetModel.createMapping();
      response.should.not.have.property('error');
    });

    after(async function () {
      await deleteIndexIfExists(['tweets', 'talks', 'people']);
    });
  });

  describe('Default plugin', async function () {
    before(async function () {
      await tweetModel.create({
        user: 'jamescarr',
        userId: 1,
        message: 'I like Riak better',
        post_date: new Date(),
      });
      await sleep(1000);
    });

    it("should use the model's id as ES id", async function () {
      const doc = await tweetModel.findOne({
        message: 'I like Riak better',
      });
      const res: any = await getEsClient().get({
        type: undefined,
        index: 'tweets',
        id: doc._id.toString(),
      });
      res._source.message.should.eql(doc.message);
    });

    it('should be able to execute a simple query', async function () {
      const results = await tweetModel.search({
        query_string: {
          query: 'Riak',
        },
      });
      results.hits.total.should.eql(1);
      results.hits.hits[0]._source.message.should.eql('I like Riak better');
    });

    it('should be able to execute a simple query', async function () {
      const results = await tweetModel.search({
        query_string: {
          query: 'jamescarr',
        },
      });
      results.hits.total.should.eql(1);
      results.hits.hits[0]._source.message.should.eql('I like Riak better');
    });

    it('should reindex when findOneAndUpdate', async function () {
      await tweetModel.findOneAndUpdate(
        {
          message: 'I like Riak better',
        },
        {
          message: 'I like Jack better',
        },
        {
          new: true,
        }
      );
      await sleep(1000);
      const results = await tweetModel.search({
        query_string: {
          query: 'Jack',
        },
      });
      results.hits.total.should.eql(1);
      results.hits.hits[0]._source.message.should.eql('I like Jack better');
    });

    it("should be able to execute findOneAndUpdate if document doesn't exist", async function () {
      const doc = await tweetModel.findOneAndUpdate(
        {
          message: 'Not existing document',
        },
        {
          message: 'I like Jack better',
        },
        {
          new: true,
        }
      );
      should.not.exist(doc);
    });

    it('should be able to index with insertMany', async function () {
      const tweets = [
        {
          message: 'insertMany 1',
        },
        {
          message: 'insertMany 2',
        },
      ];
      await tweetModel.insertMany(tweets);
      await sleep(1200);
      const results = await tweetModel.search({
        query_string: {
          query: 'insertMany',
        },
      });
      results.hits.total.should.eql(2);
      const expected = tweets.map((doc) => doc.message);
      const searched = results.hits.hits.map((doc: { _source: { message: any } }) => doc._source.message);
      should(expected.sort()).be.eql(searched.sort());
    });

    it('should report errors', async function () {
      let err;
      try {
        await tweetModel.search({
          // @ts-ignore
          queriez: 'jamescarr',
        });
      } catch (e) {
        err = e;
      }
      err.message.should.match(/(SearchPhaseExecutionException|parsing_exception)/);
    });
  });

  describe('Removing', async function () {
    let tweet: ITweetModel;
    beforeEach(async function () {
      tweet = await tweetModel.create({
        user: 'jamescarr',
        message: 'Saying something I shouldnt',
      });
      await sleep(1000);
    });

    it('should remove from index when model is removed', async function () {
      await tweet.remove();
      await sleep(1000);
      const res = await tweetModel.search({
        query_string: {
          query: 'shouldnt',
        },
      });
      res.hits.total.should.eql(0);
    });

    it('should remove only index', async function () {
      // await tweetModel.on('es-removed')
      await tweet.unIndex();
      await sleep(1000);
      const res = await tweetModel.search({
        query_string: {
          query: 'shouldnt',
        },
      });
      res.hits.total.should.eql(0);
    });

    it('should queue for later removal if not in index', async function () {
      // behavior here is to try 3 times and then give up.
      const tweet: ITweetModel = new tweetModel();
      const opts = { tries: 2 };
      const triggerRemoved = false;
      //
      // await tweetModel.on('es-removed', function (err, res) {
      //   triggerRemoved = true;
      // });
      await tweet.unIndex(opts);
      // should.exist(err);
      // opts.tries.should.eql(0);
      // triggerRemoved.should.eql(true);
    });

    it('should remove from index when findOneAndRemove', async function () {
      tweet = await tweetModel.create({
        user: 'jamescarr',
        message: 'findOneAndRemove',
      });

      await tweetModel.findByIdAndRemove(tweet._id);
      const res = await tweetModel.search({
        query_string: {
          query: 'findOneAndRemove',
        },
      });
      res.hits.total.should.eql(0);
    });

    it("should be able to execute findOneAndRemove if document doesn't exist", async function () {
      const doc = await tweetModel.findOneAndRemove({
        message: 'Not existing document',
      });
      should.not.exist(doc);
    });
  });

  describe('Isolated Models', async function () {
    before(async function () {
      await talkModel.create({
        speaker: '',
        year: 2013,
        title: 'Dude',
        abstract: '',
        bio: '',
      });

      await tweetModel.create({
        user: 'Dude',
        message: 'Go see the big lebowski',
        post_date: new Date(),
      });
      await sleep(1200);

      // talk.on('es-indexed', async function () {});
    });

    it('should only find models of type Tweet', async function () {
      const res = await tweetModel.search({
        query_string: {
          query: 'Dude',
        },
      });
      res.hits.total.should.eql(1);
      res.hits.hits[0]._source.user.should.eql('Dude');
    });

    it('should only find models of type Talk', async function () {
      const res = await talkModel.search({
        query_string: {
          query: 'Dude',
        },
      });
      res.hits.total.should.eql(1);
      res.hits.hits[0]._source.title.should.eql('Dude');
    });
  });

  describe('Always hydrate', async function () {
    before(async function () {
      await peopleModel.create({
        name: 'James Carr',
        address: 'Exampleville, MO',
        phone: '(555)555-5555',
      });
      await sleep(1000);
    });

    it('when gathering search results while respecting default hydrate options', async function () {
      const res = await peopleModel.search({
        query_string: {
          query: 'James',
        },
      });
      res.hits.hits[0].address.should.eql('Exampleville, MO');
      res.hits.hits[0].name.should.eql('James Carr');
      res.hits.hits[0].should.not.have.property('phone');
      res.hits.hits[0].should.not.be.an.instanceof(peopleModel);
    });
  });

  describe('Subset of Fields', async function () {
    before(async function () {
      await talkModel.create({
        speaker: 'James Carr',
        year: 2013,
        title: 'Node.js Rocks',
        abstract: 'I told you node.js was cool. Listen to me!',
        bio: 'One awesome dude.',
      });
      await sleep(1000);
    });

    it('should only return indexed fields', async function () {
      const res = await talkModel.search({
        query_string: {
          query: 'cool',
        },
      });

      const talk = res.hits.hits[0]._source;

      res.hits.total.should.eql(1);
      talk.should.have.property('title');
      talk.should.have.property('year');
      talk.should.have.property('abstract');
      talk.should.not.have.property('speaker');
      talk.should.not.have.property('bio');
    });

    it('should hydrate returned documents if desired', async function () {
      const res = await talkModel.search(
        {
          query_string: {
            query: 'cool',
          },
        },
        {
          hydrate: true,
        }
      );
      const talk = res.hits.hits[0];

      res.hits.total.should.eql(1);
      talk.should.have.property('title');
      talk.should.have.property('year');
      talk.should.have.property('abstract');
      talk.should.have.property('speaker');
      talk.should.have.property('bio');
      talk.should.be.an.instanceof(talkModel);
    });

    describe('Sub-object Fields', async function () {
      before(async function () {
        await peopleModel.create({
          name: 'Bob Carr',
          address: 'Exampleville, MO',
          phone: '(555)555-5555',
          life: {
            born: 1950,
            other: 2000,
          },
        });
        await sleep(1000);
      });

      it('should only return indexed fields and have indexed sub-objects', async function () {
        const res = await peopleModel.search({
          query_string: {
            query: 'Bob',
          },
        });
        res.hits.hits[0].address.should.eql('Exampleville, MO');
        res.hits.hits[0].name.should.eql('Bob Carr');
        res.hits.hits[0].should.have.property('life');
        res.hits.hits[0].life.born.should.eql(1950);
        res.hits.hits[0].life.should.not.have.property('died');
        res.hits.hits[0].life.should.not.have.property('other');
        res.hits.hits[0].should.not.have.property('phone');
        res.hits.hits[0].should.not.be.an.instanceof(peopleModel);
      });
    });

    it('should allow extra query options when hydrating', async function () {
      const res = await talkModel.search(
        {
          query_string: {
            query: 'cool',
          },
        },
        {
          hydrate: true,
          hydrateOptions: {
            lean: true,
          },
        }
      );
      const talk = res.hits.hits[0];

      res.hits.total.should.eql(1);
      talk.should.have.property('title');
      talk.should.have.property('year');
      talk.should.have.property('abstract');
      talk.should.have.property('speaker');
      talk.should.have.property('bio');
      talk.should.not.be.an.instanceof(talkModel);
    });
  });

  describe('Existing Index', async function () {
    before(async function () {
      await deleteIndexIfExists(['ms_sample']);
      await getEsClient().indices.create({
        index: 'ms_sample',
        body: {
          mappings: {
            properties: {
              name: {
                type: 'text',
              },
            },
          },
        },
      });
    });

    it('should just work', async function () {
      await bumModel.create({
        name: 'Roger Wilson',
      });
      await sleep(1000);
      const results = await bumModel.search({
        query_string: {
          query: 'Wilson',
        },
      });
      results.hits.total.should.eql(1);
    });
  });

  describe('Disable automatic indexing', async function () {
    it('should save but not index', async function () {
      const dog = await dogModel.create({ name: 'Sparky' });
      await sleep(1200);
      let err;
      try {
        await getEsClient().get({
          type: undefined,
          index: 'dogs',
          id: dog._id.toString(),
        });
      } catch (e) {
        err = e;
      }
      err.message.should.match(/(index_not_found_exception)/);
    });
  });
});
