class Building extends GameAction {
	constructor (...data) {
		super(...data)
		this.addSavable("baseProduction", this.baseProduction || 1)
		this.addSavable("superValue", this.superValue || 1)
		this.production = 0
	}
		
	update() {
		if (this.place && this.game.data.betterMath.value) {
			this.superValue = this.dependencies[this.place].superValue * this.dependencies[this.place].value || 1
		} else
			this.superValue = 1
		
		this.production = this.baseProduction * this.value * this.superValue
		super.update()
	}
}

class GameCore {
	constructor(...data) {
		Object.assign(this,...data)
		this.expandTimer = 0
		this.black = false
	}
	
	advance (time) {
		this.game.data.gold.add(game.data.income.value * time / 1000)
		
		document.body.classList.toggle("black", this.game.data.finalAchievement.value)

		this.expandTimer += this.game.data.expansion.value * time
		let expandTimerMax = 1000 - 990 * this.game.data.explosiveGrowth.value
		while (this.expandTimer > expandTimerMax) {
			this.expandTimer -= expandTimerMax
			for (let resource of Object.values(this.game.data)) {
				if (resource instanceof Building) {
					if (this.game.data.improbability.value && resource.place)
							resource.value += resource.dependencies[resource.place].value ** 0.75
					
					if (this.game.data.finishLine.value && resource.superValue)
						resource.value += resource.superValue
					
					if (resource.value && Math.random() < 0.75) {
						if (this.game.data.speedOfLight.value)
							resource.add(100 + Math.random() * 1000 | 0)
						
						resource.buy(true)
						break
					}
				}
			}
		}
	}
}