<template>
    <section>
        <input type="file" id="file-input" accept=".ifc, .ifcXML, .ifcZIP" />
        <p id="properties-text" v-if="entityData">
            GUID: 
            {{ entityData.GlobalId.value }} | Name: {{ entityData.Name.value }}
        </p>
        <canvas id="model"></canvas>
        <div class="checkboxes">
      <div>
        <input checked="true" id="IFCWALLSTANDARDCASE" type="checkbox" />
        Walls
      </div>
      <div>
        <input checked="true" id="IFCSLAB" type="checkbox" />
        Slabs
      </div>
      <div>
        <input checked="true" id="IFCWINDOW" type="checkbox" />
        Windows
      </div>
      <div>
        <input checked="true" id="IFCFURNISHINGELEMENT" type="checkbox" />
        Furniture
      </div>
      <div>
        <input checked="true" id="IFCDOOR" type="checkbox" />
        Doors
      </div>
      <div>
        <input checked="true" id="IFCMEMBER" type="checkbox" />
        Curtain wall structure
      </div>
      <div>
        <input checked="true" id="IFCPLATE" type="checkbox" />
        Curtain wall plates
      </div>
    </div>
    </section>
</template>

<script>
import IfcManager from '../IFC/IfcManager'
import { Raycaster, Vector2, MeshLambertMaterial } from 'three'
import { IFCWALLSTANDARDCASE, IFCSLAB, IFCDOOR, IFCWINDOW, IFCFURNISHINGELEMENT, IFCMEMBER, IFCPLATE } from "web-ifc";
export default {
    name: 'Model',
    props: ['token', 'projectId', 'discipline'],
    data() {
        return {
            entityData: null,
            categories: {
                IFCWALLSTANDARDCASE,
                IFCSLAB,
                IFCFURNISHINGELEMENT,
                IFCDOOR,
                IFCWINDOW,
                IFCPLATE,
                IFCMEMBER,
            },
            preselectMat: new MeshLambertMaterial({
                transparent: true,
                opacity: 0.6,
                color: 0xff88ff,
                depthTest: false,
            }),
            selectMat: new MeshLambertMaterial({
                transparent: true,
                opacity: 0.6,
                color: 0xff00ff,
                depthTest: false,
            }),
            preselectModel: { id: -1 },
            selectModel: { id: -1 },
            subsets: {},
        }
    },
    methods: {
        getName: function(category) {
            const names = Object.keys(this.categories);
            return names.find((name) => this.categories[name] === category);
        },
        onLoaded: async function() {
            //console.log('onLoaded')
            this.addPicking()
            this.setupPick(this)
            //await this.setupAllCategories(); // TODO: Hiding don't work!
        },
        addPicking: function() {
            //console.log('addPicking')
            this.raycaster = new Raycaster()
            this.raycaster.firstHitOnly = true
            this.mouse = new Vector2()
        },
        cast: function(event) {
            this.bounds = this.threeCanvas.getBoundingClientRect()
            this.x1 = event.clientX - this.bounds.left
            this.x2 = this.bounds.right - this.bounds.left
            this.mouse.x = (this.x1 / this.x2) * 2 - 1
            this.y1 = event.clientY - this.bounds.top
            this.y2 = this.bounds.bottom - this.bounds.top
            this.mouse.y = -(this.y1 / this.y2) * 2 + 1
            this.raycaster.setFromCamera(
                this.mouse,
                this.IFCManager.scene.camera
            )
            return this.raycaster.intersectObjects(this.IFCManager.scene.ifcModels)
        },
        // Gets the IDs of all the items of a specific category
        getAll: async function(category) {
                return this.IFCManager.scene.ifcModel.getAllItemsOfType(0, category, false);
        },
        // Creates a new subset containing all elements of a category
        newSubsetOfType: async function(category) {
            const ids = await this.getAll(category);
            return this.IFCManager.scene.ifcModel.createSubset({
                modelID: 0,
                scene:this.IFCManager.scene,
                ids,
                removePrevious: true,
                customID: category.toString(),
            });
        },
        setupAllCategories: async function() {
        const allCategories = Object.values(this.categories);
        for (let i = 0; i < allCategories.length; i++) {
            const category = allCategories[i];
            await this.setupCategory(category);
        }
        },
        // Creates a new subset and configures the checkbox
        setupCategory: async function(category) {
        this.subsets[category] = await this.newSubsetOfType(category);
        this.setupCheckBox(category);
        },
        // Sets up the checkbox event to hide / show elements
        setupCheckBox: function(category) {
        const name = this.getName(category);
        const checkBox = document.getElementById(name);
        checkBox.addEventListener("change", (event) => {
            const checked = event.target.checked;
            const subset = this.subsets[category];
            if (checked) {
                console.log(subset)
                this.IFCManager.scene.add(subset);
            }
            else {
                console.log(subset)
                subset.removeFromParent();
            }
        });
        },
        highlight: function(event, material, model) {
            const found = this.cast(event)[0]
            if (found) {
                // Gets model ID
                model.id = found.object.modelID;

                // Gets Express ID
                const index = found.faceIndex;
                const geometry = found.object.geometry;
                const id = this.IFCManager.scene.ifcModel.getExpressId(geometry, index);

                // Creates subset
                this.IFCManager.scene.ifcModel.createSubset({
                modelID: model.id,
                ids: [id],
                material: material,
                scene: this.IFCManager.scene,
                removePrevious: true,
                });
            } else {
                // Removes previous highlight
                this.IFCManager.scene.ifcModel.removeSubset(model.id, material);
            }
        },
        pick: async function(event) {
            const found = this.cast(event)[0]
            if (found) {
                const index = found.faceIndex
                const geometry = found.object.geometry
                
                try {
                    const id = this.IFCManager.scene.ifcModel.getExpressId(geometry, index)
                    //const modelID = found.object.modelID;
                    const itemProps = await this.IFCManager.scene.ifcModel.getItemProperties(id)
                    //console.log(this.modelID, this.id)
                    console.log(itemProps)
                    this.entityData = itemProps
                } catch (error) {
                    console.log('no se encontro el objeto')
                    this.entityData = null
                }      
                
            }
        },
        setupPick: function(component) {
            component.threeCanvas = document.getElementById('model')
            component.threeCanvas.ondblclick = component.pick
        },
    },
    mounted() {
        const self = this
        this.IFCManager = new IfcManager('model')
        let input = document.getElementById('file-input')
        input.addEventListener(
            'change',
             async function(changed) {
                let file = changed.target.files[0]
                let ifcURL = URL.createObjectURL(file)
                self.IFCManager.scene.ifcModel = await self.IFCManager.ifcLoader.loadAsync(ifcURL);
                self.IFCManager.scene.add(self.IFCManager.scene.ifcModel.mesh)
                
                self.onLoaded()
            },
            false
        );
        window.onmousemove = (event) => {
            try {
                this.highlight(event, this.preselectMat, this.preselectModel)
            } catch (error) {
                //console.log(error)
            }
        };
        window.ondblclick = (event) => {
            try {
                this.highlight(event, this.selectMat, this.selectModel)
            } catch (error) {
                console.log('dblclick en grilla')
            }
        };
    },
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body {
  overflow: hidden;
}
#model {
    position: absolute;
    left: 0%;
    top: 0%;
    width: 100% !important;
    height: 100% !important;
}
#file-input {
  z-index: 1;
  position: absolute;
}

.checkboxes {
  position: absolute;
  left: 1rem;
  top: 3rem;
}
#properties-text {
    position: absolute;
    left: 0%;
    bottom: 0%;
    z-index: 100;
}
</style>