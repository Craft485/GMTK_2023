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

import * as level_01 from './levels/level_01.json'
import * as level_02 from './levels/level_02.json'
import * as level_03 from './levels/level_03.json'

const levels = [ level_01, level_02, level_03 ]
let levelIndex = 0

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const ctx = canvas.getContext('2d')

let GAME_OVER = false
let selectedObject: parsedSceneDataObject | null = null
let oldFillColor: string | null = null

const expressionMap: Map<string, number> = new Map([
	["WIN_HEIGHT", canvas.height],
	["WIN_WIDTH", canvas.width]
])

function parseObjectDataExpression(expression: string): number {
	for (const [key, value] of expressionMap) expression = expression.replaceAll(key, `${value}`)
	return eval(expression)
}

let characterObject: parsedSceneDataObject | null = null
let levelData = { scene_data: loadLevelData(levels[levelIndex])}
console.log(levelData)

function loadLevelData(data: { scene_data: Array<unparsedSceneDataObject> }): Array<parsedSceneDataObject> {
	let parsedSceneData = []
	for (const object of Object.values(data.scene_data)) {
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
		if (object.id === 0) characterObject = parsedSceneData[parsedSceneData.length - 1]
	}
	return parsedSceneData
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	for (const object of Object.values(levelData.scene_data)) {
		ctx.fillStyle = object.fillColor
		ctx.strokeStyle = object.strokeColor
		ctx.fillRect(object.pos.x, object.pos.y, object.width, object.height)
		if (object.strokeColor) ctx.strokeRect(object.pos.x, object.pos.y, object.width, object.height)
	}
}

const MOVEMENT_INCREMENT = 10

function objectCollided(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', isCheckingCharacter = false, ignoreCharacterObject = false): boolean | parsedSceneDataObject {
	// Assume selectedObject is not null since that check should have already been done prior to this call
	const clonedObject: parsedSceneDataObject = JSON.parse(JSON.stringify(isCheckingCharacter ? characterObject : selectedObject))

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

	const TOLERANCE_THRESHOLD = isCheckingCharacter ? 5 : 0

	for (const object of Object.values(levelData.scene_data)) {
		if (object.id === clonedObject.id || (object.name.toLowerCase() === 'character' && ignoreCharacterObject)) continue

		const minX_2 = object.pos.x
		const maxX_2 = minX_2 + object.width
		const minY_2 = object.pos.y
		const maxY_2 = minY_2 + object.height

		// TODO: make this explanation make more sense
		// If one of the extreme x values of the first rectangle (max or min) are contained within an interval defined by the extremes of the x values of the second rectangle, or vice verse, and one or more of one of the rectangles extreme y values are contained within an interval defined by the others extreme y values, or vice verse once more, then the two rectangles are overlapping.
		if ((
		(minX_1 >= minX_2 && minX_1 <= maxX_2) ||
		(maxX_1 >= minX_2 && maxX_1 <= maxX_2) ||
		(minX_2 >= minX_1 && minX_2 <= maxX_1) ||
		(maxX_2 >= minX_1 && maxX_2 <= maxX_1)
		) && (
		(minY_1 >= minY_2 && minY_1 <= maxY_2) ||
		(maxY_1 >= minY_2 && maxY_1 <= maxY_2) ||
		(minY_2 >= minY_1 && minY_2 <= maxY_1) ||
		(maxY_2 >= minY_1 && maxY_2 <= maxY_1)
		)) {
			if (isCheckingCharacter && !ignoreCharacterObject) {
				if (object.name.toLowerCase() === 'death') return object
				if (direction === 'RIGHT') {
					const differenceInYLevel = maxY_1 - minY_2
					if (differenceInYLevel <= TOLERANCE_THRESHOLD) {
						// Possible problem waiting to happen since we are just moving the character without really checking its surroundings
						characterObject.pos.y = minY_2 + characterObject.height + 1
						characterObject.pos.x = minX_2 - characterObject.width + 1
						// We've dealt with the collision and should no longer be colliding
						return false
					}
				} else if (direction === 'DOWN') {
					// This little bit of extra math should help in the character not getting pushed off screen
					const candidateYValue = minY_2 - characterObject.height - 1
					if (candidateYValue > 0) characterObject.pos.y = candidateYValue
				}
			} else if (direction === 'UP' && object.name.toLowerCase() === 'character') {
				// Platform should push character up if possible
				const characterCollisionUp = objectCollided('UP', true)
				if (characterCollisionUp === false) {
					// Area above character is clear, still need to check if the platform is going to be clear
					const objectHasCollisionsAbove = objectCollided('UP', false, true)
					if (objectHasCollisionsAbove === false) {
						// Move character up and let the original event handler that called this function move the object
						// Because we check for collisions above the character, this shouldn't push the character off screen
						characterObject.pos.y -= MOVEMENT_INCREMENT
						return false
					}
				}
			}
			return object
		} else if (minY_1 < 0 || maxY_1 > canvas.height || minX_1 < 0 || maxX_1 > canvas.width) {
			// Edge of screen collision
			return true
		}
	}
	return false
}

const KEYS: { [key: string]: boolean } = {}

const keyDownEventHandler = (e: KeyboardEvent) => {
	if (e.code === 'KeyR' || e.code === 'Enter') return levelData = { scene_data: loadLevelData(levels[levelIndex]) }
	if (selectedObject === null || GAME_OVER) return
	return KEYS[e.code] = true
}

const mouseDownEventHandler = (e: MouseEvent) => {
	if (GAME_OVER) return
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
			if (selectedObject !== null) {
				selectedObject.fillColor = oldFillColor || 'white'
				selectedObject = null
			}
			selectedObject = object
			console.log(object)
			oldFillColor = object.fillColor
			object.fillColor = 'purple'
			return
		}
	}
	if (selectedObject !== null) {
		selectedObject.fillColor = oldFillColor || 'white'
		selectedObject = null
	}
}

function advanceCharacter() {
	if (GAME_OVER) return
	if ((KEYS['KeyW'] || KEYS['ArrowUp']) && objectCollided('UP') === false) selectedObject.pos.y -= MOVEMENT_INCREMENT
	if ((KEYS['KeyS'] || KEYS['ArrowDown']) && objectCollided('DOWN') === false) selectedObject.pos.y += MOVEMENT_INCREMENT
	if ((KEYS['KeyA'] || KEYS['ArrowLeft']) && objectCollided('LEFT') === false) selectedObject.pos.x -= MOVEMENT_INCREMENT
	if ((KEYS['KeyD'] || KEYS['ArrowRight']) && objectCollided('RIGHT') === false) selectedObject.pos.x += MOVEMENT_INCREMENT
	const characterCollidingRight = objectCollided('RIGHT', true)
	const characterCollidingDown = objectCollided('DOWN', true)
	if (characterCollidingRight === false  && characterCollidingDown !== false) characterObject.pos.x += MOVEMENT_INCREMENT
	if (characterCollidingDown === false) characterObject.pos.y += MOVEMENT_INCREMENT
	if (characterCollidingDown["name"]?.toLowerCase() === "end") {
		// Manage game state
		GAME_OVER = true
		selectedObject = null
		// Manage UI
		const overlay = document.createElement('div')
		overlay.id = 'overlay'
		
		const text = document.createElement('p')
		text.id = 'overlay-text'
		text.innerText = levels[levelIndex + 1] ? `Success!` : 'Game Won!'
		
		const nextLevelButton = document.createElement('button')
		nextLevelButton.innerText = 'Next Level'
		nextLevelButton.onclick = () => { 
			levelIndex++
			if (levels[levelIndex]) {
				levelData = { scene_data: loadLevelData(levels[levelIndex]) }
				GAME_OVER = false
				overlay.remove()
			}
		}
		nextLevelButton.className = 'button'
		
		const playAgainButton = document.createElement('button')
		playAgainButton.innerText = 'Play Again'
		playAgainButton.onclick = () => {
			levelData = { scene_data: loadLevelData(levels[levelIndex]) }
			GAME_OVER = false
			overlay.remove()
		}
		playAgainButton.className = 'button'
		overlay.appendChild(text)
		
		const buttonContainer = document.createElement('div')
		buttonContainer.className = 'button-container'
		buttonContainer.appendChild(playAgainButton)
		buttonContainer.appendChild(nextLevelButton)

		overlay.appendChild(buttonContainer)
		document.body.prepend(overlay)
	} else if (characterCollidingDown["name"]?.toLowerCase() === 'death' || characterCollidingRight["name"]?.toLowerCase() === 'death') {
		// Manage game state
		GAME_OVER = true
		selectedObject = null
		// Manage UI
		const overlay = document.createElement('div')
		overlay.id = 'overlay'
		
		const text = document.createElement('p')
		text.id = 'overlay-text'
		text.innerText = `Game Over!`

		const btn = document.createElement('button')
		btn.innerText = 'Restart'
		btn.onclick = () => {
			levelData = { scene_data: loadLevelData(levels[levelIndex]) }
			GAME_OVER = false
			overlay.remove()
		}
		btn.className = 'button'

		overlay.appendChild(text)
		overlay.appendChild(btn)
		document.body.prepend(overlay)
	}
	if (characterCollidingDown === true) {
		// objectCollided returns true if we hit the edge of the screen
	}
}

function start() {
	// Remove ui overlay
	document.querySelector<HTMLElement>('#overlay').remove()
	// Set event handlers
	window.addEventListener('keydown', keyDownEventHandler)
	window.addEventListener('keyup', e => KEYS[e.code] = false )
	window.addEventListener('mousedown', mouseDownEventHandler)
	// Start game loop
	setInterval(draw, 100)
	setTimeout(() => setInterval(advanceCharacter, 100), 1500)
}

window.onload = () => document.querySelector<HTMLButtonElement>('button.button').onclick = () => start()