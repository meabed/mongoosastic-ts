import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { kittenModel } from './models/kitten';

describe('Suggesters', async function () {
  before(async function () {
    await deleteIndexIfExists(['kittens']);
    await kittenModel.createMapping();
    await kittenModel.deleteMany();
    await kittenModel.create({
      name: 'Cookie',
      breed: 'Aegean',
    });
    await kittenModel.create({
      name: 'Chipmunk',
      breed: 'Aegean',
    });
    await kittenModel.create({
      name: 'Twix',
      breed: 'Persian',
    });
    await kittenModel.create({
      name: 'Cookies and Cream',
      breed: 'Persian',
    });
    await sleep(1500);
  });

  after(async function () {
    await kittenModel.deleteMany();
    await deleteIndexIfExists(['kittens']);
  });

  describe('Testing Suggest', async function () {
    it('should index property name with type completion', async function () {
      await kittenModel.createMapping();
      const mapping = await getEsClient().indices.getMapping({
        index: 'kittens',
      });
      const props = mapping.kittens.mappings.properties;
      props.name.type.should.eql('completion');
    });

    it('should return suggestions after hits', async function () {
      const res = await kittenModel.search(
        {
          match_all: {},
        },
        {
          suggest: {
            kittensuggest: {
              text: 'Cook',
              completion: {
                field: 'name',
              },
            },
          },
        }
      );
      res.should.have.property('suggest');
      res.suggest.kittensuggest[0].options.length.should.eql(2);
    });
  });
});
