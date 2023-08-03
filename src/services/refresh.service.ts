import { Injectable, Subject } from '@textbus/core'

@Injectable()
export class RefreshService {
  onRefresh = new Subject<void>()
}
