import { closeEsClient } from './helper';
import mongoose from 'mongoose';

after(async function () {
  await mongoose.disconnect();
  await closeEsClient();
});
