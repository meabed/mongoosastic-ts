import { config } from './config';
import { connect } from 'mongoose';

before(async function () {
  await connect(config.mongoUrl);
});
