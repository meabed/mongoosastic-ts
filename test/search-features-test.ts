import { bondModel } from './models/bond';
import { deleteIndexIfExists, sleep } from './helper';
import { expect } from 'chai';

describe('Query DSL', async () => {
  before(async () => {
    await bondModel.deleteMany();
    await deleteIndexIfExists(['bonds']);
    await bondModel.create({
      name: 'Bail',
      type: 'A',
      price: 10000,
    });
    await bondModel.create({
      name: 'Commercial',
      type: 'B',
      price: 15000,
    });
    await bondModel.create({
      name: 'Construction',
      type: 'B',
      price: 20000,
    });
    await bondModel.create({
      name: 'Legal',
      type: 'C',
      price: 30000,
    });
    await sleep(1200);
  });

  after(async () => {
    await bondModel.deleteMany();
    await deleteIndexIfExists(['bonds']);
  });

  describe('Range', async () => {
    it('should be able to find within range', async () => {
      const res = await bondModel.search({
        range: {
          price: {
            from: 20000,
            to: 30000,
          },
        },
      });
      res.hits.total.should.eql(2);
      res.hits.hits.forEach((bond: any) => {
        // @ts-ignore
        ['Legal', 'Construction'].should.containEql(bond._source.name);
      });
    });
  });

  describe('Sort', async () => {
    const getNames = function (res: any) {
      return res._source.name;
    };
    const expectedDesc = ['Legal', 'Construction', 'Commercial', 'Bail'];
    const expectedAsc = expectedDesc.concat([]).reverse(); // clone and reverse

    describe('Simple sort', async () => {
      it('should be able to return all data, sorted by name ascending', async () => {
        const res = await bondModel.search(
          {
            match_all: {},
          },
          {
            sort: 'name.keyword:asc',
          }
        );
        res.hits.total.should.eql(4);
        expectedAsc.should.eql(res.hits.hits.map(getNames));
      });

      it('should be able to return all data, sorted by name descending', async () => {
        const res = await bondModel.search(
          {
            match_all: {},
          },
          {
            sort: ['name.keyword:desc'],
          }
        );
        res.hits.total.should.eql(4);
        expectedDesc.should.eql(res.hits.hits.map(getNames));
      });
    });

    describe('Complex sort', async () => {
      it('should be able to return all data, sorted by name ascending', async () => {
        const res = await bondModel.search(
          {
            match_all: {},
          },
          {
            sort: {
              'name.keyword': {
                order: 'asc',
              },
            },
          }
        );
        res.hits.total.should.eql(4);
        expectedAsc.should.eql(res.hits.hits.map(getNames));
      });

      it('should be able to return all data, sorted by name descending', async () => {
        const res = await bondModel.search(
          {
            match_all: {},
          },
          {
            sort: {
              'name.keyword': {
                order: 'desc',
              },
              'type.keyword': {
                order: 'asc',
              },
            },
          }
        );
        res.hits.total.should.eql(4);
        expectedDesc.should.eql(res.hits.hits.map(getNames));
      });
    });
  });

  describe('Aggregations', async () => {
    describe('Simple aggregation', async () => {
      it('should be able to group by term', async () => {
        const res = await bondModel.search(
          {
            match_all: {},
          },
          {
            aggs: {
              names: {
                terms: {
                  field: 'name.keyword',
                },
              },
            },
          }
        );
        res.aggregations.names.buckets.should.eql([
          {
            doc_count: 1,
            key: 'Bail',
          },
          {
            doc_count: 1,
            key: 'Commercial',
          },
          {
            doc_count: 1,
            key: 'Construction',
          },
          {
            doc_count: 1,
            key: 'Legal',
          },
        ]);
      });
    });
  });

  describe('Fuzzy Query', async () => {
    it('should do a fuzzy query', async () => {
      const getNames = function (res: any) {
        return res._source.name;
      };
      await sleep(900);
      const res = await bondModel.search({
        match: {
          name: {
            query: 'comersial',
            fuzziness: 2,
          },
        },
      });
      const names = res.hits.hits.map(getNames);
      expect(names).to.be.eql(['Commercial']);
      res.hits.total.should.eql(1);
    });
  });
});
