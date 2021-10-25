import mongoose from 'mongoose';
import { closeEsClient } from './helper';

after(async function () {
  await mongoose.disconnect();
  await closeEsClient();
});
