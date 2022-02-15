import { deleteIndexIfExists, sleep } from './helper';
import { textModel } from './models/text';

describe('Highlight search', async function () {
  const responses = [
    "You don't see people at their best in this job, said <em>Death</em>.",
    'The <em>death</em> of the warrior or the old man or the little child, this I understand, and I take away the pain',
    'I do not understand this <em>death</em>-of-the-mind',
    "The only reason for walking into the jaws of <em>Death</em> is so's you can steal his gold teeth",
  ];

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
    await sleep(1000);
  });

  after(async function () {
    await textModel.deleteMany();
    await deleteIndexIfExists(['texts']);
  });

  describe('Highlight without hydrating', async function () {
    it('should return highlighted text on every hit result', async function () {
      const res = await textModel.search(
        {
          match_phrase: {
            quote: 'Death',
          },
        },
        {
          highlight: {
            fields: {
              quote: {},
            },
          },
        }
      );
      res.hits.total.should.eql(3);
      res.hits.hits.forEach(function (text: any) {
        text.should.have.property('highlight');
        text.highlight.should.have.property('quote');
        text.highlight.quote.forEach(function (query: any) {
          // @ts-ignore
          responses.should.containEql(query);
        });
      });
    });
  });

  describe('Highlight hydrated results', async function () {
    it('should return highlighted text on every resulting document', async function () {
      const res = await textModel.search(
        {
          match_phrase: {
            quote: 'Death',
          },
        },
        {
          hydrate: true,
          highlight: {
            fields: {
              quote: {},
            },
          },
        }
      );
      res.hits.total.should.eql(3);
      res.hits.hits.forEach(function (model: any) {
        model.should.have.property('_highlight');
        model._highlight.should.have.property('quote');
        model._highlight.quote.forEach(function (query: any) {
          // @ts-ignore
          responses.should.containEql(query);
        });
      });
    });
  });
});
