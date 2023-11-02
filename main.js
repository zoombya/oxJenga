import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
//import { VRButton } from 'three/addons/webxr/VRButton.js'
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js'
import { makeTopFile,makeDatFile,
         oxcord_to_scene,
         updateStrandsFromDat,
         makeFileDropable
         } from './UTILS/file.js'
//import {onSelectStart, onSelectEnd} from './UTILS/selection_handlers';


import { establishConnection } from './UTILS/oxserve.js'
import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js'


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


let container
let camera, scene, renderer
let controller1, controller2
let controllerGrip1, controllerGrip2

let raycaster
const intersected = []
const tempMatrix = new THREE.Matrix4()

let controls, group

// my oxDNA related mess 
let n_elements, strands
let box 
let instancedMesh
let ox_socket

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

  box = json_data.box
  console.log(box)

  const strands = json_data.systems[0].strands 
  let n_monomers = 0 
  strands.forEach(strand=>{
    n_monomers += (strand.end5 - strand.end3 + 1)
  })
  console.log(n_monomers)
  const sgeometry = new THREE.SphereGeometry(0.015,6,6) 
  const material = new THREE.MeshStandardMaterial( {
     roughness: 0.7,
     metalness: 0.5
   }) 

  instancedMesh = new THREE.InstancedMesh(sgeometry,material,n_monomers)
  instancedMesh.castShadow = true
  instancedMesh.receiveShadow = true
  const dummy = new THREE.Object3D()
  let bid = 0

  // make sure we have no items in the scene group
  while (group.children.length != 0 )
  group.children.pop()

  let round = (v)=>{
    return v.toFixed(3);
  }

  strands.forEach((strand, id)=>{
      // we keep elements on the scene 3 -> 5
      // I'll regret this deeply, but dat parsing is in order 
      strand.monomers.forEach(base=>{
        //base.p = base.p.map(Math.round)

        let p = new THREE.Vector3(...base.p.map(round))
        let a1 = new THREE.Vector3(...base.a1.map(round))
        let a3 = new THREE.Vector3(...base.a3.map(round))
        let a2 = a1.clone().cross(a3)

        let bbPosition =  new THREE.Vector3(
            p.x - (0.34 * a1.x + 0.3408 * a2.x),
            p.y - (0.34 * a1.y + 0.3408 * a2.y),
            p.z - (0.34 * a1.z + 0.3408 * a2.z)
        );

       
        bbPosition.x /= 50 
        bbPosition.y /= 50 
        bbPosition.z /= 50 
        dummy.position.copy(bbPosition)




        dummy.updateMatrix()
        instancedMesh.setMatrixAt(bid, dummy.matrix)
        instancedMesh.setColorAt(bid, strandColors[id%strandColorsLen])
        bid++
    })
  })
  group.add(instancedMesh)


  // play with the group offset, rather than with the mesh offset
  group.position.y += .5
  group.position.z -= 1.5
  group.rotation.y += Math.PI /2
  group.rotation.z -= Math.PI /6

  //generate it's description in oxDNA world
  let top_file = makeTopFile(strands, n_monomers)
  let dat_file = makeDatFile(strands, box)
  
  // let's establish oxServe connection and update cycles here 
  // We block the connection for now
  //ox_socket = establishConnection(instancedMesh, top_file, dat_file)
  //console.log(ox_socket)
  //window.socket = ox_socket

  //ox_socket.start_simulation()


  return [strands, n_monomers]
}
const init = () => {
  container = document.createElement( 'div' )
  container.style="background:none"

  document.body.appendChild( container )

  //let's see if our dat parser workzz
  makeFileDropable(container, (files)=>{
    // assuming we got one file 
    // -> simple parser test 
    files[0].text().then(text=>{
      updateStrandsFromDat(text, instancedMesh)
    })
  })

scene = new THREE.Scene()

  //scene.background = new THREE.Color( 0x808080 )
scene.background = new THREE.Color(0x00000,0)
//scene.background.alpha=1;
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 )
  camera.position.set( 0, 1.6, 5 )

  controls = new OrbitControls( camera, container )
  controls.target.set( 0, 1.6, 0 )
  controls.update()

  // const floorGeometry = new THREE.PlaneGeometry( 4, 4 )
  // const floorMaterial = new THREE.MeshStandardMaterial( {
  //   color: 0xeeeeee,
  //   roughness: 1.0,
  //   metalness: 0.0
  // })
  // const floor = new THREE.Mesh( floorGeometry, floorMaterial )
  // floor.rotation.x = - Math.PI / 2
  // floor.receiveShadow = true
  // scene.add( floor )
  
  let hemilight =  new THREE.HemisphereLight( 0x808080, 0x606060 ) 
  hemilight.intensity=5
  //scene.add(hemilight)

  

  const light = new THREE.DirectionalLight( 0xffffff )
  light.position.set( 0, 6, 0 )
  light.intensity=6
  light.castShadow = true
  light.shadow.camera.top = 2
  light.shadow.camera.bottom = - 2
  light.shadow.camera.right = 2
  light.shadow.camera.left = - 2
  light.shadow.mapSize.set( 2048, 2048 )
  
  let defaultLight = new THREE.Group()
  defaultLight.add(hemilight)
  defaultLight.add(light)
  scene.add(defaultLight)

  //Load up our model here and establish oxServe
  // fetch("./moon.oxview").then((resp)=>resp.text()).then((txt) =>{
  //   [strands, n_elements] = initSceneFromJSON(txt)
  // })
  let designs = [
    "6-bar.oxview",
    "hairygami.oxview",
    "Leaf.oxview",
    "monohole_1b.oxview",
    "moon.oxview",
    "meta.oxview",
    "gated-channel.oxview",
    "plane.oxview"
  ]
  //get random design
  fetch(designs[Math.floor(Math.random()*designs.length)]).then((resp)=>resp.text()).then(initSceneFromJSON)
  
  // fetch("./monohole_1b.oxview").then((resp)=>resp.text()).then((txt) =>{
  //   [strands, n_elements] = initSceneFromJSON(txt)

  //   fetch("./moon.oxview").then((resp)=>resp.text()).then((txt)=>{
  //     initSceneFromJSON(txt)

  //     fetch("./hairygami.oxview").then((resp)=>resp.text()).then((txt)=>{
  //       initSceneFromJSON(txt)
  //     })
  //   })

  // })





  // read from nanobase might be subject to XSSS scripting issues ...
  // need to look more into it, but even oxview.org can't fetch in local dev cycle 

  // we'll use the group to add stuff as this is 
  // allows for grabbing the entire thing 
  group = new THREE.Group()
  scene.add( group )

  renderer = new THREE.WebGLRenderer( { antialias: true , alpha: true} ) 
  renderer.setPixelRatio( window.devicePixelRatio ) 
  renderer.setSize( window.innerWidth, window.innerHeight ) 
  renderer.shadowMap.enabled = true 
  renderer.xr.enabled = true 
  container.appendChild( renderer.domElement ) 

  document.body.appendChild( XRButton.createButton( renderer, { optionalFeatures: [ 'light-estimation' ] } ) ) 



// Don't add the XREstimatedLight to the scene initially.
// It doesn't have any estimated lighting values until an AR session starts.

const xrLight = new XREstimatedLight( renderer );

xrLight.addEventListener( 'estimationstart', () => {

// Swap the default light out for the estimated one one we start getting some estimated values.
scene.add( xrLight );
scene.remove( defaultLight );

// The estimated lighting also provides an environment cubemap, which we can apply here.
if ( xrLight.environment ) {

	scene.environment = xrLight.environment;
}

} );

xrLight.addEventListener( 'estimationend', () => {
  // Swap the lights back when we stop receiving estimated values.
  scene.add( defaultLight );
  scene.remove( xrLight );

  // Revert back to the default environment.
  scene.environment = defaultEnvironment;
} );

  // controllers

  controller1 = renderer.xr.getController( 0 ) 
  // controller1.addEventListener( 'squeezestart', onSelectStart ) 
  // controller1.addEventListener( 'squeezeend', onSelectEnd ) 
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
  //let socket = establishConnection()

  //console.log(socket)
}

const onWindowResize = () => {

  camera.aspect = window.innerWidth / window.innerHeight 
  camera.updateProjectionMatrix() 

  renderer.setSize( window.innerWidth, window.innerHeight ) 

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

    // const instanceId = intersection[ 0 ].instanceId;
    // console.log("instanceID", instanceId)


    const object = intersection.object 
    // console.log(
    //  intersection.instanceId
    // )

    // // intersections 
    // object.setColorAt( intersection.instanceId, new THREE.Color("red"))
    // object.instanceColor.needsUpdate = true

    //object.setColorAt(instanceId, new THREE.Color("red"))

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

  intersectObjects( controller1) 
  intersectObjects( controller2) 
  

  renderer.render( scene, camera ) 

}

init()
animate()