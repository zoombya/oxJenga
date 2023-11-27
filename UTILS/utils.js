import * as THREE from 'three'

function drawBox(size, position) {
    if (!position) {
        position = new THREE.Vector3();
    }

    let material = new THREE.LineBasicMaterial({color: new THREE.Color(0x777777)});
    let points = [];

    let a = position.clone().sub(size.clone().divideScalar(2));
    let b = size.clone().add(a);

    let f = (xComp, yComp, zComp)=>{
        return new THREE.Vector3(xComp.x, yComp.y, zComp.z);
    }

    // I'm sure there's a clever way to do this in a loop...
    points.push(f(a,a,a)); points.push(f(b,a,a));
    points.push(f(a,a,b)); points.push(f(b,a,b));
    points.push(f(a,b,a)); points.push(f(b,b,a));
    points.push(f(a,b,b)); points.push(f(b,b,b));

    points.push(f(a,a,a)); points.push(f(a,b,a));
    points.push(f(a,a,b)); points.push(f(a,b,b));
    points.push(f(b,a,a)); points.push(f(b,b,a));
    points.push(f(b,a,b)); points.push(f(b,b,b));

    points.push(f(a,a,b)); points.push(f(a,a,a));
    points.push(f(a,b,b)); points.push(f(a,b,a));
    points.push(f(b,a,b)); points.push(f(b,a,a));
    points.push(f(b,b,b)); points.push(f(b,b,a));

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var boxObj = new THREE.LineSegments(geometry, material);
    return boxObj;
}

export {drawBox}