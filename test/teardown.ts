import mongoose from 'mongoose';
import { closeEsClient } from './helper';

after(async () => {
  await mongoose.disconnect();
  await closeEsClient();
});
