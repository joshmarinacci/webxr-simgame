import {AmbientLight, Clock, Color, DirectionalLight} from "../node_modules/three/build/three.module.js"
import {World} from "../node_modules/ecsy/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeSystem} from "./threesystem.js"
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
            game.getMutableComponent(GameState).inputMode = InputModes.PLANT_FARM
        }
    })
    buttons.push(farmButton)
    const treeButton = world.createEntity().addComponent(Button3D,{text:'tree',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            treeButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(GameState).inputMode = InputModes.PLANT_FOREST
        }
    })
    buttons.push(treeButton)

    const chopButton = world.createEntity().addComponent(Button3D,{text:'chop',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            chopButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(GameState).inputMode = InputModes.CHOP_WOOD
        }
    })
    buttons.push(chopButton)
    const cityButton = world.createEntity().addComponent(Button3D,{text:'city',
        onClick:()=>{
            buttons.forEach(ent => ent.getMutableComponent(Button3D).selected = false)
            cityButton.getMutableComponent(Button3D).selected = true
            game.getMutableComponent(GameState).inputMode = InputModes.BUILD_CITY
        }
    })
    buttons.push(cityButton)



    const farmTool = world.createEntity()
    farmTool.addComponent(SimpleSphere, {color:'brown', radius:0.25, position:{x:-2, y:1, z:-1}})
    farmTool.addComponent(Grabable)

    const treeTool = world.createEntity()
    treeTool.addComponent(SimpleSphere, {color:'green', radius:0.25, position:{x:-1, y:1, z:-1}})
    treeTool.addComponent(Grabable)

    const chopTool = world.createEntity()
    chopTool.addComponent(SimpleSphere, {color:'darkbrown', radius:0.25, position:{x:1, y:1, z:-1}})
    chopTool.addComponent(Grabable)

    const cityTool = world.createEntity()
    cityTool.addComponent(SimpleSphere, {color:'gray', radius:0.25, position:{x:2, y:1, z:-1}})
    cityTool.addComponent(Grabable)

    oneWorldTick(game,world)

        farmButton.getComponent(Button3D).obj.position.x = -2.5
        treeButton.getComponent(Button3D).obj.position.x = -1
        chopButton.getComponent(Button3D).obj.position.x = 1
        cityButton.getComponent(Button3D).obj.position.x = +2.5


    setupLights(core)

    startWorldLoop(game,world)

}

setupGame()
