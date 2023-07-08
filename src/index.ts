interface unparsedSceneDataObject {
	name: string
	pos: { x: number | string, y: number | string }
	width: number | string
	height: number | string
	strokeColor: string
	fillColor: string
	moveable: boolean
}

interface parsedSceneDataObject {
	name: string
	pos: { x: number, y: number }
	width: number
	height: number
	strokeColor: string
	fillColor: string
	moveable: boolean
}

import * as initLevelData from './levels/level_01.json'

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const ctx = canvas.getContext('2d')

let objectIsSelected = false
let selectedObject = null

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

window.addEventListener('keydown', e => {
	// Move the selected object accordingly
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

window.onload = () => { setInterval(draw, 500) }