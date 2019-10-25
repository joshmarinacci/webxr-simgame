import {
    BoxBufferGeometry,
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
import {VRController, VRInputSystem} from './vrinputsystem.js'

class SimpleSphere {
    constructor() {
        this.obj = null
        this.color = 'blue'
        this.position = new Vector3()
    }
}
class Hand {
    constructor() {
        this.obj = null
        this.grabbed = null
        this.color = 'yellow'
        this.canGrab = true
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
            if(sphere.position && sphere.position.x) sphere.obj.position.x = sphere.position.x
            if(sphere.position && sphere.position.z) sphere.obj.position.z = sphere.position.z
            if(ent.hasComponent(VRController)) {
                console.log('adding a sphere')
                ent.getComponent(VRController).controller.add(sphere.obj)
            } else {
                core.getStage().add(sphere.obj)
            }
        })
        this.queries.objs.removed.forEach(ent => {
            console.log("removing a sphere")
            const sphere = ent.getRemovedComponent(SimpleSphere)
            if(sphere) sphere.obj.parent.remove(sphere.obj)
        })

        this.queries.hands.added.forEach(ent => {
            const hand = ent.getMutableComponent(Hand)
            hand.obj = new Mesh(
                new BoxBufferGeometry(0.5,0.5,2.5).translate(0,0,1),
                new MeshLambertMaterial({color:hand.color})
            )
            const con = ent.getMutableComponent(VRController)
            con.controller.add(hand.obj)
        })

        this.queries.hands.results.forEach(handEnt => {
            const hand = handEnt.getComponent(Hand)
            const ca = new Vector3()
            hand.obj.localToWorld(ca)
            this.queries.grabable.results.forEach(grabbableEnt => {
                const sphere = grabbableEnt.getComponent(SimpleSphere)
                if(!sphere.obj) return
                const cb = new Vector3()
                sphere.obj.localToWorld(cb)
                const dist = ca.distanceTo(cb)
                if(dist === 0) return // works around a bug
                if(dist <= 2) {
                    if(hand.grabbed !== grabbableEnt ) {
                        console.log("grab it",grabbableEnt)
                        hand.grabbed = grabbableEnt
                        let color = sphere.color
                        setTimeout(()=>{
                            if(handEnt.hasComponent(SimpleSphere)) {
                                // console.log("triggering remove")
                                handEnt.removeComponent(SimpleSphere)
                            }
                            setTimeout(()=>{
                                // console.log('triggering an add')
                                handEnt.addComponent(SimpleSphere,{color:color})
                            },0)
                        },0)
                    }
                }
            })
        })
    }
}
SimpleSphereSystem.queries = {
    objs: {
        components:[SimpleSphere],
        listen:{
            added:true,
            removed:true,
        }
    },
    grabable: {
        components:[SimpleSphere,Grabable]
    },
    hands: {
        components:[Hand, VRController],
        listen: {
            added:true
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

    world.createEntity()
        .addComponent(VRController,{vrid:0})
        .addComponent(Hand)
    world.createEntity()
        .addComponent(VRController,{vrid:1})
        .addComponent(Hand)


    //setup some lights
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)


    const sphere = world.createEntity()
    sphere.addComponent(SimpleSphere, {color:'red', position:{z:-5, x:2}})
    sphere.addComponent(Grabable)

    const sphere2 = world.createEntity()
    sphere2.addComponent(SimpleSphere, {color:'blue', position:{z:-5, x:-2}})
    sphere2.addComponent(Grabable)
    startWorldLoop(app,world)
}

setup()
