// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'mongoose'.
const mongoose = require('mongoose');
const config = require('./config');
const Tweet = require('./models/tweet');

describe('Index Method', async () => {
  before(async () => {
    try {
      await mongoose.connect(config.mongoUrl);
    } catch (error) {
      console.log(error);
    }
    await config.deleteIndexIfExists(['tweets', 'public_tweets']);
    await Tweet.deleteMany();
    await config.createModelAndEnsureIndex(Tweet, {
      user: 'jamescarr',
      message: 'I know kung-fu!',
      post_date: new Date(),
    });
  });

  after(async (done) => {
    Tweet.deleteMany();
    await config.deleteIndexIfExists(['tweets', 'public_tweets']);
    await mongoose.disconnect();
    done();
  });

  it('should be able to index it directly without saving', async () => {
    const doc = await Tweet.findOne({ message: 'I know kung-fu!' });
    doc.message = 'I know nodejitsu!';
    await doc.index();

    try {
      await Tweet.search({
        query_string: {
          query: 'know',
        },
      });
    } catch (e) {
      console.error(e);
    }
    process.exit(1);
    // res.hits.hits[0]._source.message.should.eql('I know nodejitsu!');
  });

  it('should be able to index to alternative index', function (done) {
    Tweet.findOne(
      {
        message: 'I know kung-fu!',
      },
      function (err: any, doc: any) {
        doc.message = 'I know taebo!';
        doc.index(
          {
            index: 'public_tweets',
          },
          function () {
            setTimeout(function () {
              Tweet.search(
                {
                  query_string: {
                    query: 'know',
                  },
                },
                {
                  index: 'public_tweets',
                },
                function (err1: any, res: any) {
                  res.hits.hits[0]._source.message.should.eql('I know taebo!');
                  done();
                }
              );
            }, config.INDEXING_TIMEOUT);
          }
        );
      }
    );
  });

  // This does not work in elastic > 6.x
  // Indices created in 6.x only allow a single-type per index
  /* it('should be able to index to alternative index and type', function (done) {
    Tweet.findOne({
      message: 'I know kung-fu!'
    }, function (err, doc) {
      doc.message = 'I know taebo!'
      doc.index({
        index: 'public_tweets',
        type: 'utterings'
      }, function () {
        setTimeout(function () {
          Tweet.search({
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
