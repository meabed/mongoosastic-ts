import { blogModel } from './models/blog';
import { deleteIndexIfExists, getEsClient, sleep } from './helper';
import { expect } from 'chai';

describe('Add Boost Option Per Field', async () => {
  before(async () => {
    await blogModel.deleteMany();
    await deleteIndexIfExists(['blogs']);
  });

  after(async () => {
    await blogModel.deleteMany();
    await deleteIndexIfExists(['blogs']);
  });

  it('should create a mapping with boost field added', async () => {
    await blogModel.createMapping();
    await sleep(200);
    const res = await getEsClient().indices.getMapping({
      index: 'blogs',
    });

    const props = res.blogs.mappings.properties;

    expect(props.title.type).to.be.eql('text');
    expect(props.title.boost).to.be.eql(2.0);
  });
});
