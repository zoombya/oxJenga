import * as THREE from "three";

class System {
    constructor(sizeScaling = 1/50) {
        this.sizeScaling = sizeScaling;
        this.strands = [];
        this.idCounter = 0;
    }

    getCenterOfMass() {
        const v = new THREE.Vector3();
        let count = 0;
        for (const strand of this.strands) {
            for (const m of strand.monomers) {
                v.add(m.position);
                count++;
            }
        }
        return v.divideScalar(count).multiplyScalar(this.sizeScaling);
    }
}

class Strand {
    constructor(system, id) {
        this.system = system;
        this.id = id;
        this.monomers = [];
    }
}

class Monomer {
    constructor(strand, position, a1, a3) {
        this.strand = strand;
        this.position = position;
        this.a1 = a1;
        this.a3 = a3;
        this.a2 = a1.clone().cross(a3);

        // Use new id (need to correspond to instanceId)
        this.id = strand.system.idCounter++;
    }

    getBackbonePos() {
        throw "Abstract method getBackbonePos() not implemented";
    }
}

class DNAMonomer extends Monomer {
    getBackbonePos() {
        return new THREE.Vector3(
            this.position.x - (0.34 * this.a1.x + 0.3408 * this.a2.x),
            this.position.y - (0.34 * this.a1.y + 0.3408 * this.a2.y),
            this.position.z - (0.34 * this.a1.z + 0.3408 * this.a2.z)
        ).multiplyScalar(
            this.strand.system.sizeScaling
        );
    }

    getType() {
        return "DNA";
    }
}

class RNAMonomer extends Monomer {
    getBackbonePos() {
        return new THREE.Vector3(
            this.position.x - (0.4 * this.a1.x + 0.2 * this.a2.x),
            this.position.y - (0.4 * this.a1.y + 0.2 * this.a2.y),
            this.position.z - (0.4 * this.a1.z + 0.2 * this.a2.z)
        ).multiplyScalar(
            this.strand.system.sizeScaling
        );
    }
    getType() {
        return "RNA";
    }
}

class AminoAcidMonomer extends Monomer {
    getBackbonePos() {
        return this.position.clone().multiplyScalar(
            this.strand.system.sizeScaling
        );
    }

    getType() {
        return "AA";
    }
}

export {System, Strand, DNAMonomer, RNAMonomer, AminoAcidMonomer};