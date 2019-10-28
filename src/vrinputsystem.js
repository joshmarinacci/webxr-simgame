import {
    AdditiveBlending,
    BufferGeometry,
    Float32BufferAttribute,
    Line,
    LineBasicMaterial,
    Raycaster,
    Vector3
} from "../node_modules/three/build/three.module.js"
import {System} from "../node_modules/ecsy/build/ecsy.module.js"
import {ThreeCore} from './threesystem.js'
import {Button3D, Highlighted} from './hex3dsystem.js'
import {
    CommandComp,
    COMMANDS,
    DirtTile,
    ForestTile,
    GameState,
    GameStateEnums,
    HexMapComp,
    InputModes
} from './logic2.js'

const Y_AXIS = new Vector3(0,1,0)
const ROT_SPEED = 0.03
const MOVE_SPEED = 0.2

export class VRController {
    constructor() {
        this.raycaster = new Raycaster()
        this.vrid = -1
        this.pressed = false
        this.inputMode = InputModes.NONE
    }
}

export class VRInputSystem extends System {
    init() {
    }
    execute() {

        const core = this.queries.three.results[0].getMutableComponent(ThreeCore)
        this.queries.controllers.added.forEach(ent => {
            const con = ent.getMutableComponent(VRController)
            con.controller = core.renderer.vr.getController(con.vrid)
            con.controller.addEventListener('selectstart', () => {
                con.pressed = true
            })
            con.controller.addEventListener('selectend', () => {
                con.pressed = false
            })
            core.scene.add(con.controller)

            const geometry = new BufferGeometry()
            geometry.addAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0,  0, 0,-4], 3 ) );
            geometry.addAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
            const material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );
            con.controller.add( new Line( geometry, material ) );
        })
        this.queries.controllers.results.forEach(ent => {
            const cont = ent.getMutableComponent(VRController)
            this.updateGP(core,cont)
            this.updatePointing(core,cont)
            this.updateClick(core,cont)
        })
    }

    findHexAtController(core,cont) {
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(cont.controller.quaternion)
        cont.raycaster.set(cont.controller.position, dir)
        const intersects = cont.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.hex) {
                return {hex:it.object.userData.hex, node:it.object}
            }
        }
        return {}
    }

    updatePointing(core,cont) {
        const it = this.findObjectAtController(core,cont,(ent => ent.hasComponent(Button3D)))
        if(it) {
            const ent = it.object.userData.ent
            if(cont.current && cont.current.hasComponent(Highlighted) && cont.current !== ent) {
                cont.current.removeComponent(Highlighted)
            }
            if(!ent.hasComponent(Highlighted)) {
                ent.addComponent(Highlighted)
                cont.current = ent
            }
            return
        }

        const {hex,node} = this.findHexAtController(core,cont)
        if(hex) {
            const ent = node.userData.ent
            if(cont.current && cont.current.hasComponent(Highlighted) && cont.current !== ent) {
                cont.current.removeComponent(Highlighted)
            }
            if(!ent.hasComponent(Highlighted)) {
                ent.addComponent(Highlighted)
                cont.current = ent
            }
        }
    }

    findObjectAtController(core,cont,filter) {
        const dir = new Vector3(0, 0, -1)
        dir.applyQuaternion(cont.controller.quaternion)
        cont.raycaster.set(cont.controller.position, dir)
        const intersects = cont.raycaster.intersectObjects(core.scene.children,true)
        for(let i=0; i<intersects.length; i++) {
            const it = intersects[i]
            if(it.object.userData.ent && filter(it.object.userData.ent)) return it
        }
        return null
    }

    updateClick(core, cont) {
        if(cont.prevPressed === false && cont.pressed === true) {
            console.log("Processing a controller click")
            cont.prevPressed = cont.pressed
            const state = this.queries.state.results[0].getMutableComponent(GameState)
            if(state.isMode(GameStateEnums.SHOW_INSTRUCTIONS)) return state.toMode(GameStateEnums.PLAY)
            if(state.isMode(GameStateEnums.SHOW_WIN)) return state.toMode(GameStateEnums.NEXT_LEVEL)
            if(state.isMode(GameStateEnums.WON_GAME)) return


            const it = this.findObjectAtController(core,cont,(ent => ent.hasComponent(Button3D)))
            if(it) {
                const button = it.object.userData.ent.getComponent(Button3D)
                if(button.onClick) button.onClick()
                return
            }

            const {hex,node} = this.findHexAtController(core,cont)
            if(!hex) return
            const mapView = this.queries.map.results[0].getMutableComponent(HexMapComp)
            const data = mapView.map.get(hex)
            const ent = data.ent
            if(ent.hasComponent(DirtTile)) {
                console.log("checking input",state.inputMode)
                if(cont.inputMode === InputModes.PLANT_FOREST)
                    ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FOREST, hex: hex, data: data })
                if(cont.inputMode === InputModes.PLANT_FARM)
                    ent.addComponent(CommandComp, { type: COMMANDS.PLANT_FARM, hex: hex, data: data })
            }
            if(cont.inputMode === InputModes.CHOP_WOOD && ent.hasComponent(ForestTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.CHOP_WOOD, hex: hex, data: data })
            }
            if(cont.inputMode === InputModes.BUILD_CITY && ent.hasComponent(DirtTile)) {
                ent.addComponent(CommandComp, { type: COMMANDS.BUILD_CITY, hex: hex, data: data })
            }
        }
        cont.prevPressed = cont.pressed
    }

    turnLeft() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            core.stageRot.rotation.y -= ROT_SPEED
        })
    }

    turnRight() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            core.stageRot.rotation.y += ROT_SPEED
        })
    }

    moveForward() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            const dir = new Vector3(0,0,1)
            dir.applyAxisAngle(Y_AXIS, -core.stageRot.rotation.y)
            dir.normalize().multiplyScalar(MOVE_SPEED)
            ent.getMutableComponent(ThreeCore).stagePos.position.add(dir)
        })
    }

    moveBackward() {
        this.queries.three.results.forEach(ent => {
            const core = ent.getMutableComponent(ThreeCore)
            const dir = new Vector3(0,0,1)
            dir.applyAxisAngle(Y_AXIS, -core.stageRot.rotation.y)
            dir.normalize().multiplyScalar(MOVE_SPEED)
            ent.getMutableComponent(ThreeCore).stagePos.position.sub(dir)
        })
    }

    updateGP(core, con) {
        function findGamepad( id ) {
            // Iterate across gamepads as Vive Controllers may not be
            // in position 0 and 1.
            var gamepads = navigator.getGamepads && navigator.getGamepads();
            for ( var i = 0, j = 0; i < gamepads.length; i ++ ) {
                var gamepad = gamepads[ i ];
                if ( gamepad && ( gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith( 'Oculus Touch' ) || gamepad.id.startsWith( 'Spatial Controller' ) ) ) {
                    if ( j === id ) return gamepad;
                    j ++;
                }
            }
        }
        const gamepad = findGamepad(con.vrid)
        if(gamepad) {
//              console.log("trigger", gamepad.buttons[1].pressed)
//             console.log("grip", gamepad.buttons[2].pressed)
//             console.log("menu", gamepad.buttons[3].pressed)
//             console.log(gamepad.axes[0],gamepad.axes[1])

            //if not left or right too far then do forward back
            const thresh = 0.4
            if(gamepad.axes[0]>-thresh && gamepad.axes[0]<thresh) {
                if (gamepad.axes[1] < -thresh) {
                    this.moveForward()
                }
                if (gamepad.axes[1] > +thresh) {
                    this.moveBackward()
                }
                return
            }
            if(gamepad.axes[1] >-thresh && gamepad.axes[1] < thresh) {
                if(gamepad.axes[0]<-thresh) {
                    this.turnLeft()
                }
                if(gamepad.axes[0]>+thresh) {
                    this.turnRight()
                }
            }
        }
    }
}

VRInputSystem.queries = {
    three: {
        components: [ThreeCore]
    },
    controllers: {
        components:[VRController],
        listen: {
            added:true,
            removed:true,
        }
    },
    state: {
        components:[GameState]
    },
    map: {
        components: [HexMapComp]
    }
}
