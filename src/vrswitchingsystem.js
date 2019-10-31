import {System} from "../node_modules/ecsy/build/ecsy.module.js"
import {InsideVR, ThreeCore, ThreeNode} from './threesystem.js'
import {Button3D} from './hex3dsystem.js'

export class DesktopOnly {}
export class VROnly {}
export class VRSwitchingSystem extends System {
    execute() {
        //make sure VR objects are disabled
        this.queries.vronly.added.forEach(ent => {
            if(ent.hasComponent(ThreeNode)) ent.getComponent(ThreeNode).object.visible = false
        })

        //when entering VR
        this.queries.vr.added.forEach(()=>{
            this.queries.three.results.forEach(ent => {
                ent.getComponent(ThreeCore).stagePos.position.y = 0
            })

            this.queries.desktoponly.results.forEach(ent => {
                if(ent.hasComponent(Button3D)) ent.getComponent(Button3D).obj.visible = false
            })
            this.queries.vronly.results.forEach(ent => {
                if(ent.hasComponent(ThreeNode)) ent.getComponent(ThreeNode).object.visible = true
            })
        })

        //when exiting VR
        this.queries.vr.removed.forEach(()=>{
            this.queries.three.results.forEach(ent => {
                ent.getComponent(ThreeCore).stagePos.position.y = -1.5
            })
            this.queries.desktoponly.results.forEach(ent => {
                if(ent.hasComponent(Button3D)) ent.getComponent(Button3D).obj.visible = true
            })
            this.queries.vronly.results.forEach(ent => {
                if(ent.hasComponent(ThreeNode)) ent.getComponent(ThreeNode).object.visible = false
            })
        })
    }
}
VRSwitchingSystem.queries = {
    three: {
        components:[ThreeCore]
    },
    vr: {
        components:[InsideVR],
        listen: {
            added:true,
            removed:true
        }
    },
    desktoponly: {
        components:[DesktopOnly],
        listen: {
            added:true,
            removed:true
        }
    },
    vronly: {
        components:[VROnly],
        listen: {
            added:true,
            removed:true
        }
    },

}

