import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user/user.js';

export const models = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);
