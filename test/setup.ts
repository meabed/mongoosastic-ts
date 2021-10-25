import { config } from './config';
import mongoose from 'mongoose';
import { sleep } from './helper';

before(async () => {
  await mongoose.connect(config.mongoUrl);
});
