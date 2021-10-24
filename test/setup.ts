import { config } from './config';
import mongoose from 'mongoose';

before(async () => {
  await mongoose.connect(config.mongoUrl);
});
