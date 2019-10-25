import {
    AmbientLight,
    Color,
    DirectionalLight,
    Mesh,
    Vector3,
    MeshLambertMaterial,
    SphereBufferGeometry
} from "../node_modules/three/build/three.module.js"
import {System, World} from "../node_modules/ecsy/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem} from "./threesystem.js"
import {VRInputSystem} from './vrinputsystem.js'

class SimpleSphere {
    constructor() {
        this.color = 'blue'
        this.position = new Vector3()
    }
}
class Grabable {

}

class SimpleSphereSystem extends System {
    execute() {
        this.queries.objs.added.forEach(ent => {
            const core = this.queries.three.results[0].getComponent(ThreeCore)
            const sphere = ent.getMutableComponent(SimpleSphere)
            sphere.obj = new Mesh(
                new SphereBufferGeometry(1.0),
                new MeshLambertMaterial({color:sphere.color})
            )
            sphere.obj.position.z = sphere.position.z
            console.log("adding sphere")
            core.getStage().add(sphere.obj)
        })
    }
}
SimpleSphereSystem.queries = {
    objs: {
        components:[SimpleSphere],
        listen:{
            added:true,
        }
    },
    three: {
        components: [ThreeCore],
    }
}


function setup() {
    let world = new World()
    world.registerSystem(ThreeSystem)
    world.registerSystem(VRInputSystem)
    world.registerSystem(SimpleSphereSystem)

    let app = world.createEntity()
    app.addComponent(ThreeCore)


    oneWorldTick(app,world)


    const core = app.getMutableComponent(ThreeCore)


    //setup some lights
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)


    const sphere = world.createEntity()
    sphere.addComponent(SimpleSphere, {color:'red', position:{z:-6}})
    sphere.addComponent(Grabable)
    startWorldLoop(app,world)
}

setup()
