import { bookModel, bookModelSaveCounter, setBookModelSaveCounter } from './models/book';
import { deleteIndexIfExists, sleep } from './helper';
import { bookTitlesArray } from './bulk-test';

const clearData = async () => {
  await bookModel.deleteMany();
  await deleteIndexIfExists(['books']);
};

describe('Synchronize', () => {
  after(async () => {
    await bookModel.deleteMany();
    await deleteIndexIfExists(['books']);
  });

  describe('an existing collection with invalid field values', async () => {
    before(async () => {
      await clearData();
      for (const title of bookTitlesArray()) {
        await bookModel.collection.insertOne({ title });
      }
      try {
        await bookModel.collection.insertOne({});
      } catch (e) {}
      await sleep(1200);
    });

    it('should index all but one document', async () => {
      setBookModelSaveCounter(0);
      const stream = bookModel.synchronize();
      let count = 0;
      let errorCount = 0;
      stream.on('data', () => {
        count++;
      });
      stream.on('error', () => {
        errorCount += 1;
      });
      return await new Promise((resolve, reject) => {
        stream.on('close', async () => {
          await sleep(1000);
          count.should.eql(53);
          bookModelSaveCounter.should.eql(count);

          const results = await bookModel.search({
            query_string: {
              query: 'American',
            },
          });
          results.hits.total.should.eql(2);
          errorCount.should.eql(1);
          resolve();
        });
      });
    });
  });

  describe('an existing collection', async () => {
    before(async () => {
      await clearData();
      for (const title of bookTitlesArray()) {
        await bookModel.collection.insertOne({ title });
      }
    });

    it('should index all existing objects', async () => {
      setBookModelSaveCounter(0);
      const stream = bookModel.synchronize();
      let count = 0;
      // const stream = Book.synchronize({}, {saveOnSynchronize: true}), // default behaviour

      stream.on('data', () => {
        count++;
      });

      return await new Promise((resolve, reject) => {
        stream.on('close', async () => {
          count.should.eql(53);
          bookModelSaveCounter.should.eql(count);

          const results = await bookModel.search({
            query_string: {
              query: 'American',
            },
          });
          results.hits.total.should.eql(2);
          resolve();
        });
      });
    });

    it('should index all existing objects without saving them in MongoDB', async () => {
      setBookModelSaveCounter(0);
      const stream = bookModel.synchronize({}, { saveOnSynchronize: false });
      let count = 0;

      stream.on('data', (err, doc) => {
        if (doc._id) count++;
      });

      return await new Promise((resolve, reject) => {
        stream.on('close', async () => {
          count.should.eql(53);
          bookModelSaveCounter.should.eql(0);

          const results = await bookModel.search({
            query_string: {
              query: 'American',
            },
          });
          results.hits.total.should.eql(2);
          resolve();
        });
      });
    });
  });
});
