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

export class Hand {
    constructor() {
        this.obj = null
        this.grabbed = null
        this.color = 'yellow'
        this.canGrab = true
    }
}
export class Grabable {
}


export class GrabbingSystem extends System {
    execute() {
        this.queries.hands.added.forEach(ent => {
            const hand = ent.getMutableComponent(Hand)
            hand.obj = new Mesh(
                new BoxBufferGeometry(0.5,0.5,2.5).translate(0,0,1),
                new MeshLambertMaterial({color:hand.color})
            )
            ent.getMutableComponent(VRController).controller.add(hand.obj)
        })
    }
}
GrabbingSystem.queries = {
    grabable: {
        components:[Grabable]
    },
    hands: {
        components:[Hand, VRController],
        listen: {
            added:true
        }
    },
}
