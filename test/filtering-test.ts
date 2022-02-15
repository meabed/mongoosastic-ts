import { deleteIndexIfExists, sleep } from './helper';
import { movieModel } from './models/movie';

describe('Filter mode', async function () {
  before(async function () {
    await deleteIndexIfExists(['movies']);
    await movieModel.deleteMany();
  });

  after(async function () {
    await deleteIndexIfExists(['movies']);
    await movieModel.deleteMany();
  });

  it('should index horror genre', async function () {
    await movieModel.create({
      title: 'LOTR',
      genre: 'horror',
    });
    await sleep(1400);
    const results = await movieModel.search({
      term: {
        genre: 'horror',
      },
    });

    results.hits.total.should.eql(1);
  });

  it('should not index action genre', async function () {
    await movieModel.create({
      title: 'Man in Black',
      genre: 'action',
    });

    await sleep(1400);

    const results = await movieModel.search({
      term: {
        genre: 'action',
      },
    });

    results.hits.total.should.eql(0);
  });

  it('should unindex filtered models', async function () {
    const movie = await movieModel.create({
      title: 'REC',
      genre: 'horror',
    });
    await sleep(3000);
    const results = await movieModel.search({
      term: {
        title: 'rec',
      },
    });

    results.hits.total.should.eql(1);

    movie.genre = 'action';
    await movie.save();
    await sleep(1400);
    const results2 = await movieModel.search({
      term: {
        title: 'rec',
      },
    });

    results2.hits.total.should.eql(0);
  });
});
