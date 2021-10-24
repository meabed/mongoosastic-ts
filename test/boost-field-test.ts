import { blogModel } from './models/blog';
import { closeEsClient, deleteIndexIfExists, getEsClient, sleep } from './helper';
import { config } from './config';
import mongoose from 'mongoose';
import { expect } from 'chai';

describe('Add Boost Option Per Field', async () => {
  before(async () => {
    try {
      await mongoose.connect(config.mongoUrl);
    } catch (error) {
      console.log(error);
    }
    await blogModel.deleteMany();
    await deleteIndexIfExists(['blogposts']);
  });

  after(async () => {
    await blogModel.deleteMany();
    await deleteIndexIfExists(['blogposts']);
    await mongoose.disconnect();
    await closeEsClient();
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
