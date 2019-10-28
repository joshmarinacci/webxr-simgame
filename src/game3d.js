import {AmbientLight, Clock, Color, DirectionalLight} from "../node_modules/three/build/three.module.js"
import {World, System} from "../node_modules/ecsy/build/ecsy.module.js"
import {InsideVR, oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem} from "./threesystem.js"
import {Button3D, Hex3dsystem, HexMapView, ScoreBoard} from './hex3dsystem.js'
import {MouseInputDevice, MouseInputSystem} from './mousesystem.js'
import {KeyboardInputSystem} from "./keyboardsystem.js"
import {VRController, VRInputSystem} from './vrinputsystem.js'
import {GameState, GameStateEnums, HexMapComp, InputModes, LogicSystem} from "./logic2.js"
import {Level, LevelsSystem} from './levelssystem.js'
import {VRStats, VRStatsSystem} from './vrstats.js'
import {setupLevels} from './levels.js'
import {Instructions3D, Instructions3DSystem} from './Instructions3D.js'
import {Grabable, GrabbingSystem, Hand, SimpleSphere} from './grabbingsystem.js'


let game


function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)
}

class DesktopOnly {}
class VROnly {}
class VRSwitchingSystem extends System {
    execute() {
        this.queries.vr.added.forEach(()=>{
            console.log("added")
            this.queries.desktoponly.results.forEach(ent => {
                if(ent.hasComponent(Button3D)) ent.getComponent(Button3D).obj.visible = false
            })
            this.queries.vronly.results.forEach(ent => {
                console.log("Have to show it")
            })
        })
        this.queries.vr.removed.forEach(()=>{
            this.queries.desktoponly.results.forEach(ent => {
                if(ent.hasComponent(Button3D)) ent.getComponent(Button3D).obj.visible = true
            })
            this.queries.vronly.results.forEach(ent => {
                console.log("Have to hide it")
            })
        })
    }
}
VRSwitchingSystem.queries = {
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

function setupGame() {
    let world = new World();
    world.registerSystem(ThreeSystem)
    world.registerSystem(LogicSystem)
    world.registerSystem(Hex3dsystem)
    world.registerSystem(MouseInputSystem)
    world.registerSystem(KeyboardInputSystem)
    world.registerSystem(VRInputSystem)
    world.registerSystem(GrabbingSystem)
    world.registerSystem(LevelsSystem)
    world.registerSystem(VRStatsSystem)
    world.registerSystem(Instructions3DSystem)
    world.registerSystem(VRSwitchingSystem)

    game = world.createEntity()
    game.addComponent(ThreeCore)
    game.addComponent(GameState,{bank:10})
    setupLevels(game,world)

    game.addComponent(HexMapComp, {})
    game.addComponent(HexMapView)
    const state = game.getMutableComponent(GameState)
    game.addComponent(Level,state.levels[state.levelIndex])

    //manually do one tick
    oneWorldTick(game,world)

    const core = game.getMutableComponent(ThreeCore)

    world.createEntity()
        .addComponent(VRController,{vrid:0})
        .addComponent(Hand,{grabDistance:0.25})
    world.createEntity()
        .addComponent(VRController,{vrid:1})
        .addComponent(Hand,{grabDistance:0.25})

    game.addComponent(VRStats)
    game.addComponent(Instructions3D)
    game.addComponent(MouseInputDevice)
    game.addComponent(ScoreBoard)
    game.getMutableComponent(GameState).toMode(GameStateEnums.SHOW_INSTRUCTIONS)

    let buttons = []
    const farmButton = world.createEntity().addComponent(Button3D,{text:'farm',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            farmButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(MouseInputDevice).inputMode = InputModes.PLANT_FARM
        }
    })
    buttons.push(farmButton)
    farmButton.addComponent(DesktopOnly)
    const treeButton = world.createEntity().addComponent(Button3D,{text:'tree',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            treeButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(MouseInputDevice).inputMode = InputModes.PLANT_FOREST
        }
    })
    buttons.push(treeButton)
    treeButton.addComponent(DesktopOnly)

    const chopButton = world.createEntity().addComponent(Button3D,{text:'chop',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            chopButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(MouseInputDevice).inputMode = InputModes.CHOP_WOOD
        }
    })
    buttons.push(chopButton)
    chopButton.addComponent(DesktopOnly)
    const cityButton = world.createEntity().addComponent(Button3D,{text:'city',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            cityButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(MouseInputDevice).inputMode = InputModes.BUILD_CITY
        }
    })
    buttons.push(cityButton)
    cityButton.addComponent(DesktopOnly)



    const ss = 0.10
    const y = 1.0
    const farmTool = world.createEntity()
    farmTool.addComponent(SimpleSphere, {color:'brown', radius:ss, position:{x:-0.5, y:y, z:-0}})
    farmTool.addComponent(Grabable, {onGrab:(ent)=> ent.getMutableComponent(VRController).inputMode = InputModes.PLANT_FARM})

    const treeTool = world.createEntity()
    treeTool.addComponent(SimpleSphere, {color:'green', radius:ss, position:{x:-0.25, y:y, z:-0.5}})
    treeTool.addComponent(Grabable, {onGrab:(ent)=> ent.getMutableComponent(VRController).inputMode = InputModes.PLANT_FOREST})

    const chopTool = world.createEntity()
    chopTool.addComponent(SimpleSphere, {color:'darkbrown', radius:ss, position:{x:0.25, y:y, z:-0.5}})
    chopTool.addComponent(Grabable, {onGrab:(ent)=> ent.getMutableComponent(VRController).inputMode = InputModes.CHOP_WOOD})

    const cityTool = world.createEntity()
    cityTool.addComponent(SimpleSphere, {color:'gray', radius:ss, position:{x:0.5, y:y, z:-0}})
    cityTool.addComponent(Grabable, {onGrab:(ent)=>  ent.getMutableComponent(VRController).inputMode = InputModes.BUILD_CITY})

    oneWorldTick(game,world)

    farmButton.getComponent(Button3D).obj.position.x = -2.5
    treeButton.getComponent(Button3D).obj.position.x = -1
    chopButton.getComponent(Button3D).obj.position.x = 1
    cityButton.getComponent(Button3D).obj.position.x = +2.5


    setupLights(core)

    startWorldLoop(game,world)

}

setupGame()
