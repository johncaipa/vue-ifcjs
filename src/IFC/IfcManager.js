import { IfcScene } from '../IFC/IfcScene.js';
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { Raycaster, Vector2 } from "three";

export default class IfcManager {
    constructor(canvasId) {
        let self = this;
        self.scene = new IfcScene(canvasId);
        self.ifcModels = [];
        self.ifcLoader = new IFCLoader();
        self.setupIfcLoader();
        self.raycaster = new Raycaster();
        self.raycaster.firstHitOnly = true;
        self.mouse = new Vector2();
    }

    setupThreeMeshBVH() {
        let self = this;
        self.ifcLoader.ifcManager.setupThreeMeshBVH(
            computeBoundsTree,
            disposeBoundsTree,
            acceleratedRaycast
        );
    }

    async setupIfcLoader() {
        let self = this;
        await self.ifcLoader.ifcManager.useWebWorkers(true, "../IFCjs/IFCWorker.js")
        self.ifcLoader.ifcManager.applyWebIfcConfig({
            COORDINATE_TO_ORIGIN: true,
            USE_FAST_BOOLS: false
        });
        self.setupThreeMeshBVH();
    }

    releaseMemory() {
        let self = this;
        self.ifcLoader.ifcManager.disposeMemory();
    }

}