import {System} from "../node_modules/ecsy/build/ecsy.module.js"
import {VRController} from './vrinputsystem.js'
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
import {ThreeCore, ThreeNode} from './threesystem.js'

export class Hand {
    constructor() {
        this.obj = null
        this.grabbed = null
        this.color = 'yellow'
        this.grabDistance = 1
    }
}

export class Grabbed {

}
export class Grabable {
    constructor() {
        this.onGrab = null
    }
}

export class SimpleSphere {
    constructor() {
        this.obj = null
        this.color = 'blue'
        this.position = new Vector3()
        this.radius = 0.5
    }
}

export class GrabbingSystem extends System {
    execute() {
        this.queries.hands.added.forEach(ent => {
            const hand = ent.getMutableComponent(Hand)
            hand.obj = new Mesh(
                new BoxBufferGeometry(0.1,0.1,0.4).translate(0,0,-0.10),
                new MeshLambertMaterial({color:hand.color})
            )
            ent.getMutableComponent(VRController).controller.add(hand.obj)
        })

        this.queries.spheres.added.forEach(ent => {
            const node = ent.getComponent(ThreeNode)
            const sphere = ent.getMutableComponent(SimpleSphere)
            sphere.obj = new Mesh(
                new SphereBufferGeometry(sphere.radius),
                new MeshLambertMaterial({color:node.color})
            )
            node.object.add(sphere.obj)
            // if(sphere.position && sphere.position.x) sphere.obj.position.x = sphere.position.x
            // if(sphere.position && sphere.position.y) sphere.obj.position.y = sphere.position.y
            // if(sphere.position && sphere.position.z) sphere.obj.position.z = sphere.position.z
            // if(ent.hasComponent(VRController)) {
            //     console.log('adding a sphere')
            //     ent.getComponent(VRController).controller.add(sphere.obj)
            // } else {
                // core.getStage().add(sphere.obj)
                // console.log('adding a sphere')
                // core.scene.add(sphere.obj)
                // core.getCamera().add(sphere.obj)
            // }
        })

        //code to detect grabs for each controller
        this.queries.hands.results.forEach(handEnt => {
            const hand = handEnt.getComponent(Hand)
            const ca = new Vector3()
            hand.obj.localToWorld(ca)
            this.queries.objs.results.forEach(grabbableEnt => {
                const sphere = grabbableEnt.getComponent(ThreeNode)
                if(!sphere.object) return
                const cb = new Vector3()
                sphere.object.localToWorld(cb)
                const dist = ca.distanceTo(cb)
                if(dist === 0) return // works around a bug
                if(dist <= hand.grabDistance) {
                    if(hand.grabbed !== grabbableEnt ) {
                        hand.grabbed = grabbableEnt
                        // console.log("grabbing")
                        // let color = sphere.color
                        // setTimeout(()=>{
                        //     if(handEnt.hasComponent(SimpleSphere)) {
                        //         console.log("triggering remove")
                        //         handEnt.removeComponent(SimpleSphere)
                        //     }
                        //     setTimeout(()=>{
                        //         console.log('triggering an add')
                                // handEnt.addComponent(SimpleSphere,{color:color, radius:0.10, position:{z:-0.5}})
                                const grabber = grabbableEnt.getComponent(Grabable)
                                if(grabber.onGrab) grabber.onGrab(handEnt)
                            // },0)
                        // },0)
                    }
                }
            })
        })

    }
}
GrabbingSystem.queries = {
    three: {
        components: [ThreeCore],
    },
    spheres: {
        components:[ThreeNode,SimpleSphere],
        listen:{
            added:true,
            removed:true,
        }
    },
    objs: {
        components:[ThreeNode,Grabable],
        listen:{
            added:true,
            removed:true,
        }
    },
    hands: {
        components:[Hand, VRController],
        listen: {
            added:true
        }
    },
}
