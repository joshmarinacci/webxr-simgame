import {AmbientLight, Color, DirectionalLight} from "../node_modules/three/build/three.module.js"
import {World} from "../node_modules/ecsy/build/ecsy.module.js"
import {oneWorldTick, startWorldLoop, ThreeCore, ThreeNode, ThreeSystem} from "./threesystem.js"
import {Button3D, Hex3dsystem, HexMapView, ScoreBoard} from './hex3dsystem.js'
import {MouseInputDevice, MouseInputSystem} from './mousesystem.js'
import {KeyboardInputSystem} from "./keyboardsystem.js"
import {VRController, VRInputSystem} from './vrinputsystem.js'
import {GameState, GameStateEnums, HexMapComp, InputModes, LogicSystem} from "./logic2.js"
import {Level, LevelsSystem} from './levelssystem.js'
import {VRStats, VRStatsSystem} from './vrstats.js'
import {setupLevels} from './levels.js'
import {Instructions3D, Instructions3DSystem} from './Instructions3D.js'
import {Grabable, GrabbingSystem, Hand} from './grabbingsystem.js'
import {SVGExtrudedObj, SVGSystem} from './SVGSystem.js'
import {toRad} from './hex.js'
import {DesktopOnly, VROnly, VRSwitchingSystem} from './vrswitchingsystem.js'


let game


function setupLights(core) {
    //set the background color of the scene
    core.scene.background = new Color( 0xcccccc );
    const light = new DirectionalLight( 0xffffff, 0.5 );
    core.scene.add(light)
    const ambient = new AmbientLight(0xffffff,0.3)
    core.scene.add(ambient)
}

function swap(handEnt, settings, mode) {
    if(handEnt.hasComponent(SVGExtrudedObj)) {
        handEnt.removeComponent(SVGExtrudedObj)
    }
    handEnt.addComponent(SVGExtrudedObj,settings)
    handEnt.getMutableComponent(VRController).inputMode = mode
}

function setupVRGrabbableObjects(world) {
    const y = 1.0

    const farmTool = world.createEntity()
    const farmRot = {
        x:toRad(-90),
        y:toRad(-45),
        z:toRad(-90-45+45),
    }
    const farmTrans = {
        x:0.0,
        y:0.3,
        z:-0.3
    }
    farmTool.addComponent(ThreeNode, {position:{x:-0.5, y:y, z:-0.3}, color:'brown'})
    farmTool.addComponent(SVGExtrudedObj,{scale:0.001, src:'src/hoe-svgrepo-com.svg',  ccw:false, rotation:farmRot, translate:farmTrans })
    farmTool.addComponent(Grabable, {onGrab:(handEnt)=> {
        swap(handEnt, {
                    scale: 0.001,
                    src: 'src/hoe-svgrepo-com.svg',
                    ccw: false,
                    rotation: farmRot,
                    translate: farmTrans
                },InputModes.PLANT_FARM)
        }})
    farmTool.addComponent(VROnly)

    const treeTool = world.createEntity()
    const treeRot = {
        x:toRad(-45-45),
        y:toRad(+90),
        z:toRad(90+45),
    }
    const treeTrans = {
        y:0.1,
        x:-0.1,
        z:-0.2
    }
    treeTool.addComponent(ThreeNode, {position:{x:-0.25, y:y, z:-0.3}, color:'green'})
    treeTool.addComponent(SVGExtrudedObj,{scale:0.001, src:'src/glove-svgrepo-com.svg', ccw:false, rotation:treeRot, translate:treeTrans})
    treeTool.addComponent(Grabable, {onGrab:(handEnt)=> {
        swap(handEnt,{
                    scale: 0.001,
                    src: 'src/glove-svgrepo-com.svg',
                    ccw: false,
                    rotation: treeRot,
                    translate: treeTrans
                },InputModes.PLANT_FOREST)
        }})
    treeTool.addComponent(VROnly)


    const chopTool = world.createEntity()
    const chopRot = {
        x:toRad(90),
        y:toRad(+0),
        z:toRad(+90),
    }
    const chopTrans = {
        x:0.0,
        y:-0.3,
        z:-0.5
    }
    chopTool.addComponent(ThreeNode, {color:'tan', position:{x:0.25, y:y, z:-0.3}})
    chopTool.addComponent(SVGExtrudedObj,{scale:0.001, src:'src/axe-svgrepo-com.svg', ccw:false, rotation:chopRot, translate:chopTrans})
    chopTool.addComponent(Grabable, {onGrab:(handEnt)=>{
        swap(handEnt,{
                    scale: 0.001, src: 'src/axe-svgrepo-com.svg', ccw: false, rotation: chopRot,
                    translate: chopTrans
                },InputModes.CHOP_WOOD)
        }})
    chopTool.addComponent(VROnly)

    const cityTool = world.createEntity()
    const cityRot = {
        x:toRad(-90),
        y:toRad(+0),
        z:toRad(+90),
    }
    const cityTrans = {
        x:0.0,
        y:-0.3,
        z:-0.0
    }
    cityTool.addComponent(ThreeNode, {color:'gray',position:{x:0.5, y:y, z:-0.3}})
    cityTool.addComponent(SVGExtrudedObj,{scale:0.001, src:'src/shovel-svgrepo-com.svg', ccw:true, rotation:cityRot, translate:cityTrans})
    cityTool.addComponent(Grabable, {onGrab:(handEnt)=>{
        swap(handEnt,{
                    scale: 0.001,
                    src: 'src/shovel-svgrepo-com.svg',
                    ccw: true,
                    rotation: cityRot,
                    translate: cityTrans
                }, InputModes.BUILD_CITY)
        }})
    cityTool.addComponent(VROnly)

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
    world.registerSystem(SVGSystem)

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
        .addComponent(Hand,{grabDistance:0.15})
        .addComponent(ThreeNode)
    world.createEntity()
        .addComponent(VRController,{vrid:1})
        .addComponent(Hand,{grabDistance:0.15})
        .addComponent(ThreeNode)

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



    setupVRGrabbableObjects(world)
    oneWorldTick(game,world)

    farmButton.getComponent(Button3D).obj.position.x = -2.5
    treeButton.getComponent(Button3D).obj.position.x = -1
    chopButton.getComponent(Button3D).obj.position.x = 1
    cityButton.getComponent(Button3D).obj.position.x = +2.5

    setupLights(core)

    startWorldLoop(game,world)
}


setupGame()
