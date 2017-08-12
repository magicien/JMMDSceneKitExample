'use strict'

import {
  CGPoint,
  SCNView,
  SKAction,
  SKColor,
  SKLabelHorizontalAlignmentMode,
  SKLabelNode,
  SKScene,
  SKSceneScaleMode,
  SKSpriteNode
} from 'jscenekit'

const _controlIDs = ['model', 'motion']
const _loadingText = 'Loading...'

export default class GameView extends SCNView {
  constructor(frame, options = null) {
    super(frame, options)

    /** @type {SKScene} */
    this._loadingScene = null

    /** @type {SKSpriteNode} */
    this._loadingBackground = null

    /** @type {SKLabelNode} */
    this._loadingLabel = null

    this.eventsDelegate = null

    this._setupLoadingScene()
  }

  _setupLoadingScene() {
    this._loadingScene = new SKScene()
    this._loadingScene.scaleMode = SKSceneScaleMode.resizeFill

    //const bgColor = new SKColor(1.0, 1.0, 1.0, 1.0)
    //const bgSize = this.bounds.size
    //this._loadingBackground = SKSpriteNode.nodeWithColorSize(bgColor, bgSize)
    //this._loadingBackground.position = new CGPoint(0, 0)
    //this._loadingScene.addChild(this._loadingBackground)

    this._loadingLabel = new SKLabelNode()
    this._loadingLabel.text = _loadingText
    this._loadingLabel.fontColor = SKColor.white
    this._loadingLabel.horizontalAlignmentMode = SKLabelHorizontalAlignmentMode.left
    this._loadingLabel.position = new CGPoint(50, 50)
    
    const fadeAction = SKAction.repeatForever(
      SKAction.sequence([
        SKAction.fadeOutWithDuration(0.5),
        SKAction.fadeInWithDuration(0.5)
      ])
    )
    this._loadingLabel.run(fadeAction)

    this._loadingScene.addChild(this._loadingLabel)
  }

  mouseDownWith(event) {
    if(!this.eventsDelegate
      || !this.eventsDelegate.mouseDownWith
      || !this.eventsDelegate.mouseDownWith(event)){
      super.mouseDownWith(event)
    }
  }

  mouseDraggedWith(event) {
    if(!this.eventsDelegate
      || !this.eventsDelegate.mouseDraggedWith
      || !this.eventsDelegate.mouseDraggedWith(event)){
      super.mouseDraggedWith(event)
    }
  }

  mouseUpWith(event) {
    if(!this.eventsDelegate
      || !this.eventsDelegate.mouseUpWith
      || !this.eventsDelegate.mouseUpWith(event)){
      super.mouseUpWith(event)
    }
  }

  scrollWheelWith(event) {
    if(!this.eventsDelegate
      || !this.eventsDelegate.scrollWheelWith
      || !this.eventsDelegate.scrollWheelWith(event)){
      super.scrollWheelWith(event)
    }
  }

  showLoading(text = _loadingText) {
    this.disableControls()
    this._loadingLabel.text = text
    this.overlaySKScene = this._loadingScene
  }

  hideLoading() {
    this.overlaySKScene = null
    this.enableControls()
  }

  disableControls() {
    for(const id of _controlIDs){
      document.getElementById(id).disabled = true
    }
  }

  enableControls() {
    for(const id of _controlIDs){
      document.getElementById(id).disabled = false
    }
  }
}
