export function onSelectStart( event ) {

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
  
  export function onSelectEnd( event ) {
  
    const controller = event.target 
  
    if ( controller.userData.selected !== undefined ) {
  
      const object = controller.userData.selected 
      object.material.emissive.b = 0 
      group.attach( object ) 
  
      controller.userData.selected = undefined 
  
    }
  
  
  }