import mongoose from 'mongoose';

beforeAll(async () => {
  jest.setTimeout(30000);
});

afterAll(async () => {
  await mongoose.connection.close();
});
