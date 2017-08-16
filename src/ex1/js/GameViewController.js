'use strict'

import {
  CGPoint,
  SCNLight,
  SCNNode,
  SCNScene,
  SCNVector3,
  SCNVector4,
  SKColor
} from 'jscenekit'
import {
  MMDCameraNode,
  MMDSceneSource
} from 'jmmdscenekit'
import GameView from './GameView'

const _jsonPath = 'models.json'
const _motionKey = 'motion'
const _basePath = 'art.scnassets/'

export default class GameViewController {
  constructor() {
    this.gameView = new GameView()
    this.view = this.gameView
    this.defaultModelName = null
    this.defaultMotionName = null
    this.modelListLoaded = null
    this.modelList = null
    this.model = null
    this.motion = null
    this.cameraNode = null

    this.lastMousePosition = new CGPoint(0, 0)

    // overwrite params
    if(location.search !== ''){
      const arr = location.search.substr(1).split('&')
      const params = new Map(arr.map((str) => str.split('=')))
      if(params.get('model')){
        this.defaultModelName = params.get('model')
      }
      if(params.get('motion')){
        this.defaultMotionName = params.get('motion')
      }
    }

    this.modelListLoaded = this._getModelList()
  }

  _getModelList() {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest()
      req.open('GET', _jsonPath, true)
      req.responseType = 'json'
      req.onload = () => {
        if(req.status !== 200){
          reject(req)
          return
        }
        this.modelList = req.response
        resolve()
      }
      req.onerror = reject
      req.send(null)
    })
  }

  _initForm() {
    // initialize model form
    const modelSelect = document.getElementById('model')
    let selectedModelOption = null
    for(const modelName of Object.keys(this.modelList)){
      const optionTag = document.createElement('option')
      optionTag.value = modelName
      optionTag.text = modelName
      modelSelect.append(optionTag)
      if(modelName === this.defaultModelName){
        selectedModelOption = optionTag
      }
    }

    if(selectedModelOption){
      const index = Array.from(modelSelect.options).indexOf(selectedModelOption)
      modelSelect.selectedIndex = index
    }else{
      this.defaultModelName = modelSelect.options[0].value
    }

    modelSelect.addEventListener('change', () => {
      this._loadAndSetModel(modelSelect.value)
    })

    // initialize motion form
    const motionSelect = document.getElementById('motion')
    const motions = this.modelList[this.defaultModelName].motions
    let selectedMotionOption = null
    for(const motionName of Object.keys(motions)){
      const optionTag = document.createElement('option')
      optionTag.value = motionName
      optionTag.text = motionName
      motionSelect.append(optionTag)
      if(motionName === this.defaultMotionName){
        selectedMotionOption = optionTag
      }
    }

    if(selectedMotionOption){
      const index = Array.from(motionSelect.options).indexOf(selectedMotionOption)
      motionSelect.selectedIndex = index
    }else{
      this.defaultMotionName = motionSelect.options[0].value
    }

    motionSelect.addEventListener('change', () => {
      this._loadAndSetMotion(motionSelect.value)
    })
  }

  viewDidLoad() {
    this.gameView.showLoading()
    this.gameView.play()

    this.modelListLoaded.then(() => {
      this._initForm()

      return this._loadModel(this.defaultModelName)
    }).then((model) => {
      // create a new scene
      const scene = new SCNScene()

      this.model = model

      // create and add a camera to the scene
      this.cameraNode = new MMDCameraNode()
      this.cameraNode.distance = 50.0
      scene.rootNode.addChildNode(this.cameraNode)

      this._updateCameraPosition()

      // create and add a light to the scene
      const lightNode = new SCNNode()
      lightNode.light = new SCNLight()
      lightNode.light.type = SCNLight.LightType.directional
      lightNode.light.castsShadow = true
      lightNode.position = new SCNVector3(0, 100, 0)
      lightNode.rotation = new SCNVector4(1, 0, 0, Math.PI * 0.5)
      scene.rootNode.addChildNode(lightNode)

      // create and add an ambient light to the scene
      const ambientLightNode = new SCNNode()
      ambientLightNode.light = new SCNLight()
      ambientLightNode.light.type = SCNLight.LightType.ambient
      ambientLightNode.light.color = SKColor.darkGray
      scene.rootNode.addChildNode(ambientLightNode)

      // set the scene to the view
      this.gameView.scene = scene

      // allows the user to manipulate the camera
      this.gameView.allowsCameraControl = false

      // show statistics such as fps and timing information
      this.gameView.showsStatistics = false

      // configure the view
      this.gameView.backgroundColor = SKColor.black

      this.gameView.eventsDelegate = this

      //this.gameView.play()

      scene.rootNode.addChildNode(this.model)
      this.view.hideLoading()

      this._loadAndSetMotion(this.defaultMotionName)
    })
  }

  _loadAndSetModel(modelName) {
    this.view.showLoading()
    this._loadModel(modelName).then((model) => {
      this._setModel(model)
      this._updateMotionList()
      this.view.hideLoading()
    })
  }

  _updateMotionList() {
    const modelSelect = document.getElementById('model')
    const motionSelect = document.getElementById('motion')
    const modelName = modelSelect.value
    const motionList = this.modelList[modelName].motions

    motionSelect.options.length = 0
    if(!motionList){
      return
    }
    for(const motionName of Object.keys(motionList)){
      const optionTag = document.createElement('option')
      optionTag.value = motionName
      optionTag.text = motionName
      motionSelect.append(optionTag)
    }
    this._loadAndSetMotion(motionSelect.value)
  }

  _loadModel(modelName) {
    if(!modelName){
      return Promise.resolve(null)
    }
    const modelData = this.modelList[modelName]
    if(!modelData){
      return Promise.resolve(null)
    }
    const modelPath = _basePath + modelData.path

    const source = MMDSceneSource.sceneSourceWithURLOptions(modelPath)
    return source.didLoad.then(() => {
      const model = source.getModel()
      return model.didLoad.then(() => model)
    })
  }

  _loadAndSetMotion(motionName) {
    if(!motionName){
      this._setMotion(null)
      return
    }
    this.view.showLoading()
    this._loadMotion(motionName).then((motion) => {
      this._setMotion(motion)
      this.view.hideLoading()
    })
  }

  _loadMotion(motionName) {
    if(!motionName){
      return Promise.resolve(null)
    }
    const modelName = document.getElementById('model').value
    const modelData = this.modelList[modelName]
    if(!modelData){
      return Promise.resolve(null)
    }
    const motionList = modelData.motions
    const motionPath = motionList[motionName]
    if(!motionPath){
      return Promise.resolve(null)
    }
    const path = _basePath + motionPath

    const source = MMDSceneSource.sceneSourceWithURLOptions(path)
    return source.didLoad.then(() => {
      const motion = source.getMotion()
      motion.repeatCount = Infinity
      return motion
    })
  }

  _setModel(model) {
    if(this.model === model){
      return
    }

    if(this.model){
      this.model.removeFromParentNode()
    }
    this.model = model
    if(!model){
      return
    }

    this.gameView.scene.rootNode.addChildNode(model)
    this._updateCameraPosition()
  }

  _setMotion(motion) {
    if(!motion){
      if(this.model && this.motion){
        this.model.stopPreparedAnimationForKey(_motionKey)
      }
      this.motion = null
      return
    }

    this.motion = motion
    if(this.model){
      this.model.prepareAnimationForKey(motion, _motionKey)
      this.model.playPreparedAnimationForKey(_motionKey)
    }
  }

  _updateCameraPosition() {
    if(!this.model){
      this.cameraNode.position = new SCNVector3(0, 0, 0)
      return
    }

    const modelBB = this.model.boundingBox
    const x = (modelBB.min.x + modelBB.max.x) * 0.5
    const y = (modelBB.min.y + modelBB.max.y) * 0.5
    const z = (modelBB.min.z + modelBB.max.z) * 0.5
    this.cameraNode.position = new SCNVector3(x, y, z)

    // TODO: update distance
  }

  mouseDownWith(event) {
    this.lastMousePosition = this.view.convertFrom(event.locationInWindow)
    this.lastRotX = this.cameraNode.rotX
    this.lastRotY = this.cameraNode.rotY

    return true
  }

  mouseDraggedWith(event) {
    const mousePosition = this.view.convertFrom(event.locationInWindow)
    this.panCamera(mousePosition.sub(this.lastMousePosition))

    return true
  }

  mouseUpWith(event) {
    return true
  }

  scrollWheelWith(event) {
    const scrollSpeed = 0.01
    let distance = this.cameraNode.distance - event.deltaY * scrollSpeed
    distance = Math.min(80.0, Math.max(10.0, distance))
    this.cameraNode.distance = distance
    return true
  }

  panCamera(direction) {
    const rotateSpeed = 0.01
    let rotX = this.lastRotX - direction.y * rotateSpeed
    const rotY = this.lastRotY - direction.x * rotateSpeed
    rotX = Math.max(-Math.PI / 2, Math.min(0.1, rotX))

    this.cameraNode.rotX = rotX
    this.cameraNode.rotY = rotY
  }
}

