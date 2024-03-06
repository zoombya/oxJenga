import * as THREE from "three";

function drawBox(size, position = new THREE.Vector3()) {
    let material = new THREE.LineBasicMaterial({color: new THREE.Color(0x777777)});
    let points = [];

    let a = position.clone().sub(size.clone().divideScalar(2));
    let b = size.clone().add(a);

    let f = (xComp, yComp, zComp)=>{
        return new THREE.Vector3(xComp.x, yComp.y, zComp.z);
    };

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

function drawCone(from, to, radius=0.015, radialSegments=6, color=0xffff00) {
    const geometry = new THREE.ConeGeometry(radius, 1, radialSegments);
    geometry.rotateX(Math.PI * 0.5);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        opacity: 0.5,
        transparent: true,
    });
    const cone = new THREE.Mesh(geometry, material);
    positionCone(cone, from, to);
    return cone;
}

function positionCone(cone, from, to) {
    cone.position.copy(to.clone().add(from).divideScalar(2));
    cone.scale.z = to.distanceTo(from);
    cone.lookAt(from);
}

export {drawBox, drawCone, positionCone};