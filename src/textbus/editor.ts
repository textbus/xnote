import { Viewer } from '@textbus/platform-browser';
import {
  paragraphComponent,
  paragraphComponentLoader,
  rootComponent,
  rootComponentLoader
} from '@/textbus/components/_api';

export class XNote extends Viewer {
  constructor() {
    super(rootComponent, rootComponentLoader, {
      components: [
        paragraphComponent
      ],
      componentLoaders: [
        paragraphComponentLoader
      ]
    })
  }
}
