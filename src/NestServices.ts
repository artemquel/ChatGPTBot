import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

export class NestServices {
  private static _application: INestApplication;

  private constructor() {}

  public static init(appModule: INestApplication): void {
    if (this._application) {
      throw new Error('App is already set');
    }
    this._application = appModule;
  }

  public static get<T extends abstract new (...args: any) => any>(
    service: T,
  ): InstanceType<T> {
    return this.application.get(service);
  }

  public static getModel<T>(model: string) {
    return this.application.get<T>(getModelToken(model));
  }

  private static get application() {
    if (!this._application) {
      throw new Error('AppModule is not defined');
    }
    return this._application;
  }
}
