function makeTopFile(name) {
    const top = []; // string of contents of .top file
    // remove any gaps in the particle numbering
    let [newElementIds, newStrandIds, counts, gsSubtypes] = getNewIds();
    let firstLine = [counts['totParticles'], counts['totStrands']];
    if (counts['totGS'] > 0) {
        // Add extra counts for protein/DNA/ cg DNA simulation
        firstLine = firstLine.concat(['totNuc', 'totAA', 'totNucleic', 'totPeptide'].map(v => counts[v]));
    }
    else if (counts['totAA'] > 0) {
        // Add extra counts needed in protein simulation
        firstLine = firstLine.concat(['totNuc', 'totAA', 'totNucleic'].map(v => counts[v]));
    }
    top.push(firstLine.join(" "));
    newElementIds.forEach((_id, e) => {
        let n3 = e.n3 ? newElementIds.get(e.n3) : -1;
        let n5 = e.n5 ? newElementIds.get(e.n5) : -1;
        let cons = [];
        // Protein mode
        if (counts['totAA'] > 0 || counts['totGS'] > 0) {
            if (e.isAminoAcid() || e.isGS()) {
                for (let i = 0; i < e.connections.length; i++) {
                    let c = e.connections[i];
                    if (newElementIds.get(c) > newElementIds.get(e) && newElementIds.get(c) != n5) {
                        cons.push(newElementIds.get(c));
                    }
                }
            }
        }
        if (e.isGS()) {
            top.push([newStrandIds.get(e.strand), "gs" + gsSubtypes.subtypelist[_id], n3, n5, ...cons].join(' '));
        }
        else {
            top.push([newStrandIds.get(e.strand), e.type, n3, n5, ...cons].join(' '));
        }
    });
    //makeTextFile(name+".top", top.join("\n")); //make .top 
    //this is absolute abuse of ES6 and I feel a little bad about it
    return { a: newElementIds, b: firstLine, c: counts, file_name: name + ".top", file: top.join("\n"), gs: gsSubtypes };
}
function makeDatFile(name, altNumbering = undefined) {
    // Get largest absolute coordinate:
    let maxCoord = 0;
    elements.forEach(e => {
        let p = e.getPos();
        maxCoord = Math.max(maxCoord, Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)));
    });
    let dat = "";
    let box = Math.ceil(3 * maxCoord);
    dat = [
        `t = 0`,
        `b = ${box} ${box} ${box}`,
        `E = 0 0 0\n`
    ].join('\n');
    // get coordinates for all elements, in the correct order
    if (altNumbering) {
        altNumbering.forEach((_id, e) => {
            dat += e.getDatFileOutput();
        });
    }
    else {
        systems.forEach(system => {
            system.strands.forEach((strand) => {
                strand.forEach(e => {
                    dat += e.getDatFileOutput();
                }, true); //oxDNA runs 3'-5'
            });
        });
    }
    return { file_name: name + ".dat", file: dat }; //make .dat file
}