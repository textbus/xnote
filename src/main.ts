import 'reflect-metadata'
import { createXNote } from './editor'

createXNote(document.getElementById('app')!, {
  content: document.getElementById('article')!.innerHTML
})

