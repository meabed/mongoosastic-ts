import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { geoModel } from './models/geo';

describe('GeoTest', async function () {
  before(async function () {
    await deleteIndexIfExists(['geos']);
    await geoModel.createMapping();
    await geoModel.deleteMany();
    const mapping = await getEsClient().indices.getMapping({
      index: 'geos',
    });
    mapping.geos.mappings.properties.frame.type.should.eql('geo_shape');
  });

  after(async function () {
    await deleteIndexIfExists(['geos']);
    await geoModel.deleteMany();
  });

  it('should be able to create and store geo coordinates 1', async function () {
    this.timeout(10000);
    const geo = await geoModel.create({
      myId: 1,
      frame: {
        type: 'envelope',
        coordinates: [
          [1, 4],
          [3, 2],
        ],
      },
    });

    // Mongodb request
    const res = await geoModel.find({});

    res.length.should.eql(1);
    res[0].frame.type.should.eql('envelope');
    res[0].frame.coordinates[0].should.eql([1, 4]);
  });

  it('should be able to create and store geo coordinates 2', async function () {
    this.timeout(20000);
    const geo2 = await geoModel.create({
      myId: 2,
      frame: {
        type: 'envelope',
        coordinates: [
          [2, 3],
          [4, 0],
        ],
      },
    });

    // Mongodb request
    const res = await geoModel.find({});

    res.length.should.eql(2);
    res[0].frame.type.should.eql('envelope');
    res[0].frame.coordinates[0].should.eql([1, 4]);
    res[0].frame.coordinates[1].should.eql([3, 2]);
  });

  it('should be able to find geo coordinates in the indexes', async function () {
    // ES request
    await sleep(4000);
    const res = await geoModel.search(
      {
        match_all: {},
      },
      {
        sort: 'myId:asc',
      }
    );
    res.hits.total.should.eql(2);
    res.hits.hits[0]._source.frame.type.should.eql('envelope');
    res.hits.hits[0]._source.frame.coordinates.should.eql([
      [1, 4],
      [3, 2],
    ]);
  });

  it('should be able to resync geo coordinates from the database', async function () {
    this.timeout(20000);
    await deleteIndexIfExists(['geos']);
    await geoModel.createMapping();
    const stream = geoModel.synchronize();
    let count = 0;

    stream.on('data', function () {
      count++;
    });

    return await new Promise((resolve, reject) => {
      stream.on('close', async function () {
        count.should.eql(2);
        await sleep(4000);
        const res = await geoModel.search(
          {
            match_all: {},
          },
          {
            sort: [{ myId: 'asc' }],
          }
        );
        res.hits.total.should.eql(2);
        res.hits.hits[0]._source.frame.type.should.eql('envelope');
        res.hits.hits[0]._source.frame.coordinates.should.eql([
          [1, 4],
          [3, 2],
        ]);
        resolve();
      });
    });
  });

  it('should be able to search points inside frames', async function () {
    await sleep(2000);
    const geoQuery = {
      bool: {
        must: {
          match_all: {},
        },
        filter: {
          geo_shape: {
            frame: {
              shape: {
                type: 'point',
                coordinates: [3, 1],
              },
            },
          },
        },
      },
    };

    // // //
    const res1 = await geoModel.search(geoQuery);
    res1.hits.total.should.eql(1);
    res1.hits.hits[0]._source.myId.should.eql(2);
    //
    geoQuery.bool.filter.geo_shape.frame.shape.coordinates = [1.5, 2.5];
    const res2 = await geoModel.search(geoQuery);
    res2.hits.total.should.eql(1);
    res2.hits.hits[0]._source.myId.should.eql(1);
    //
    geoQuery.bool.filter.geo_shape.frame.shape.coordinates = [3, 2];
    const res3 = await geoModel.search(geoQuery);
    res3.hits.total.should.eql(2);
    //
    geoQuery.bool.filter.geo_shape.frame.shape.coordinates = [0, 3];
    const res4 = await geoModel.search(geoQuery);
    res4.hits.total.should.eql(0);
  });
});
