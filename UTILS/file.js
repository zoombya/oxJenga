import * as THREE from 'three'

// super crude transform of oxview json -> top
export const makeTopFile = (strands,n_monomers)=>{
    let lines = []
    // header
    lines.push(`${n_monomers} ${strands.length}`)
    // add the nucleotides 
    strands.forEach((strand, ssid) => {
        //strand indexing starts with 1 
        const sid = ssid + 1 
        //now we can generate all the monomer lines 
        strand.monomers.slice().reverse().forEach(base => {
            lines.push(`${sid} ${base.type} ${"n3" in base ? base.n3: -1} ${"n5" in base ? base.n5: -1}`)
        })
    })
    // spit out the text
    return lines.join("\n")
}

// fast transform of oxview json -> dat
export const makeDatFile = (strands,box,shift)=>{
    // header 
    let lines = [
        `t = 0`,
        `b = ${box.x} ${box.y} ${box.z}`,
        `E = 0 0 0`
    ]
    // make sure to catch 3->5 whilst we go through the strands 
    strands.forEach((strand) =>{
        strand.monomers.slice().reverse().forEach(base =>{
            lines.push(
                `${base.p[0]+shift.x} ${base.p[1]+shift.y} ${base.p[2]+shift.z} ${base.a1[0]} ${base.a1[1]} ${base.a1[2]} ${base.a3[0]} ${base.a3[1]} ${base.a3[2]} 0 0 0 0 0 0`
            )
        })
    }) 
    return lines.join("\n")
}

export const oxcord_to_scene = (pos, offset = [.5,1.3,0])=>{
    return [
        (pos[0]  ) / 50 + offset[0],
        (pos[1]  ) / 50 + offset[1],
        (pos[2]  ) / 50 + offset[2],
    ]
}

// got a dat -> update our model 
// currently meshes live 3->5 
// aaaargh
export const updateStrandsFromDat = (dat_txt, mesh)=>{
    let lines = dat_txt.split("\n")

    let box = new THREE.Vector3().fromArray(lines[1].split('=')[1].trim().split(" ").map(s=>parseFloat(s)))
    const header_offset = 3
    const line_count = lines.length
    mesh.targetPositions = new Map()
    for(let i = header_offset; i < line_count; i++) {
        if (lines[i] === "") {
            continue
        }
        let line = lines[i].split(' ').map(parseFloat)

        if (i === header_offset) {
            console.log(line)
        }

        let p = new THREE.Vector3(line[0],line[1],line[2])
        let a1 = new THREE.Vector3(line[3],line[4],line[5])
        let a3 = new THREE.Vector3(line[4],line[5],line[6])
        let a2 = a1.clone().cross(a3)

        let bbPosition =  new THREE.Vector3(
            p.x - (0.34 * a1.x + 0.3408 * a2.x),
            p.y - (0.34 * a1.y + 0.3408 * a2.y),
            p.z - (0.34 * a1.z + 0.3408 * a2.z)
        ).divideScalar(50);

        // Set a target position to lerp towards in the animation loop
        mesh.targetPositions.set(i-header_offset, bbPosition);
    }

    //centerAndPBC([...mesh.targetPositions.values()], box)
}

// register drop behavior with a handler function consuming a file list
export const makeFileDropable = (element, handle)=>{
    // cancel out default behavior 
    element.addEventListener("dragover", (event) => {
        event.preventDefault()
        element.classList.add('dragging')
    }, false)
    element.addEventListener("dragenter", (event) => {
        event.preventDefault()
        element.classList.add('dragging')
    }, false)
    element.addEventListener("dragexit", (event) => {
        event.preventDefault()
        element.classList.remove('dragging')
    }, false)
    // register the actual drop
    element.addEventListener("drop", (event) => {
        event.preventDefault();
        element.classList.remove('dragging');
        const files = event.dataTransfer.files
        handle(files)
    }, false)
}