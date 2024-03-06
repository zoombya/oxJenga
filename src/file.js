import * as THREE from "three";

// Super-crude transform of oxview json -> top
function makeTopFile(system) {
    let lines = [];
    // Header
    lines.push(`${system.getSize()} ${system.strands.length}`);
    // Add the nucleotides
    system.strands.forEach(strand => {
        // Generate all the monomer lines
        strand.monomers.slice().reverse().forEach(m => {
            lines.push([
                strand.id + 1,
                m.type,
                m.n3 === undefined ? -1 : m.n3.id,
                m.n5 === undefined ? -1 : m.n5.id
            ].join(" "));
        });
    });
    // spit out the text
    return lines.join("\n");
}

// fast transform of oxview json -> dat
function makeDatFile (system) {
    // header 
    let lines = [
        "t = 0",
        `b = ${system.box.x} ${system.box.y} ${system.box.z}`,
        "E = 0 0 0"
    ];
    // make sure to catch 3->5 whilst we go through the strands 
    system.strands.forEach(strand => {
        strand.monomers.slice().reverse().forEach(base => {
            lines.push([...[
                base.position, base.a1, base.a3
            ].flatMap(v=>v.toArray()), 0, 0, 0, 0, 0, 0].join(" "));
        });
    });
    return lines.join("\n");
}

// got a dat -> update our model 
// currently meshes live 3->5 
// aaaargh
function updateStrandsFromDat(dat_txt, system) {
    let lines = dat_txt.split("\n");

    const header_offset = 3;
    const line_count = lines.length;
    for (let i = header_offset; i < line_count; i++) {
        if (lines[i] === "") {
            continue;
        }
        let line = lines[i].split(" ").map(parseFloat);

        let p = new THREE.Vector3(line[0], line[1], line[2]);
        //let a1 = new THREE.Vector3(line[3], line[4], line[5]);
        //let a3 = new THREE.Vector3(line[4], line[5], line[6]);
        //let a2 = a1.clone().cross(a3);

        // Set a target position to lerp towards in the animation loop
        system.elements.get(i - header_offset).targetPosition = p;
    }
}

// register drop behavior with a handler function consuming a file list
function makeFileDropable(element, handle) {
    // cancel out default behavior 
    element.addEventListener("dragover", (event) => {
        event.preventDefault();
        element.classList.add("dragging");
    }, false);
    element.addEventListener("dragenter", (event) => {
        event.preventDefault();
        element.classList.add("dragging");
    }, false);
    element.addEventListener("dragexit", (event) => {
        event.preventDefault();
        element.classList.remove("dragging");
    }, false);
    // register the actual drop
    element.addEventListener("drop", (event) => {
        event.preventDefault();
        element.classList.remove("dragging");
        const files = event.dataTransfer.files;
        handle(files);
    }, false);
}

export {makeTopFile, makeDatFile, updateStrandsFromDat, makeFileDropable};