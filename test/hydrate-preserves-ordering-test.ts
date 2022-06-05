import { deleteIndexIfExists, sleep } from './helper';
import { rankModel } from './models/rank';

describe('Hydrate with ES data Ordered', async function () {
  before(async function () {
    await rankModel.deleteMany();
    await deleteIndexIfExists(['ranks']);
    await rankModel.create({
      title: 'The colour of magic',
      rank: 2,
    });
    await rankModel.create({
      title: 'The Light Fantastic',
      rank: 4,
    });
    await rankModel.create({
      title: 'Equal Rites',
      rank: 0,
    });
    await rankModel.create({
      title: 'MorzartEstLà',
      rank: -10.4,
    });
    await sleep(1000);
  });

  after(async function () {
    await rankModel.deleteMany();
    await deleteIndexIfExists(['ranks']);
  });

  describe('Preserve ordering from MongoDB on hydration', async function () {
    it("should return an array of objects ordered 'desc' by MongoDB", async function () {
      const res = await rankModel.esSearch(
        {},
        {
          hydrate: true,
          hydrateOptions: { sort: '-rank' },
        }
      );

      res.hits.total.should.eql(4);
      res.hits.hits[0].rank.should.eql(4);
      res.hits.hits[1].rank.should.eql(2);
      res.hits.hits[2].rank.should.eql(0);
      res.hits.hits[3].rank.should.eql(-10.4);
    });
  });

  describe('Preserve ordering from MongoDB on hydration', async function () {
    it("should return an array of objects ordered 'asc' by MongoDB", async function () {
      const res = await rankModel.esSearch(
        {},
        {
          hydrate: true,
          hydrateOptions: { sort: 'rank' },
        }
      );

      res.hits.total.should.eql(4);
      res.hits.hits[0].rank.should.eql(-10.4);
      res.hits.hits[1].rank.should.eql(0);
      res.hits.hits[2].rank.should.eql(2);
      res.hits.hits[3].rank.should.eql(4);
    });
  });

  describe('Preserve ordering from ElasticSearch on hydration', async function () {
    it("should return an array of objects ordered 'desc' by ES", async function () {
      const res = await rankModel.esSearch(
        {
          sort: [
            {
              rank: {
                order: 'desc',
              },
            },
          ],
        },
        {
          hydrate: true,
          hydrateOptions: { sort: undefined },
        }
      );
      res.hits.total.should.eql(4);
      res.hits.hits[0].rank.should.eql(4);
      res.hits.hits[1].rank.should.eql(2);
      res.hits.hits[2].rank.should.eql(0);
      res.hits.hits[3].rank.should.eql(-10.4);
    });
  });

  describe('Preserve ordering from ElasticSearch on hydration', async function () {
    it("should return an array of objects ordered 'asc' by ES", async function () {
      const res = await rankModel.esSearch(
        {
          sort: [
            {
              rank: {
                order: 'asc',
              },
            },
          ],
        },
        {
          hydrate: true,
          hydrateOptions: { sort: undefined },
        }
      );
      res.hits.total.should.eql(4);
      res.hits.hits[0].rank.should.eql(-10.4);
      res.hits.hits[1].rank.should.eql(0);
      res.hits.hits[2].rank.should.eql(2);
      res.hits.hits[3].rank.should.eql(4);
    });
  });
});
