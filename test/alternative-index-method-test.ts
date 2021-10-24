import mongoose from 'mongoose';
import { config } from './config';

import { tweetModel } from './models/tweet';
import { createModelAndEnsureIndex, deleteIndexIfExists, sleep } from './helper';
import { expect } from 'chai';

describe('Index Method', async () => {
  before(async () => {
    try {
      await mongoose.connect(config.mongoUrl);
    } catch (error) {
      console.log(error);
    }
    await deleteIndexIfExists(['tweets', 'public_tweets']);
    await tweetModel.deleteMany();
    await createModelAndEnsureIndex(tweetModel, {
      user: 'jamescarr',
      message: 'I know kung-fu!',
      post_date: new Date(),
    });
  });

  after(async () => {
    await tweetModel.deleteMany();
    await deleteIndexIfExists(['tweets', 'public_tweets']);
    await mongoose.disconnect();
  });

  it('should be able to index it directly without saving', async () => {
    const doc = await tweetModel.findOne({ message: 'I know kung-fu!' });
    doc.message = 'I know nodejitsu!';
    await doc.index();
    await sleep(1200);
    const res = await tweetModel.search({
      query_string: {
        query: 'know',
      },
    });
    expect(res.hits.hits[0]._source.message).to.be.eql('I know nodejitsu!');
  });

  it('should be able to index to alternative index', async () => {
    const doc = await tweetModel.findOne({
      message: 'I know kung-fu!',
    });
    doc.message = 'I know taebo!';
    await doc.index({
      index: 'public_tweets',
    });
    await sleep(1200);
    const res = await tweetModel.search(
      {
        query_string: {
          query: 'know',
        },
      },
      {
        index: 'public_tweets',
      }
    );
    expect(res.hits.hits[0]._source.message).to.be.eql('I know taebo!');
  });

  // This does not work in elastic > 6.x
  // Indices created in 6.x only allow a single-type per index
  /* it('should be able to index to alternative index and type', function (done) {
    tweetModel.findOne({
      message: 'I know kung-fu!'
    }, function (err, doc) {
      doc.message = 'I know taebo!'
      doc.index({
        index: 'public_tweets',
        type: 'utterings'
      }, function () {
        setTimeout(function () {
          tweetModel.search({
            query_string: {
              query: 'know'
            }
          }, {
            index: 'public_tweets',
            type: 'utterings'
          }, function (err1, res) {
            res.hits.hits[0]._source.message.should.eql('I know taebo!')
            done()
          })
        }, config.INDEXING_TIMEOUT)
      })
    })
  }) */
});
