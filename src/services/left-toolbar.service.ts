import { distinctUntilChanged, Observable, Slot, Subject } from '@textbus/core'
import { Injectable } from '@viewfly/core'

@Injectable()
export class LeftToolbarService {
  onRefresh = new Subject<void>()
  onSlotActive: Observable<null | Slot>

  private slotActiveEvent = new Subject<null | Slot>()

  constructor() {
    this.onSlotActive = this.slotActiveEvent.asObservable().pipe(distinctUntilChanged())
  }

  updateActivatedSlot(current: Slot | null) {
    this.slotActiveEvent.next(current)
  }
}
