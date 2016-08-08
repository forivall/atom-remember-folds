'use babel'

import {CompositeDisposable} from 'atom'

// import crypto from 'crypto'
// function hash(text) {
//   let hash = crypto.createHash('sha1')
//   hash.update(text);
//   return hash.digest('hex');
// }

export default {
  subscriptions: null,

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
      let editor = event.item // maybe editor.
      if (editor.buffer) {
        this.onCloseTextEditor(editor)
      }
    }))
  },

  onOpenTextEditor(editor) {
    let uri = editor.getURI()
    let folds = this.folds[uri]
    if (folds && this.lineCounts[uri] === editor.getLineCount()) {
      for (let fold of folds) {
        editor.foldBufferRow(fold[0])
      }
    }
  },

  onCloseTextEditor(editor) {
    let foldsByMarkerId = editor.buffer.displayLayers[0].foldsMarkerLayer.markersById
    let uri = editor.getURI()
    let folds = []
    for (let markerId in foldsByMarkerId) {
      let fold = foldsByMarkerId[markerId]
      folds.push(fold.getRange())
    }
    this.folds[uri] = folds
    this.lineCounts[uri] = editor.getLineCount()
  },

  deactivate() {
    return this.subscriptions.dispose()
  },

  serialize() {
    return {
      folds: this.folds,
      lineCounts: this.lineCounts
    }
  },
}
