import {
    MathUtils,
    Box3,
    Vector3,
    AmbientLight,
    Color,
    DirectionalLight,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    GridHelper,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class IfcScene {
    constructor(id) {
        const self = this
        this.canvasId = id
        this.threeCanvas = document.getElementById(id)
        this.calculateWidthHeight(this)
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(
            60,
            this.width / this.height,
            0.1,
            1000
        )
        this.renderer = new WebGLRenderer({
            antialias: true,
            canvas: this.threeCanvas,
        })
        this.renderer.setSize(this.width, this.height)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.ifcModels = []
        this.grid = new GridHelper()
        this.scene.background = new Color(0x6c757d)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.camera.position.z = 5
        this.setupLights()
        this.setupWindowResize()
        this.setupAnimation(self)
        this.setupCamera()
        this.scene.add(this.grid)
    }

    setupAnimation(self) {
        self.controls.update()
        self.renderer.render(self.scene, self.camera)
        requestAnimationFrame(function() {
            self.setupAnimation(self)
        })
    }

    calculateWidthHeight() {
        this.width = document.getElementById(this.canvasId).offsetWidth
        this.height = document.getElementById(this.canvasId).offsetHeight
    }

    setupLights() {
        const directionalLight1 = new DirectionalLight(0xffeeff, 0.8)
        directionalLight1.position.set(1, 1, 1)
        this.scene.add(directionalLight1)
        const directionalLight2 = new DirectionalLight(0xffffff, 0.8)
        directionalLight2.position.set(-1, 0.5, -1)
        this.scene.add(directionalLight2)
        const ambientLight = new AmbientLight(0xffffee, 0.25)
        this.scene.add(ambientLight)
    }

    setupWindowResize() {
        window.addEventListener('resize', () => {
            this.calculateWidthHeight()
            this.camera.aspect = this.width / this.height
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
        })
    }

    setupCamera() {
        this.camera.position.set(10, 10, 10)
        this.controls.target.set(0, 0, 0)
        this.controls.enableDamping = true
    }

    add(mesh) {
        let ifcModel = this.scene.add(mesh)
        this.ifcModels.push(ifcModel)
    }

    fitModelToFrame(model) {
        const { boxCenter, distance } = this.getBoxCenterAndDistance(model)
        const direction = new Vector3()
            .subVectors(this.camera.position, boxCenter)
            .multiply(new Vector3(1, 0, 1))
            .normalize()
        this.camera.position.copy(
            direction.multiplyScalar(distance).add(boxCenter)
        )
        this.camera.updateProjectionMatrix()
        this.controls.target.set(boxCenter.x, boxCenter.y, boxCenter.z)
    }

    getBoxCenterAndDistance(model) {
        const box = new Box3().setFromObject(model)
        const boxSize = box.getSize(new Vector3()).length()
        const boxCenter = box.getCenter(new Vector3())
        const halfSizeToFitOnScreen = boxSize * 0.5
        const halfFovY = MathUtils.degToRad(this.camera.fov * 0.5)
        const distance = halfSizeToFitOnScreen / Math.tan(halfFovY)
        return { boxCenter, distance }
    }
}