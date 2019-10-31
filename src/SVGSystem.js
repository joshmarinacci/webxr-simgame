import {System} from "../node_modules/ecsy/build/ecsy.module.js"
import {ThreeNode} from './threesystem.js'
import {SVGLoader} from '../node_modules/three/examples/jsm/loaders/SVGLoader.js'
import {
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    ShapeBufferGeometry,
    SphereBufferGeometry,
    ExtrudeBufferGeometry,
} from "../node_modules/three/build/three.module.js"
import {VRController} from './vrinputsystem.js'



export class SVGExtrudedObj {
    constructor() {
        this.src = null
        this.scale = 1.0
        this.ccw = false
        this.rotation = null
        this.translate = null
    }
}

export class SVGSystem extends System {
    execute() {
        this.queries.objs.added.forEach(ent => {
            const svg = ent.getComponent(SVGExtrudedObj)
            const node = ent.getMutableComponent(ThreeNode)
            this.loadSVG(svg,node.object, node.color)
        })
        this.queries.controllerobjs.added.forEach(ent => {
            const svg = ent.getComponent(SVGExtrudedObj)
            const node = ent.getMutableComponent(VRController)
            this.loadSVG(svg,node.controller, 'green')
        })
    }

    loadSVG(svg, object, color) {
        const loader = new SVGLoader()
        loader.load(svg.src,(data)=>{
            const group = new Group()
            data.paths.forEach(path => {
                const shapes = path.toShapes(svg.ccw)
                const mat = new MeshLambertMaterial({color:color})
                shapes.forEach(sh => {
                    const geo = new ExtrudeBufferGeometry(sh,{
                        steps:2,
                        depth:16,
                        bevelEnabled: true,
                    })
                    const s = svg.scale
                    geo.scale(s,s,s)
                    if(svg.rotation && svg.rotation.x) geo.rotateX(svg.rotation.x)
                    if(svg.rotation && svg.rotation.y) geo.rotateY(svg.rotation.y)
                    if(svg.rotation && svg.rotation.z) geo.rotateZ(svg.rotation.z)
                    if(svg.translate) {
                        if(svg.translate.x) geo.translate(svg.translate.x,0,0)
                        if(svg.translate.y) geo.translate(0,svg.translate.y,0)
                        if(svg.translate.z) geo.translate(0,0,svg.translate.z)
                    }
                    const mesh = new Mesh(geo,mat)
                    group.add(mesh)
                })
            })
            object.add(group)
        })

    }
}

SVGSystem.queries = {
    objs: {
        components:[SVGExtrudedObj, ThreeNode],
        listen: {
            added:true,
            removed:true
        }
    },
    controllerobjs: {
        components:[SVGExtrudedObj, VRController],
        listen: {
            added:true,
            removed:true
        }
    }
}
