import 'reflect-metadata'
import './assets/icons/style.css'
import { createXNote } from './editor'

createXNote(document.getElementById('app')!, {
  content: document.getElementById('article')!.innerHTML
})

