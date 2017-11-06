"use strict"

class Game {
	constructor(data) {
		this.boost = 1
		Object.assign(this, data.data)
		
		this.id = gameData.gameId
		
		this.setTargetFPS(this.targetFPS || settings.targetGameFPS || 60)

		if (data.elementData) {
			for (let elementData of data.elementData) {
				if (!elementData.name || this[elementData.name]) 
					continue
				
				this[elementData.name] = new elementData.class (elementData.data, {
					game : this
				})
			}
		}
				
		if (!this.autoSaveSlot || !this.load(this.autoSaveSlot))
			this.reset()
	}
	
	setTargetFPS(value) {
		this.targetFPS = value
		this.frameTime = 1000 / this.targetFPS
	}
	
	reset(saveData) {
		
		//Reset engine values
		this.canUpdate = false
		this.offline = true
		
		this.updatesPlanned = new Set()
		this.activeData = new Set()
		this.unlocks = new Set()

		let timerData = saveData && saveData.timers || {}
		
		this.timers = {
			//engine timers
			autoSave : new Timer(),
			change : new Timer(),
			gameUpdate : new Timer(),
			guiUpdate :  new Timer(),
			
			//game timers
			emit : new Timer({
				savable : true, 
				boostable : true,
				value : timerData["emit"] || 0, 
			}),
		}
		
		//Regenerate data
		if (this.data)
			delete this.data
		
		this.data = this.initData(gameData)
		
		this.gameCore = new GameCore({
			game : this,
			gameData
		})
		
		if (saveData) {
			for (let resource of Object.values(this.data)) {
				let data = saveData.resources[resource.name]
				if (data) {
					resource.loadSaveData(data)
					this.updatesPlanned.add(resource)
				}
			}		
		}
					
		//Regenerate GUI
		if (this.gui) 
			this.gui.destroy()
			
		this.gui = new Gui(gameData.guiData, {
			game : this
		})

		//Update		
		for (let resource of Object.values(this.data)) {
			this.updatesPlanned.add(resource)
		}
			
		this.update(true)		
		this.gui.update(true)		
		
		if (saveData && saveData.time)
			this.data.offlinium.add(Math.max(0, ((Date.now() - saveData.time) * 1e-3 - 60) * this.data.offliniumRate.value))

		if (saveData && saveData.unlocks)
			for (let unlock of saveData.unlocks)
				this.unlock(unlock)
		
		//Activate tab
		this.gui.tabs.show(saveData && saveData.gameTab || "mainTab", false)

		this.offline = false
	}
	
	initData(data) {
		let result = {}
		if (!data)
			return result
		
		let baseData = [...data.resources]
		
		for (let resource of baseData) {
			if (!resource.name) 
				continue
			let item = new resource.class (gameData.templates[resource.class.name], resource, {
				game : this,
				dependants : new Set(),
				displays : new Set(),
			})
			result[resource.name] = item
		}
		
		function scrapResources(x) {
			if (!x)
				return []
			
			if (typeof(x) != "object")
				return []
			
			return Object.keys(x)
		}
			
		for (let resource of Object.values(result)) {
			let dependencies = [
				...(resource.dependencies || []),
				...scrapResources(resource.displayRequirements),
				...scrapResources(resource.requirements),
				...scrapResources(resource.cost)
			]
			resource.dependencies = {self : resource}

			for (let name of dependencies) {
				if (typeof name == "string") {
					let target = result[name]				
					resource.dependencies[name] = target
					target.dependants.add(resource)
				} else {
					let subdependencies = new Set()
					for (let other of Object.values(result)) {
						if (other instanceof name) {
							subdependencies.add(other)
							other.dependants.add(resource)
						}
					}
					resource.dependencies[name.name] = subdependencies
				}
			}
		}
		
		for (let resource of Object.values(result)) {
			if (resource.valueFunction) 
				resource.value = resource.valueFunction(resource.dependencies)
		}

		return result
	}
	
	load (slot) {
		let saveData = localStorage[`${this.id}_${slot}`]
		
		if (!saveData)
			return false

		saveData = JSON.parse(decompressSave(saveData))
		
		if (saveData.version < 3) {
			this.reset()
			game.gui.notify("error", "Save outdated", "Your save was SEVERELY outdated and could not be compatibly loaded. The game is in early development, and is not released for public, things like this are bound to happen. Thanks for showing your interest.")
		} else {
			this.reset(saveData)
		}
		
		return true
	}
	
	save (slot) {
		let saveData = {
			resources : {}
		}
		
		for (let resource of Object.values(this.data)) {
			let data = resource.getSaveData()
			if (Object.entries(data).length)
				saveData.resources[resource.name] = data
		}
		
		saveData.unlocks = [...this.unlocks]
		saveData.version = this.version
		saveData.gameTab = this.gui.tabs.activeTab?this.gui.tabs.activeTab.name:"mainTab"
		
		let now = new Date()
		saveData.timeString = `${now.toDateString()} ${now.toTimeString().split(" ")[0]}`
		saveData.time = Date.now()
		
		saveData.timers = {}

		for (let [name, timer] of Object.entries(this.timers))
			if (timer.savable)
				saveData.timers[name] = timer.value

		localStorage[`${this.id}_${slot}`] = compressSave(JSON.stringify(saveData))

	}
	
	update(forced) {
		if (!this.canUpdate && !forced)
			return false
		
		while (this.updatesPlanned.size) {
			for (let resource of this.updatesPlanned) {
				resource.update(forced)
				this.updatesPlanned.delete(resource)
			}
		}
		
		this.canUpdate = false
		return true
	}
	
	updateChanges() {
		
		for (let resource of Object.values(this.data))
			resource.getChangeSpeed(this.timers.change.value)
		
		this.timers.change.value = 0
	}
	
	advance(time = this.frameTime) {
		this.boost = this.data.offlinium.value > 0 ? this.data.offliniumPower.value : 1
		
		if (this.data.offlinium.value > 0) {
			this.data.offlinium.add(-time * 1e-3 * (this.boost - 1))
		}

		for (let timer of Object.values(this.timers))
			timer.tick(time, this.boost)
		
		for (let resource of this.activeData) {
			resource.timeLeft -= time * this.boost
			if (resource.timeLeft < 0) {
				resource.timeLeft = 0
				resource.active = false
				this.activeData.delete(resource)
			}
		}
		
		this.gameCore.advance(time * this.boost)

		if (this.timers.guiUpdate.value * settings.targetGuiFPS >= 990) {
			this.timers.guiUpdate.value = 0
			this.gui.canUpdate = true
		}
		
		if (this.timers.gameUpdate.value * settings.targetGameFPS >= 990) {
			this.timers.gameUpdate.value = 0
			this.canUpdate = true
		}
		
		if (this.timers.autoSave.value > 10000) {
			this.timers.autoSave.value = 0
			this.save(this.autoSaveSlot)
		}
		
		if (this.timers.change.value > 1000) {
			this.updateChanges()
		}
		
		if (dev) dev.dataFrames++
	}
	
	timeSkip(time) {

		this.offline = true
		
		let offlineData = []

		for (let resource of Object.values(this.data))
				offlineData.push({
					name : resource.name,
					startValue : resource.value
				})
		
		let ticks = time / this.frameTime
				
		for (let i = 0; i < ticks; i++) {
			this.advance(this.frameTime)
			if (i & 0b1111 == 0b1111)
				this.update()
		}		

		let output = []
		for (let data of offlineData) {
			let resource = this.data[data.name]
			data.output = resource.value - data.startValue
			if (resource.seen && data.output)
				output.push(`${resource.displayName || data.name}: ${resource.displayString(data.output)}`)
		}
		
		this.offline = false

		if (time > 1000 && output.length)
			this.gui.notify("timeSkip",`Production for ${timeString(time)}:`,output.join(', '))
		
	}
	
	checkResources(resources, pay) {
		if (!resources)
			return true
		
		for (let [name, value] of Object.entries(resources)) {
			let resource = this.data[name]
			
			if (!resource || resource.value < value)
				return false
			
			if (pay)
				resource.add(-value)
		}
		
		return true
	}

	unlock(name) {
		if (this.unlocks.has(name))
			return false
		
		console.log("unlocking", name)
		
		switch (name) {
			case "plan" : 
				for (let button of this.gui.dialogs.tabs.get("plan").displayButtons)
					button.reveal()
				break
		}
		
		this.unlocks.add(name)
		return true
	}	
}

class GameObject {
	constructor (...data) {
		this.savables = []
		this.seen = false
		this.value = 0
		Object.assign(this, ...data)
		
		this.addSavable("seen", this.seen)
		
		this.oldValue = this.value
		this.savedValue = this.value
		this.infoValues = {}
		this.changeSpeed = 0
	}	
	
	getChangeSpeed(time) {
		if (!time) 
			return
		
		this.oldChange = this.changeSpeed
		this.changeSpeed = (this.value - this.savedValue) * 1000 / time
		this.updateDisplays()
				
		this.savedValue = this.value
	}
	
	addSavable(name, value) {
		this[name] = value
		
		this.savables.push({
			name, value
		})
	}
	
	reset() {
		for (let {name, value} of this.savables) {
			this[name] = value
		}
	}
	
	getSaveData() {
		let saveData = {}
		for (let savable of this.savables) {
			if (this[savable.name] != savable.value)
				saveData[savable.name] = this[savable.name]
		}
		return saveData
	}
	
	loadSaveData(saveData) {
		if (!saveData) saveData = {}
		for (let savable of this.savables) {
			if (saveData[savable.name] !== undefined)
				this[savable.name] = saveData[savable.name]
			else
				this[savable.name] = savable.value
		}
		
		this.savedValue = this.value
		this.changeSpeed = 0

		if (this.onChange)
			this.onChange()

		if (this.onLoad)
			this.onLoad()

	}
	
	update() {
		if (this.valueFunction)
			this.value = this.valueFunction(this.dependencies)
		
		if (this.info) {
			for (let [name,info] of Object.entries(this.info))
				this.infoValues[name] = info.valueFunction(this.dependencies)
		}
		
		if (!this.seen && (
			this.displayRequirement && this.displayRequirement(this.dependencies) || 
			this.displayRequirements && this.game.checkResources(this.displayRequirements)
		))
			this.reveal()

		if (this.value != this.oldValue) {
			if (this.onChanged)
				this.onChanged()
			
			for (let dependant of this.dependants)
				this.game.updatesPlanned.add(dependant)
		}

		this.updateDisplays(false)
		
		this.oldValue = this.value
	}
	
	addDisplay(display) {
		this.displays.add(display)
		
		if (this.onAddDisplay)
			this.onAddDisplay(display)
	}
	
	removeDisplay(display) {
		this.displays.delete(display)
	}
	
	reveal(forced) {
		if (this.seen && !forced)
			return
		
		this.seen = true

		for (let dependant of this.dependants) {
			if (dependant.onRevealDependency) 
				dependant.onRevealDependency(this)
		}
		
		this.updateDisplays(true)		
	}
	
	updateDisplays(forced) {
		for (let display of this.displays)
			if (forced || display.styles || this.value != this.oldValue || this.changeSpeed != this.oldChange) {
				if (display.updateTooltip && this.value != this.oldValue)
					display.shouldUpdateTooltip = true
				this.game.gui.updatesPlanned.add(display)
			}
	}
}

class Stat extends GameObject {
	constructor (...data) {
		super(...data)
	}
}

class Resource extends GameObject {
	constructor (...data) {
		super(...data)
		this.addSavable("value", this.value)
	}

	add(value = 1, allowNegative = false) {
		if (!value) 
			return
		
		this.value += value
		
		if (this.value < 0 && !allowNegative) 
			this.value = 0
		
		if (value && this.onChange)
			this.onChange()

		this.game.updatesPlanned.add(this)
		
		return this.value
	}

	set(value = 0) {
		return this.add(value - this.value)
	}
}

class GameAction extends Resource {
	constructor (...data) {
		super({
			leveled : true,
		}, ...data)
		this.displayString = this.displayString || (x => x?x.toString():"")
		this.canAfford = false
		this.active = false
		this.bought = false
		this.calculateCosts()
		
		if (this.duration) {
			this.addSavable("timeLeft", 0)
		}
	}
	
	onRevealDependency(resource) {
		if (this.calculatedCost && this.calculatedCost[resource.name] || this.calculatedRequirements && this.calculatedRequirements[resource.name])
			for (let display of this.displays) {
				display.highlight("updated")
			}
	}
	
	calculateCosts() {
		this.calculatedCost = getCurrentCost(this.cost, this.value)
		this.calculatedRequirements = getCurrentCost(this.requirements, this.value)
		if (this.canAfford)
			this.canAfford = this.game.checkResources(this.calculatedCost) && this.game.checkResources(this.calculatedRequirements)
		
		this.game.updatesPlanned.add(this)
	}
	
	add(x) {
		super.add(x)
		this.bought = this.max && (this.value >= this.max)
		
		this.calculateCosts()			
	}
	
	update(forced) {
		if (this.seen || forced) {
			this.canAfford = this.game.checkResources(this.calculatedCost) && this.game.checkResources(this.calculatedRequirements)
		}
		super.update()
	}
	
	buy(free) {
		if (this.active || this.value >= this.max || this.bought)
			return false
		
		if (!free && (!this.seen || !this.canAfford))
			return false
		
		if (!free)
			this.game.checkResources(this.calculatedCost, true)
		
		this.add(1)
		
		if (this.action)
			this.action(this.dependencies, this.game)
		
		if (this.duration) {
			this.activate(this.duration)
		}
		
		return true
	}
	
	activate(time) {
		if (!time) 
			return
		
		this.active = true
		this.timeLeft = time
		this.game.activeData.add(this)

		for (let display of this.displays)
			if (display.animateProgress)
				display.animateProgress()
	}
	
	onAddDisplay(display) {
		if (this.duration && this.timeLeft && display.animateProgress)
			display.animateProgress()		
	}

	onLoad() {
		this.calculateCosts()

		if (this.duration && this.timeLeft > 0) {
			this.activate(this.timeLeft)
		}

		this.bought = (this.max && this.value >= this.max)
	}
}

class Achievement extends GameAction {
	update() {
		super.update()
		if (this.canAfford) {
			if (this.buy()) {
				while (this.buy())
					
				this.game.gui.notify("achievement", `${this.displayName} ${(this.max && this.max > 1)?this.value:""}`, this.displayHint)
				if (this.bought) {
					for (let display of this.displays)
						display.animateBuy()
				}
			}
		}
	}
}

class Timer {
	constructor (...data) {
		this.value = 0
		Object.assign(this, ...data)
	}
	
	tick(x, boost = 1) {
		this.value += x * (this.boostable ? boost : 1)
	}
	
	reset() {
		this.value = 0
	}
}

class GlobalStat extends Stat {}
class GlobalResource extends Resource {}
class GlobalUpgrade extends GameAction {}
