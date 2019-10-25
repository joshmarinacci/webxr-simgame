import {System} from "../node_modules/ecsy/build/ecsy.module.js"
import {
    BoxGeometry,
    CanvasTexture,
    ConeGeometry,
    CylinderBufferGeometry,
    CylinderGeometry,
    Geometry,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PlaneGeometry,
    VertexColors
} from "../node_modules/three/build/three.module.js"
import {pointy_hex_to_pixel, toRad} from './hex.js'
import {terrainToColor, terrainToHeight} from './globals.js'
import {COLORS} from "./gfx.js"
import {CityTile, FarmTile, ForestTile, GameState, HexMapComp} from './logic2.js'
import {ThreeCore} from './threesystem.js'
import {Level} from './levelssystem.js'

export class Highlighted {

}


export class HexMapView {
    constructor() {
        this.started = false
        this.size = 2
        this.map = null
    }
}

export class Button3D {
    constructor() {
        this.text = "foo"
        this.obj = null
        this.onClick = null
        this.selected = false
        this.hovered = false
    }
}

export class ScoreBoard {
    constructor() {
        this.bank = -1
        this.wood = -1
    }
}

export function makeTree(ent, size) {
    const tile = ent.getComponent(HexTileGroup)
    const forest = ent.getComponent(ForestTile)
    const center = pointy_hex_to_pixel(tile.hex,size)
    const h = terrainToHeight(tile.data.terrain)

    const geo = new Geometry()
    if(forest.treeLevel >= 3) {
        const level1 = new ConeGeometry(1.5, 2, 8)
        level1.faces.forEach(f => f.color.set(COLORS.GREEN))
        level1.translate(0, 4, 0)
        geo.merge(level1)
    }
    if(forest.treeLevel >= 2) {
        const level2 = new ConeGeometry(2,2,8)
        level2.faces.forEach(f => f.color.set(COLORS.GREEN))
        level2.translate(0,3,0)
        geo.merge(level2)
    }
    if(forest.treeLevel >= 1) {
        const level3 = new ConeGeometry(3, 2, 8)
        level3.faces.forEach(f => f.color.set(COLORS.GREEN))
        level3.translate(0, 2, 0)
        geo.merge(level3)
    }

    const trunk = new CylinderGeometry(0.5,0.5,2)
    trunk.faces.forEach(f => f.color.set(COLORS.BROWN))
    trunk.translate(0,0,0)
    geo.merge(trunk)

    const material = new MeshLambertMaterial({vertexColors: VertexColors})
    const obj = new Mesh(geo,material)
    obj.userData.level = forest.treeLevel
    obj.position.y = h/2 + 1
    return obj
}

export function makeFarm(ent) {
    const tile = ent.getComponent(HexTileGroup)
    const farm = ent.getComponent(FarmTile)
    const h = terrainToHeight(tile.data.terrain)
    const geo = new Geometry()
    for(let i=0; i<4; i++) {
        const c1 = new CylinderGeometry(0.25, 0.25, 2.0)
        c1.faces.forEach(f => f.color.set(COLORS.DARK_BROWN))
        c1.rotateZ(toRad(90))
        c1.translate(0,0,i*0.5)
        geo.merge(c1)
    }

    const material = new MeshLambertMaterial({vertexColors: VertexColors})
    const obj = new Mesh(geo,material)
    obj.userData.level = farm.treeLevel
    obj.position.y = h/2
    obj.position.z = -1.0
    return obj
}
export function makeHouse(data) {
    const geo = new Geometry()
    const sides = new BoxGeometry(1,1,1)
    sides.faces.forEach(f => f.color.set(COLORS.RED))
    sides.translate(0,0.5,0)
    sides.rotateY(toRad(45))
    geo.merge(sides)

    const top = new ConeGeometry(1.2,1.0,8)
    top.faces.forEach(f => f.color.set(COLORS.DARK_BROWN))
    top.translate(0,1.5,0,)
    geo.merge(top)

    const material = new MeshLambertMaterial({vertexColors: VertexColors})
    const obj = new Mesh(geo,material)
    obj.position.y = 0
    return obj
}

class HexTileGroup {
    constructor() {
        this.threeNode = null
        this.hex = null
    }
}


export class Hex3dsystem extends System {
    execute(delta,time) {
        this.queries.maps.results.forEach(ent => {
            const mapView = ent.getMutableComponent(HexMapView)
            const mapComp = ent.getMutableComponent(HexMapComp)
            if(!mapComp.map) return
            if(!mapView.started) this.initMapView(mapView, mapComp)
        })
        this.queries.highlighted.added.forEach(ent => {
            ent.getMutableComponent(HexTileGroup).threeNode.material.color.set('red')
        })
        this.queries.highlighted.removed.forEach(ent => {
            const node = ent.getMutableComponent(HexTileGroup).threeNode
            node.material.color.set(node.userData.regularColor)
        })
        this.queries.forest.added.forEach(ent => {
            const tile = ent.getMutableComponent(HexTileGroup)
            const forest = ent.getComponent(ForestTile)
            tile.treeNode =  makeTree(ent,2)
            tile.treeNodeLevel = forest.treeLevel
            tile.threeNode.add(tile.treeNode)
        })
        this.queries.forest.results.forEach(ent => {
            const tile = ent.getComponent(HexTileGroup)
            const forest = ent.getComponent(ForestTile)
            if(tile.treeNodeLevel !== forest.treeLevel) {
                tile.threeNode.remove(tile.treeNode)
                tile.treeNode = makeTree(ent,2)
                tile.treeNodeLevel = forest.treeLevel
                tile.threeNode.add(tile.treeNode)
            }
        })
        this.queries.forest.removed.forEach(ent => {
            const tile = ent.getMutableComponent(HexTileGroup)
            tile.threeNode.remove(tile.treeNode)
        })
        this.queries.farm.added.forEach(ent => {
            const tile = ent.getMutableComponent(HexTileGroup)
            const farm = ent.getComponent(FarmTile)
            tile.farmNode =  makeFarm(ent)
            tile.threeNode.add(tile.farmNode)
        })
        this.queries.city.added.forEach(ent => {
            const tile = ent.getMutableComponent(HexTileGroup)
            const city = ent.getComponent(CityTile)
            tile.cityNode =  makeHouse(ent)
            tile.threeNode.add(tile.cityNode)
        })
        this.queries.buttons.added.forEach(ent => {
            const button = ent.getMutableComponent(Button3D)
            button.canvas = document.createElement('canvas')
            button.width = 128
            button.height = 64
            button.canvas.width = button.width
            button.canvas.height = button.height
            button.context = button.canvas.getContext('2d')
            button.lastDraw = 0
            button.ctex = new CanvasTexture(button.canvas)
            button.obj = new Mesh(
                new PlaneGeometry(1.0,0.5),
                new MeshBasicMaterial({map:button.ctex})
            )
            button.obj.position.z = -3
            button.obj.position.y = 1.0
            button.obj.position.x = 0
            button.obj.userData.type = 'Button3D'
            button.obj.userData.ent = ent
            button.obj.userData.selected = button.selected
            button.obj.userData.hovered = button.hovered

            this.drawButton(button)

            const core = this.queries.three.results[0].getComponent(ThreeCore)
            core.scene.add(button.obj)
        })
        this.queries.buttons.results.forEach(ent => {
            const button = ent.getComponent(Button3D)
            if(button.selected !== button.obj.userData.selected) {
                this.drawButton(button,ent.hasComponent(Highlighted),button.selected)
                button.obj.userData.selected = button.selected
            }
        })
        this.queries.highlighted_buttons.added.forEach(ent => {
            this.drawButton(ent.getComponent(Button3D),true,false)
        })
        this.queries.highlighted_buttons.removed.forEach(ent => {
            this.drawButton(ent.getComponent(Button3D),false,false)
        })

        this.queries.scoreboards.added.forEach(ent => {
            const sb = ent.getMutableComponent(ScoreBoard)
            sb.canvas = document.createElement('canvas')
            sb.width = 128*2
            sb.height = 64*2
            sb.canvas.width = sb.width
            sb.canvas.height = sb.height
            sb.context = sb.canvas.getContext('2d')
            sb.lastDraw = 0
            sb.ctex = new CanvasTexture(sb.canvas)
            sb.obj = new Mesh(
                new PlaneGeometry(1.0,0.5),
                new MeshBasicMaterial({map:sb.ctex})
            )
            sb.obj.position.z = -2
            sb.obj.position.y = 1.0
            sb.obj.position.x = 1
            sb.obj.userData.type = 'Button3D'
            sb.obj.userData.ent = ent
            sb.obj.userData.selected = sb.selected
            sb.obj.userData.hovered = sb.hovered

            this.drawScoreboard(sb,ent.getComponent(GameState))
            const core = this.queries.three.results[0].getComponent(ThreeCore)
            core.scene.add(sb.obj)
        })

        this.queries.scoreboards.results.forEach(ent => {
            const sb = ent.getMutableComponent(ScoreBoard)
            const state = ent.getComponent(GameState)
            if(sb.bank !== state.bank || sb.wood !== state.wood) {
                this.drawScoreboard(sb,state)
                sb.bank = state.bank
                sb.wood = state.wood
            }
        })

        this.queries.levels.removed.forEach(ent => this.removeLevel(ent))
        this.queries.levels.added.forEach(ent => this.setupLevel(ent))
    }

    initMapView(view, mapComp) {
        view.started = true
        view.threeNode = new Group()
        mapComp.map.forEachPair((hex,data)=>{
            const center = pointy_hex_to_pixel(hex,view.size)
            const h = terrainToHeight(data.terrain)
            const hexView = new Mesh(
                new CylinderBufferGeometry(view.size,view.size,h,6),
                new MeshLambertMaterial({color:terrainToColor(data.terrain)})
            )
            view.threeNode.add(hexView)
            hexView.position.x = center.x*1.05
            hexView.position.z = center.y*1.05
            hexView.position.y = h/2
            hexView.userData.hex = hex
            hexView.userData.data = data
            hexView.userData.regularColor = terrainToColor(data.terrain)
            hexView.userData.ent = data.ent
            data.ent.addComponent(HexTileGroup, {threeNode:hexView, hex:hex,data:data})
        })
        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        core.stage.add(view.threeNode)
    }


    drawButton(button,hovered,selected) {
        const c = button.context
        c.fillStyle = 'white'
        c.fillRect(0,0,button.canvas.width,button.canvas.height)
        if(hovered) {
            c.strokeStyle = 'black'
            c.lineWidth = 5
            c.strokeRect(5,5,button.canvas.width-10,button.canvas.height-10)
        }

        if(selected) {
            c.fillStyle = 'red'
            c.fillRect(10,10,button.canvas.width-20,button.canvas.height-20)
        }

        c.fillStyle = 'black'
        c.font = '30pt sans-serif'
        c.fillText(button.text,10,30+10)
        button.ctex.needsUpdate = true
    }

    setupLevel(ent) {
        const mapView = ent.getMutableComponent(HexMapView)
        const mapComp = ent.getMutableComponent(HexMapComp)
        if(!mapComp.map) return
        console.log("initing =========")
        this.initMapView(mapView, mapComp)
    }

    removeLevel(ent) {
        const view = ent.getMutableComponent(HexMapView)
        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        core.stage.remove(view.threeNode)
    }

    drawScoreboard(sb, state) {
        const c = sb.context
        c.fillStyle = 'white'
        c.fillRect(0,0,sb.canvas.width,sb.canvas.height)

        c.fillStyle = 'black'
        c.font = '30pt sans-serif'
        const lineHeight = 40
        c.fillText(`bank ${state.bank}`,10,lineHeight*1)
        c.fillText(`wood ${state.wood}`,10,lineHeight*2)
        sb.ctex.needsUpdate = true
    }
}

Hex3dsystem.queries = {
    three: {
        components: [ThreeCore]
    },
    maps: {
        components:[HexMapView, HexMapComp],
        listen: {
            added:true,
            removed:false
        }
    },
    levels: {
        components:[GameState,Level,HexMapView,HexMapComp],
        listen: {
            added:true,
            removed:true,
        }
    },
    highlighted: {
        components: [Highlighted, HexTileGroup],
        listen: {
            added:true,
            removed:true,
        }
    },
    forest: {
        components: [ForestTile, HexTileGroup],
        listen: {
            added:true,
            removed:true,
        }
    },
    farm: {
        components: [FarmTile, HexTileGroup],
        listen: {
            added:true,
            removed:true,
        }
    },
    city: {
        components: [CityTile, HexTileGroup],
        listen: {
            added:true,
            removed:true,
        }
    },
    buttons: {
        components:[Button3D],
        listen: {
            added:true,
            removed:false,
        }
    },
    highlighted_buttons: {
        components:[Button3D,Highlighted],
        listen: {
            added:true,
            removed:true
        }
    },
    scoreboards: {
        components:[ScoreBoard,GameState],
        listen: {
            added:true,
            removed:true
        }
    }
}

