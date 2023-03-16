import { Module } from '@nestjs/common';
import { providers } from './providers/index.js';
import { models } from './models/index.js';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config.js';

@Module({
  imports: [
    MongooseModule.forRoot(config.mongodb.connectionString, {
      dbName: config.mongodb.dbName,
    }),
    models,
  ],
  providers,
})
export class AppModule {}
