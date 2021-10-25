import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { geoBoundModel } from './models/geo-bound';

describe('Geo Bounding Box Test', async function () {
  before(async function () {
    await deleteIndexIfExists(['geobounds']);
    await geoBoundModel.createMapping();
    await geoBoundModel.deleteMany();
    const mapping = await getEsClient().indices.getMapping({
      index: 'geobounds',
    });
    mapping.geobounds.mappings.properties.geo_with_lat_lon.type.should.eql('geo_point');
  });

  after(async function () {
    await deleteIndexIfExists(['geobounds']);
    await geoBoundModel.deleteMany();
  });

  it('should be able to create and store geo coordinates', async function () {
    const geo = await geoBoundModel.create({
      text: '1',
      geo_with_lat_lon: {
        lat: 41.12,
        lon: -71.34,
      },
    });

    const geo2 = await geoBoundModel.create({
      text: '2',
      geo_with_lat_lon: {
        lat: 40.12,
        lon: -71.34,
      },
    });

    const geo3 = await geoBoundModel.create({
      text: '3',
      geo_with_lat_lon: {
        lat: 41,
        lon: -73,
      },
    });

    // Mongodb request
    const res = await geoBoundModel.find({});
    res.length.should.eql(3);
  });

  it('should be able to find geo coordinates in the indexes', async function () {
    await sleep(1000);
    // ES request
    const res = await geoBoundModel.search({
      match_all: {},
    });
    res.hits.total.should.eql(3);
  });

  it('should be able to resync geo coordinates from the database', async function () {
    await deleteIndexIfExists(['geodocs']);
    await geoBoundModel.createMapping();
    const stream = geoBoundModel.synchronize();
    let count = 0;

    stream.on('data', function () {
      count++;
    });

    return new Promise((resolve, reject) => {
      stream.on('close', async function () {
        count.should.eql(3);
        const res = await geoBoundModel.search({
          match_all: {},
        });
        res.hits.total.should.eql(3);
        resolve();
      });
    });
  });

  it('should be able to search bounding box', async function () {
    const geoQuery = {
      bool: {
        must: {
          match_all: {},
        },
        filter: {
          geo_bounding_box: {
            geo_with_lat_lon: {
              top_left: {
                lat: 42,
                lon: -72,
              },
              bottom_right: {
                lat: 40,
                lon: -74,
              },
            },
          },
        },
      },
    };

    const res1 = await geoBoundModel.search(geoQuery);
    res1.hits.total.should.eql(2);
    res1.hits.hits.length.should.eql(2);
  });
});
