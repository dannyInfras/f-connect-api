import { Injectable } from '@nestjs/common';
import { Observable,Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AppLogger } from '@/shared/logger/logger.service';

export interface AppEvent<T = any> {
  name: string;
  data: T;
}

@Injectable()
export class EventEmitterService {
  private readonly eventBus: Subject<AppEvent>;

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(EventEmitterService.name);
    this.eventBus = new Subject<AppEvent>();
  }

  /**
   * Emit an event with the provided name and data
   */
  emit<T>(name: string, data: T): void {
    const ctx = {
      requestID: 'internal',
      url: 'internal',
      ip: '0.0.0.0',
      user: null,
    };
    this.logger.log(ctx, `Emitting event: ${name}`);
    this.eventBus.next({ name, data });
  }

  /**
   * Listen for events with the provided name
   */
  listen<T>(eventName: string): Observable<T> {
    return this.eventBus.asObservable().pipe(
      filter((event) => event.name === eventName),
      map((event) => event.data),
    );
  }
}
