const INDEXING_TIMEOUT = process.env.INDEXING_TIMEOUT || 4000;
const BULK_ACTION_TIMEOUT = process.env.BULK_ACTION_TIMEOUT || 6000;

export const config = {
  mongoUrl: 'mongodb://0.0.0.0:27017/es-test',
  mongoOpts: {},
  INDEXING_TIMEOUT: INDEXING_TIMEOUT,
  BULK_ACTION_TIMEOUT: BULK_ACTION_TIMEOUT,
};
