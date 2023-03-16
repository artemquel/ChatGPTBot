import 'dotenv/config';

export const config = {
  port: 3000,
  botToken: process.env.BOT_TOKEN,
  mongodb: {
    connectionString: process.env.MONGO_CONNECTION_STRING,
    dbName: process.env.MONGO_DB_NAME,
  },
};
