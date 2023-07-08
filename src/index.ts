interface unparsedSceneDataObject {
	name: string
	id: number
	pos: { x: number | string, y: number | string }
	width: number | string
	height: number | string
	strokeColor: string
	fillColor: string
	moveable: boolean
}

interface parsedSceneDataObject {
	name: string
	id: number
	pos: { x: number, y: number }
	width: number
	height: number
	strokeColor: string
	fillColor: string
	moveable: boolean
}

// import { Vector3 as Vec3, Vector2 as Vec2, Raycaster, Object3D } from 'three'

import * as initLevelData from './levels/level_01.json'

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const ctx = canvas.getContext('2d')

let objectIsSelected = false
let selectedObject: parsedSceneDataObject | null = null

const expressionMap: Map<string, number> = new Map([
	["WIN_HEIGHT", canvas.height],
	["WIN_WIDTH", canvas.width]
])
console.log(expressionMap)

function parseObjectDataExpression(expression: string): number {
	for (const [key, value] of expressionMap) expression = expression.replaceAll(key, `${value}`)
	return eval(expression)
}

let levelData = { scene_data: loadLevelData(initLevelData)}
console.log(levelData)

function loadLevelData(data: { scene_data: Array<unparsedSceneDataObject> }): Array<parsedSceneDataObject> {
	let parsedSceneData = []
	for (const object of Object.values(data.scene_data)) {
		// console.log(object)
		const xPos = object.pos.x === Number(object.pos.x) ? object.pos.x : parseObjectDataExpression(`${object.pos.x}`)
		const yPos = object.pos.y === Number(object.pos.y) ? object.pos.y : parseObjectDataExpression(`${object.pos.y}`)
		const width = object.width === Number(object.width) ? object.width : parseObjectDataExpression(`${object.width}`)
		const height = object.height === Number(object.height) ? object.height : parseObjectDataExpression(`${object.height}`)
		parsedSceneData.push({
			name: object.name,
			id: object.id,
			pos: {
				x: xPos,
				y: yPos
			},
			width: width,
			height: height,
			strokeColor: object.strokeColor,
			fillColor: object.fillColor,
			moveable: object.moveable
		})
	}
	return parsedSceneData
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	for (const object of Object.values(levelData.scene_data)) {
		// console.log(object)
		ctx.fillStyle = object.fillColor
		ctx.strokeStyle = object.strokeColor
		ctx.fillRect(object.pos.x, object.pos.y, object.width, object.height)
		ctx.strokeRect(object.pos.x, object.pos.y, object.width, object.height)
	}
	// debugger
}

const MOVEMENT_INCREMENT = 10

function objectCollided(direction: string): boolean {
	// Assume selectedObject is not null since that check should have already been done prior to this call
	const clonedObject: parsedSceneDataObject = JSON.parse(JSON.stringify(selectedObject))
	// console.log(clonedObject)
	switch (direction) {
		case 'UP':
			clonedObject.pos.y -= MOVEMENT_INCREMENT
			break;
		case 'DOWN':
			clonedObject.pos.y += MOVEMENT_INCREMENT
			break;
		case 'LEFT':
			clonedObject.pos.x -= MOVEMENT_INCREMENT
			break;
		case 'RIGHT':
			clonedObject.pos.x += MOVEMENT_INCREMENT
			break;
		default:
			break;
	}

	const minX_1 = clonedObject.pos.x
	const maxX_1 = minX_1 + clonedObject.width
	const minY_1 = clonedObject.pos.y
	const maxY_1 = minY_1 + clonedObject.height

	for (const object of Object.values(levelData.scene_data)) {
		if (object.id === clonedObject.id) continue

		const minX_2 = object.pos.x
		const maxX_2 = minX_2 + object.width
		const minY_2 = object.pos.y
		const maxY_2 = minY_2 + object.height

		// TODO: make this explanation make more sense
		// If one of the extreme x values of the first rectangle (max or min) are contained within an interval defined by the extremes of the x values of the second rectangle and one or more of one of the rectangles extreme y values are contained within an interval defined by the others extreme y values, then the two rectangles are overlapping.
		if (((minX_1 >= minX_2 && minX_1 <= maxX_2) || (maxX_1 >= minX_2 && maxX_1 <= maxX_2)) && 
			((minY_1 >= minY_2 && minY_1 <= maxY_2) || (maxY_1 >= minY_2 && maxY_1 <= maxY_2))) {
			// Check both max and min y_1
			// There should be overlap(?)
			// console.log('collide')
			return true
		} else if (minY_1 < 0 || maxY_1 > canvas.height || minX_1 < 0 || maxX_1 > canvas.width) {
			// Edge of screen collision
			return true
		}
	}
	// console.log('no collide')
	return false
	// =============================================================================================================================================
	// AS OF 1:37AM I AM FAIRLY CONFIDENT THAT THIS COLLISION DETECTION ALGORITHM IS WORKING AS INTENDED WITHOUT UNACCOUNTED FOR EDGE CASES, BUT ITS ALSO 1:37AM
	// =============================================================================================================================================
}

window.addEventListener('keydown', e => {
	if (selectedObject === null) return
	// Move the selected object accordingly
	switch (e.code) {
		case 'KeyW':
		case 'ArrowUp':
			if (!objectCollided('UP')) selectedObject.pos.y -= MOVEMENT_INCREMENT
			break;
		case 'KeyS':
		case 'ArrowDown':
			if (!objectCollided('DOWN')) selectedObject.pos.y += MOVEMENT_INCREMENT
			break;	
		case 'KeyA':
		case 'ArrowLeft':
			if (!objectCollided('LEFT')) selectedObject.pos.x -= MOVEMENT_INCREMENT
			break;
		case 'KeyD':
		case 'ArrowRight':
			if (!objectCollided('RIGHT')) selectedObject.pos.x += MOVEMENT_INCREMENT
			break;
		default:
			break;
	}
})

window.addEventListener('mousedown', e => {
	// Determine if the mouse press is within the bounds of an object
	for (const object of Object.values(levelData.scene_data)) {
		if (!object.moveable) continue
		const minX = object.pos.x
		const maxX = minX + object.width
		const minY = object.pos.y
		const maxY = minY + object.height

		const hitReg = e.x >= minX && e.x <= maxX && e.y >= minY && e.y <= maxY
		console.log(hitReg)
		if (hitReg) {
			objectIsSelected = true
			selectedObject = object
			console.log(object)
			object.fillColor = "purple"
			return
		}
	}
	objectIsSelected = false
	if (selectedObject !== null) {
		selectedObject.fillColor = "white"
		selectedObject = null
	}
})

window.onload = () => { setInterval(draw, 100) }