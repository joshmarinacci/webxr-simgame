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



export class SVGExtrudedObj {
    constructor() {
        this.src = null
        this.scale = 1.0
        this.ccw = false
    }
}

export class SVGSystem extends System {
    execute() {
        this.queries.objs.results.forEach(ent => {
            const node = ent.getComponent(ThreeNode)
            node.object.rotation.y+=0.01
        })
        this.queries.objs.added.forEach(ent => {
            const svg = ent.getComponent(SVGExtrudedObj)
            const node = ent.getMutableComponent(ThreeNode)
            const loader = new SVGLoader()
            loader.load(svg.src,(data)=>{
                const group = new Group()
                data.paths.forEach(path => {
                    const shapes = path.toShapes(svg.ccw)
                    const mat = new MeshLambertMaterial({color:node.color})
                    console.log("using the color",node.color)
                    shapes.forEach(sh => {
                        const geo = new ExtrudeBufferGeometry(sh,{
                            steps:2,
                            depth:16,
                            bevelEnabled: true,
                        })
                        const s = svg.scale
                        geo.scale(s,s,s)
                        const mesh = new Mesh(geo,mat)
                        group.add(mesh)
                    })
                })
                node.object.add(group)
                node.object.rotation.y = 0
            })
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
    }
}
