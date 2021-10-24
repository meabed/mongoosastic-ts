import { createModelAndEnsureIndex, createModelAndSave, deleteIndexIfExists, sleep } from './helper';
import { movieModel } from './models/movie';

describe('Filter mode', async () => {
  before(async () => {
    await deleteIndexIfExists(['movies']);
    await movieModel.deleteMany();
  });

  after(async () => {
    await deleteIndexIfExists(['movies']);
    await movieModel.deleteMany();
  });

  it('should index horror genre', async () => {
    await createModelAndEnsureIndex(movieModel, {
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

  it('should not index action genre', async () => {
    await createModelAndSave(movieModel, {
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

  it('should unindex filtered models', async () => {
    const movie = await createModelAndEnsureIndex(movieModel, {
      title: 'REC',
      genre: 'horror',
    });
    await sleep(1400);
    const results = await movieModel.search({
      term: {
        title: 'rec',
      },
    });

    results.hits.total.should.eql(1);

    movie.genre = 'action';
    await movie.save();

    const results2 = await movieModel.search({
      term: {
        title: 'rec',
      },
    });

    results2.hits.total.should.eql(0);
  });
});
