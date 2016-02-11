RememberFolds = require '../lib/remember-folds'

describe "RememberFolds", ->
  [workspaceElement, activationPromise] = []

  beforeEach ->
    workspaceElement = atom.views.getView(atom.workspace)
    activationPromise = atom.packages.activatePackage('remember-folds')

  it "should work"
