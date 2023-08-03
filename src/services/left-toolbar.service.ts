import { ComponentInstance, distinctUntilChanged, Injectable, Observable, Subject } from '@textbus/core'

@Injectable()
export class LeftToolbarService {
  onRefresh = new Subject<void>()
  onComponentActive: Observable<null | ComponentInstance>

  private componentActiveEvent = new Subject<null | ComponentInstance>()

  constructor() {
    this.onComponentActive = this.componentActiveEvent.asObservable().pipe(distinctUntilChanged())
  }

  updateActivatedComponent(current: ComponentInstance | null) {
    this.componentActiveEvent.next(current)
  }
}
