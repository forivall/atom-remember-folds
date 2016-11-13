'use babel'

import {CompositeDisposable /* , Disposable */} from 'atom'
import createDebug from 'debug'

const debug = createDebug('atom-remember-folds')

// import crypto from 'crypto'
// function hash(text) {
//   let hash = crypto.createHash('sha1')
//   hash.update(text);
//   return hash.digest('hex');
// }

export default new class RememberFolds {
  constructor() {
    this.subscriptions = null
  }

  activate(state) {
    this.folds = state.folds || {}
    // this.hashes = state.hashes || {}
    this.lineCounts = typeof state.lineCounts === 'object' ? state.lineCounts : {}

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      this.onOpenTextEditor(editor)
    }))

    this.subscriptions.add(atom.workspace.onDidDestroyPaneItem((event) => {
      const editor = event.item // maybe editor.
      if (!atom.workspace.isTextEditor(editor)) return
      const buffer = editor.getBuffer()
      if (buffer) {
        this.saveEditorFolds(editor, buffer)
      }
    }))

    // this.onCloseWindow = () => this.saveAllFolds()
    // window.addEventListener('beforeunload', this.onCloseWindow, {capture: true})
    // this.subscriptions.add(new Disposable(() => window.removeEventListener('beforeunload', this.onCloseWindow)))
  }

  deactivate() {
    return this.subscriptions.dispose()
  }

  onOpenTextEditor(editor) {
    let uri = editor.getURI()
    let folds = this.folds[uri]
    if (folds && this.lineCounts[uri] === editor.getLineCount()) {
      for (let fold of folds) {
        editor.foldBufferRange(fold)
      }
    }
  }

  saveEditorFolds(editor, buffer) {
    const displayLayer = buffer.getDisplayLayer(0);
    if (displayLayer == null) {
      console.error('Remember Folds could not get display layer', buffer.displayLayers)
      return
    }

    const uri = editor.getURI()
    if (uri == null) {
      debug('Remember folds ignoring text editor without uri')
      return
    }

    const foldsByMarkerId = displayLayer.foldsMarkerLayer.markersById
    const folds = []
    for (const markerId in foldsByMarkerId) {
      const fold = foldsByMarkerId[markerId]
      folds.push(fold.getRange())
    }
    this.folds[uri] = folds
    this.lineCounts[uri] = editor.getLineCount()
  }

  saveAllFolds() {
    const start = Date.now()
    atom.workspace.textEditorRegistry.editors.forEach((editor) => {
      const buffer = editor.getBuffer()
      if (buffer) {
        this.saveEditorFolds(editor, buffer)
      }
    })
    debug('Saving all folds %d ms', Date.now() - start)
  }

  serialize() {
    this.saveAllFolds()
    return {
      folds: this.folds,
      lineCounts: this.lineCounts
    }
  }
}
