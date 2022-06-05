import { deleteIndexIfExists, sleep } from './helper';
import { textModel } from './models/text';

describe('Hydrate with ES data', async function () {
  before(async function () {
    await textModel.deleteMany();
    await deleteIndexIfExists(['texts']);
    // Quotes are from Terry Pratchett's Discord books
    await textModel.create({
      title: 'The colour of magic',
      quote: "The only reason for walking into the jaws of Death is so's you can steal his gold teeth",
    });
    await textModel.create({
      title: 'The Light Fantastic',
      quote:
        'The death of the warrior or the old man or the little child, this I understand, and I take ' +
        'away the pain and end the suffering. I do not understand this death-of-the-mind',
    });
    await textModel.create({
      title: 'Equal Rites',
      quote: 'Time passed, which, basically, is its job',
    });
    await textModel.create({
      title: 'Mort',
      quote: "You don't see people at their best in this job, said Death.",
    });
    await sleep(1200);
  });

  after(async function () {
    await textModel.deleteMany();
    await deleteIndexIfExists(['texts']);
  });

  describe('Hydrate without adding ES data', async function () {
    it('should return simple objects', async function () {
      const res = await textModel.search(
        {
          match_phrase: {
            quote: 'Death',
          },
        },
        {
          hydrate: true,
        }
      );

      res.hits.total.should.eql(3);
      res.hits.hits.forEach(function (text: any) {
        text.should.not.have.property('_esResult');
      });
    });
  });

  describe('Hydrate and add ES data', async function () {
    it('should return object enhanced with _esResult', async function () {
      const res = await textModel.search(
        {
          match_phrase: {
            quote: 'Death',
          },
        },
        {
          hydrate: true,
          hydrateWithESResults: {},
          highlight: {
            fields: {
              quote: {},
            },
          },
        }
      );
      res.hits.total.should.eql(3);
      res.hits.hits.forEach(function (model: any) {
        model.should.have.property('_esResult');
        model._esResult.should.have.property('_index');
        model._esResult._index.should.eql('texts');
        // model._esResult.should.have.property('_type'); // deprecated
        // model._esResult._type.should.eql('esresulttext')  -- deprecated _type in ES 7.x
        model._esResult.should.have.property('_id');
        model._esResult.should.have.property('_score');
        model._esResult.should.have.property('highlight');

        model._esResult.should.not.have.property('_source');
      });
    });

    it('should remove _source object', async function () {
      const res = await textModel.search(
        {
          match_phrase: {
            quote: 'Death',
          },
        },
        {
          hydrate: true,
          hydrateWithESResults: { source: true },
          highlight: {
            fields: {
              quote: {},
            },
          },
        }
      );
      res.hits.total.should.eql(3);
      res.hits.hits.forEach(function (model: any) {
        model.should.have.property('_esResult');
        model._esResult.should.have.property('_index');
        model._esResult._index.should.eql('texts');
        // model._esResult.should.have.property('_type'); -- deprecated _type in ES 7.x
        // model._esResult._type.should.eql('esresulttext') -- deprecated _type in ES 7.x
        model._esResult.should.have.property('_id');
        model._esResult.should.have.property('_score');
        model._esResult.should.have.property('highlight');

        model._esResult.should.have.property('_source');
        model._esResult._source.should.have.property('title');
        model._esResult._source.should.have.property('title');
      });
    });
  });
});
