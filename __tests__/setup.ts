import { connect } from 'mongoose';

before(async function () {
  await connect('mongodb://0.0.0.0:27017/es-test');
});
