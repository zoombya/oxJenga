import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { VRButton } from 'three/addons/webxr/VRButton.js'
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { relax_scenario } from './UTILS/relax_scenarios'
import { establishConnection } from './UTILS/oxserve'

let container
let camera, scene, renderer
let controller1, controller2
let controllerGrip1, controllerGrip2

let raycaster
const intersected = []
const tempMatrix = new THREE.Matrix4()

let controls, group

// Default colors for the strands
const strandColors = [
  new THREE.Color(0xfdd291), //light yellow
  new THREE.Color(0xffb322), //goldenrod
  new THREE.Color(0x437092), //dark blue
  new THREE.Color(0x6ea4cc), //light blue
] 
const strandColorsLen = strandColors.length 
    
const initSceneFromJSON = (txt) => {
  // we recieve an oxView file, so it's json
  const json_data = JSON.parse(txt)
  console.log(json_data)

  const strands = json_data.systems[0].strands 
  let n_monomers = 0 
  strands.forEach(strand=>{
    n_monomers += (strand.end5 - strand.end3 + 1)
  })
  console.log(n_monomers)
  const sgeometry = new THREE.SphereGeometry(0.01,6,6) 
  const material = new THREE.MeshStandardMaterial( {
     roughness: 0.7,
     metalness: 0.0
   }) 

  const instancedMesh = new THREE.InstancedMesh(sgeometry,material,n_monomers)
  instancedMesh.castShadow = true
  instancedMesh.receiveShadow = true
  const dummy = new THREE.Object3D()
  let bid = 0
  
  strands.forEach((strand, id)=>{
      strand.monomers.forEach(base=>{
        dummy.position.set(
        (base.p[0]  ) / 50 + .5,
        (base.p[1]  ) / 50 + 1.3,
        (base.p[2]  ) / 50  ,
      )
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(bid, dummy.matrix)
      instancedMesh.setColorAt(bid, strandColors[id%strandColorsLen])
      bid++
    })
  })
  group.add(instancedMesh)
}
const init = () => {
  container = document.createElement( 'div' )
  document.body.appendChild( container )

  scene = new THREE.Scene()
  scene.background = new THREE.Color( 0x808080 )

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 )
  camera.position.set( 0, 1.6, 5 )

  controls = new OrbitControls( camera, container )
  controls.target.set( 0, 1.6, 0 )
  controls.update()

  const floorGeometry = new THREE.PlaneGeometry( 4, 4 )
  const floorMaterial = new THREE.MeshStandardMaterial( {
    color: 0xeeeeee,
    roughness: 1.0,
    metalness: 0.0
  })
  const floor = new THREE.Mesh( floorGeometry, floorMaterial )
  floor.rotation.x = - Math.PI / 2
  floor.receiveShadow = true
  scene.add( floor )

  scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) )

  const light = new THREE.DirectionalLight( 0xffffff )
  light.position.set( 0, 6, 0 )
  light.castShadow = true
  light.shadow.camera.top = 2
  light.shadow.camera.bottom = - 2
  light.shadow.camera.right = 2
  light.shadow.camera.left = - 2
  light.shadow.mapSize.set( 4096, 4096 )
  scene.add( light )

  //Load up our model here
  fetch("./moon.oxview").then((resp)=>resp.text()).then(initSceneFromJSON)
  // read from nanobase might be subject to XSSS scripting issues ...
  // need to look more into it, but even oxview.org can't fetch in local dev cycle 

  // we'll use the group to add stuff as this is 
  // allows for grabbing the entire thing 
  group = new THREE.Group()
  scene.add( group )

  renderer = new THREE.WebGLRenderer( { antialias: true } ) 
  renderer.setPixelRatio( window.devicePixelRatio ) 
  renderer.setSize( window.innerWidth, window.innerHeight ) 
  renderer.outputEncoding = THREE.sRGBEncoding 
  renderer.shadowMap.enabled = true 
  renderer.xr.enabled = true 
  container.appendChild( renderer.domElement ) 

  document.body.appendChild( VRButton.createButton( renderer ) ) 

  // controllers

  controller1 = renderer.xr.getController( 0 ) 
  controller1.addEventListener( 'selectstart', onSelectStart ) 
  controller1.addEventListener( 'selectend', onSelectEnd ) 
  scene.add( controller1 ) 

  controller2 = renderer.xr.getController( 1 ) 
  controller2.addEventListener( 'selectstart', onSelectStart ) 
  controller2.addEventListener( 'selectend', onSelectEnd ) 
  scene.add( controller2 ) 

  const controllerModelFactory = new XRControllerModelFactory() 

  controllerGrip1 = renderer.xr.getControllerGrip( 0 ) 
  controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) ) 
  scene.add( controllerGrip1 ) 

  controllerGrip2 = renderer.xr.getControllerGrip( 1 ) 
  controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) ) 
  scene.add( controllerGrip2 ) 

  //

  const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] ) 

  const line = new THREE.Line( geometry ) 
  line.name = 'line' 
  line.scale.z = 5 

  controller1.add( line.clone() ) 
  controller2.add( line.clone() ) 

  raycaster = new THREE.Raycaster() 

  //

  window.addEventListener( 'resize', onWindowResize ) 


  //work on oxserve stuff 
  let socket = establishConnection()
  console.log(socket)
}

const onWindowResize = () => {

  camera.aspect = window.innerWidth / window.innerHeight 
  camera.updateProjectionMatrix() 

  renderer.setSize( window.innerWidth, window.innerHeight ) 

}

function onSelectStart( event ) {

  const controller = event.target 

  const intersections = getIntersections( controller ) 

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ] 

    const object = intersection.object 
    object.material.emissive.b = 1 
    controller.attach( object ) 

    controller.userData.selected = object 

  }

}

function onSelectEnd( event ) {

  const controller = event.target 

  if ( controller.userData.selected !== undefined ) {

    const object = controller.userData.selected 
    object.material.emissive.b = 0 
    group.attach( object ) 

    controller.userData.selected = undefined 

  }


}

function getIntersections( controller ) {

  tempMatrix.identity().extractRotation( controller.matrixWorld ) 

  raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld ) 
  raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix ) 

  return raycaster.intersectObjects( group.children, false ) 

}

function intersectObjects( controller ) {

  // Do not highlight when already selected

  if ( controller.userData.selected !== undefined ) return 

  const line = controller.getObjectByName( 'line' ) 
  const intersections = getIntersections( controller ) 

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ] 

    const object = intersection.object 
    object.material.emissive.r = 1 
    intersected.push( object ) 

    line.scale.z = intersection.distance 

  } else {

    line.scale.z = 5 

  }

}

function cleanIntersected() {

  while ( intersected.length ) {

    const object = intersected.pop() 
    object.material.emissive.r = 0 

  }

}

//

function animate() {

  renderer.setAnimationLoop( render ) 

}

function render() {

  cleanIntersected() 

  intersectObjects( controller1 ) 
  intersectObjects( controller2 ) 

  renderer.render( scene, camera ) 

}

init()
animate()