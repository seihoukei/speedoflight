"use strict"

class Gui {
	constructor (...data) {
		Object.assign(this, ...data)
		if (!this.container) 
			this.container = document.body
		
		this.dvDisplay = createElement("div", {class : this.className?this.className:"game-main"})
		
		this.container.appendChild(this.dvDisplay)
		
		for (let elementData of this.elementData) {
			if (!elementData.name || this[elementData.name]) 
				continue
			
			if (elementData.data) {
				if (!elementData.data.name)
					elementData.data.name = elementData.name
			}
			
			this[elementData.name] = new elementData.class (elementData.data, {
				game : this.game,
				gui : this,
				container : this.dvDisplay,
				parent : this
			})
		}

		this.canUpdate = false
		this.active = false
		this.updatesPlanned = new Set()
	}
	
	update(forced) {
		if (!this.canUpdate && !forced)
			return false
		
		while (this.updatesPlanned.size) {
			for (let display of this.updatesPlanned) {
				display.update()
				this.updatesPlanned.delete(display)
			}
		}
		
		this.canUpdate = false
		return true
	}
		
	destroy() {
		this.dvDisplay.remove()
		delete this.dvDisplay
	}
}

// ------------------------------------------------------------------------------------
// Menu
// ------------------------------------------------------------------------------------
class Menu {
	constructor (...data) {
		Object.assign(this, ...data)
		
		this.dvDisplay = createElement("div", {class : "game-menu"})
		this.dvButton = createElement("div", {class : "game-menu-button"}, "☰")
		
		let itemsData = this.items
		this.items = []
		
		for (let itemData of itemsData) {
			let item = new itemData.class({
				menu : this
			}, itemData.data)
			item.container = this.dvDisplay
			this.dvDisplay.appendChild(item.dvDisplay)
			this.items.push(item)
		}
		
		this.dvButton.onmouseenter = (event) => {
			this.dvDisplay.style.right = `0`
			this.dvDisplay.style.bottom = `7.5vmin`
			this.dvDisplay.classList.remove("hidden")
		}

		this.container.appendChild(this.dvButton)
		this.container.appendChild(this.dvDisplay)
	}
}

class MenuItem {
	constructor (...data) {
		Object.assign(this, ...data)
		this.dvDisplay = createElement("div", {class : `game-menu-item ${this.items?"nest":""}`})
		this.dvDisplay.appendChild(this.dvName = createElement("div", {class : `game-menu-item-name ${this.items?"nest":""}`}, `${this.displayName}`))
				
		if (this.items) {
			this.dvDisplay.appendChild(this.dvNest = createElement("div", {class : `game-menu`}))
			
			let itemsData = this.items
			this.items = []
		
			for (let itemData of itemsData) {
				let item = new itemData.class({
					menu : this.menu
				}, itemData.data)
				this.dvNest.appendChild(item.dvDisplay)
				item.container = this.dvNest
				this.items.push(item)
			}
			
			this.dvDisplay.onmouseenter = (event) => {
				this.dvNest.style.right = `${this.container.offsetWidth}px`
				this.dvNest.style.bottom = `0`
				for (let item of this.items) {
					if (item.displayString)
						item.dvDisplayInfo.textContent = `${item.displayString()}`
				}
			}
		} else {
			if (this.action)
				this.dvDisplay.onclick = (event) => {
					this.action()
					this.menu.dvDisplay.classList.add("hidden")
				}
		}
	}
}

class MenuSlotItem extends MenuItem {
	constructor(...data) {
		super (...data)		
		this.displayString = (save = localStorage[`${gameData.gameId}_${this.saveSlot}`]) => (save?JSON.parse(decompressSave(save)).timeString:"empty")
		this.dvDisplay.appendChild(this.dvDisplayInfo = createElement("div",{class : `game-menu-item-info`}, this.displayString()))
	}
}

class MenuSaveSlot extends MenuSlotItem {
	action() {
		game.save(this.saveSlot)
	}
}

class MenuLoadSlot extends MenuSlotItem {
	action() {
		game.load(this.saveSlot)
	}
}

// ------------------------------------------------------------------------------------
// Notifications
// ------------------------------------------------------------------------------------
class Notifications {
	constructor (...data) {
		Object.assign (this, ...data)
		this.container.appendChild(this.dvDisplay = createElement("div", {class : `notifications`}))
		this.notifications = new Set()
		if (this.parent) {
			this.parent.notify = (...data) => this.notify(...data)
		}
	}
	
	notify (subClass = "", header = "", text = "") {
		this.notifications.add (new Notification({
			subClass, header, text,
			container : this.dvDisplay,
			parent : this,
			game : this.game
		}))
		if (this.notifications.size > this.max) {
			[...this.notifications.values()].shift().hide()
		}
	}
	
	clear() {
		for (let notification of this.notifications)
			notification.hide()
	}
}

class Notification {
	constructor (...data) {
		Object.assign (this, ...data)

		this.container.appendChild(this.dvDisplay = createElement("div", {class : `notification ${this.subClass}`}))
		this.dvDisplay.appendChild(this.dvLetter = createElement("div", {class : `letter`}, this.header.slice(0,1)))
		this.dvDisplay.appendChild(this.dvHeader = createElement("div", {class : `header`}, this.header))
		this.dvDisplay.appendChild(this.dvText = createElement("div", {class : `text`}, this.text))
		this.dvDisplay.onclick = (event) => {
			this.hide()
		}
		let siblings = new Set()
		
		if (!this.game.offline && !document.hidden) {
			let last = [...this.parent.notifications].slice(-1)[0]
			if (last) {
				last.dvDisplay.animate([{
					marginBottom : "1vmin"
				},{
					marginBottom : "1vmin",
					offset : 0.95
				},{
					marginBottom : "5vmin"
				}], 5000)
			}
			this.dvDisplay.animate ([{
				position : "absolute",
				bottom : 0,
				left : "100vw",
				width : "65vmin",
				maxHeight : "50vmin",
				color : "transparent"
			}, {
				position : "absolute",
				bottom : 0,
				left : "calc(50vw - 32.5vmin)",
				width : "65vmin",
				maxHeight : "50vmin",
				color : "white",
				offset : 0.1
			}, {
				position : "absolute",
				bottom : 0,
				left : "calc(50vw - 32.5vmin)",
				width : "65vmin",
				maxHeight : "50vmin",
				color : "white",
				offset : 0.8
			}, {
				position : "absolute",
				bottom : 0,
				left : "0",
				width : "3vmin",
				maxHeight : "3vmin",
				color : "transparent"
			}], 5000)
			this.dvLetter.animate([{
				height : 0,
				opacity : 0
			},{
				height : 0,
				opacity : 0,
				offset : 0.95
			},{
				opacity : 1,
				height : "3vmin"
			}], 5000)
		}
	}
	
	hide() {
		this.parent.notifications.delete(this)
		this.dvDisplay.onclick = () => {}
		if (!this.game.offline && !document.hidden) {
			this.dvDisplay.animate([{
				opacity : 1,
				maxHeight : getComputedStyle(this.dvDisplay).maxHeight,
				marginBottom : "1vmin"
			},{
				opacity : 0,
				maxHeight : 0,
				marginBottom : "0vmin"
			}], 500)
			setTimeout(() => {
				this.container.removeChild(this.dvDisplay)
				delete this.dvDisplay
			}, 500)
		} else {
				this.container.removeChild(this.dvDisplay)
				delete this.dvDisplay
		}
	}
}

// ------------------------------------------------------------------------------------
// Tooltip
// ------------------------------------------------------------------------------------
class Tooltip {
	constructor (...data) {
		Object.assign(this, ...data)
		this.container.appendChild(this.dvDisplay = createElement("div", {class : `tooltip hidden`}))
		this.shown = false
		this.timeOut = 0
		this.elements = []
		this.posX = 0
		this.posY = 0
	}	
	
	build (data) {
//		this.hide()
		this.destroy()
		
//		console.log(data)
		for (let elementData of data) {
			let element = new elementData.class(elementData, {
				container : this.dvDisplay,
				game : this.game
			})
			this.elements.push(element)
		}
//		this.show()
	}
	
	target (x,y) {
		if (this.timeOut)
			clearTimeout(this.timeOut)

		this.posX = x
		this.posY = y
		if (!this.shown)
			this.timeOut = setTimeout(() => {
				this.show()
			}, 500)
	}
	
	moveTo (x, y) {
		let w = this.dvDisplay.offsetWidth
		let h = this.dvDisplay.offsetHeight
		let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
		let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
		
		//x = x * (width - w) / width
		x = (x < width - w - 10 ? x + 5 : x - (w + 5))
		y = (y < height / 2 ? y + 5 : y - (h + 5))
				
		x = Math.max(0,Math.min(x, width-w))
		y = Math.max(0,Math.min(y, height-h))
		
		this.dvDisplay.style.left = `${x}px`
		this.dvDisplay.style.top = `${y}px`
	}
	
	hide() {
		this.shown = false
		this.dvDisplay.classList.add("hidden")
		if (this.timeOut)
			clearTimeout(this.timeOut)
	}
	
	show() {
		this.shown = true
		this.dvDisplay.classList.remove("hidden")
		this.moveTo(this.posX, this.posY)
	}
	
	destroy() {
//		this.hide()
		this.resource = null
		let element
		while (element = this.elements.pop()) {
			element.destroy()
		}
	}
}

class TextFragment {
	constructor (...data) {
		Object.assign(this, ...data)
		this.container.appendChild(this.dvDisplay = createElement("div", {class : this.className || `text`}, this.text))
	}
	
	destroy() {
		this.dvDisplay.remove()
	}
}
// ------------------------------------------------------------------------------------
// Tabs and dialogs
// ------------------------------------------------------------------------------------

class Tabs {
	constructor (...data) {
		Object.assign(this, ...data)
		this.tabs = new Map()

		this.dvDisplay = createElement("div", {class : `${this.className || "tab-holder"} ${this.name?this.name:""}`})
		
		if (this.container) {
			this.container.appendChild(this.dvDisplay)
			
			if (this.autoClose)
				this.container.addEventListener("click", (event) => {
					if (this.openingTab) {
						this.openingTab = false
						return
					}
					
					if (this.activeTab && !this.activeTab.dvDisplay.contains(event.target))
						this.hideAll()
				})
		}
		
		if (this.tabData) 
			for (let tabData of this.tabData) {
				this.tabs.set(tabData.name, new (tabData.class || this.tabClass || Tab) (tabData, {
					parent : this,
					container : this.dvDisplay,
					gui : this.gui,
					game : this.game
				}))
			}
	}
	
	show(name, animated = true) {
		this.hideAll(animated)
		
		let tab = this.tabs.get(name)
		
		if (tab) {
			this.activeTab = tab
			tab.show(animated)
		}
	}
	
	hideAll(animated = true) {
		if (!this.activeTab) 
			return
		
		this.activeTab.hide(animated)
		
		delete this.activeTab
	}
	
	buttonFor(name, data) {
		let tab = this.tabs.get(name)
		if (!tab) {
			console.log(`Could not create button for ${name}`)
			return
		}
		
		return tab.makeButton(data)		
	}
}

class TabButton {
	constructor(...data) {
		this.seen = false
		Object.assign(this, ...data)
		
		this.dvDisplay = createElement("div", {class : `${this.className ? this.className : "tab-button"} ${this.tab && this.tab.active?"active":""} ${this.seen?"":"hidden"} ${this.tab.name}`}, this.text?this.text:this.tab.displayName)
		
		if(this.container)
			this.container.appendChild(this.dvDisplay)
	}
	
	reveal (forced) {
		if (this.seen && !forced) 
			return
		
		this.seen = true
		this.dvDisplay.classList.remove("hidden")
		if (this.moveObject)
			this.moveObject.classList.add("moved")
	}
	
	highlight (name, action) {
		this.dvDisplay.addEventListener("mouseenter", action)
		this.dvDisplay.classList.add(name)
	}
	
	resetHighlight (name, action) {
		this.dvDisplay.removeEventListener("mouseenter", action)
		this.dvDisplay.classList.remove(name)
	}
}

class Tab {
	constructor (...data) {
		this.active = false

		Object.assign(this, ...data)

		this.dvDisplay = createElement("div", {class : `${this.className || "tab"} ${this.name?this.name:""} hidden`})
		
		if (!this.container && this.parent)
			this.container = this.parent.dvDisplay || this.parent.container
		
		if (this.container) {
			this.container.appendChild(this.dvDisplay)
		}
		
		this.displayButtons = new Set()
		
		if (this.active)
			this.show(false)
	}
	
	show(animated = true) {
		if (this.parent) {
			if (this.parent.activeTab) 
				this.parent.hideAll(animated)
			
			this.parent.activeTab = this
			this.parent.openingTab = true
		}
		
		this.active = true
		this.dvDisplay.classList.remove("hidden")
		
		if (animated && this.parent && this.parent.showAnimation)
			makeAnimation(this.dvDisplay, this.parent.showAnimation)
		
		for (let button of this.displayButtons)
			button.dvDisplay.classList.add("active")
	}
	
	hide(animated = true) {
		this.active = false
		
		if (animated && this.parent && this.parent.hideAnimation) {
			makeAnimation(this.dvDisplay, this.parent.hideAnimation).onfinish = (event) => {
				if (!this.active)
					this.dvDisplay.classList.add("hidden")
			}	
		} else
			this.dvDisplay.classList.add("hidden")

		for (let button of this.displayButtons)
			button.dvDisplay.classList.remove("active")
	}
	
	switch() {
		if (this.active) {
			if (!this.parent || this.parent.allowNone) 
				this.hide()
		} else
			this.show()
	}
	
	makeButton(data = {}) {
		let button = new TabButton({tab : this}, data)
		
		button.dvDisplay.onclick = (event) => { 
			this.switch() 
		}
		
		this.displayButtons.add(button)
		
		if (this.seen)
			button.reveal(true)
		
		return button		
	}
}

class Dialog extends Tab {
	constructor(...data) {
		super(...data)
		this.dvDisplay.appendChild(this.dvTitleBar = createElement("div", {class : "dialog-title-bar"}))
		this.dvTitleBar.appendChild(this.dvTitle = createElement("div", {class : "dialog-title"}, this.displayName))
		this.dvTitleBar.appendChild(this.dvClose = createElement("div", {class : "dialog-close"}, "╳"))
		
		this.dvClose.onclick = (event) => { 
			this.hide() 
		}
	}
}

// ------------------------------------------------------------------------------------
// Displays
// ------------------------------------------------------------------------------------
class ResourceDisplay {
	constructor(...data) {
		this.forced = false
		
		Object.assign(this, ...data)
		
		if (typeof this.resource == "string") 
			this.resource = this.game.data[this.resource]
		
		if (!this.resource) {
			console.log("Unknown resource for display", ...data)
			return
		}
		
		this.initDisplay()
					
		this.dvDisplay = createElement("div", {class : `${this.className?this.className:"display"} ${this.resource.name} ${this.resource.seen?"":this.forced?"unknown":"hidden"}`})
		if (!this.noName && this.displayName)
			this.dvDisplay.appendChild(this.dvName = createElement("div", {class : "name"}, this.resource.seen?this.displayName:this.forced?"unknown":this.displayName))
		this.dvDisplay.appendChild(this.dvValue = createElement("div", {class : "value"}, this.resource.seen?this.displayString(this.resource.value):""))

		if (this.showChange)
			this.dvDisplay.appendChild(this.dvChange = createElement("div", {class : "change"}, this.resource.seen?this.displayString(this.resource.changeSpeed):""))

		this.resource.addDisplay(this)
		
		this.seen = this.resource.seen
		
		if (this.container)
			this.container.appendChild(this.dvDisplay)
	}
	
	initDisplay() {
		this.displayName = this.displayName || this.resource.displayName || this.resource.name
		this.displayString = this.displayString || this.resource.displayString
	}

	update() {
		if (!this.resource.seen)
			return
		
		if (!this.seen) {
			this.reveal()
		}
		
		if (this.styles)
			for (let style of this.styles) {
				this.dvDisplay.classList.toggle(style.name, style.func(this.resource.dependencies))
			}

		this.dvValue.textContent = this.displayString(this.resource.value)

		if (this.showChange) {
			let changeSpeed = this.resource.changeSpeed
			this.dvChange.classList.toggle("positive", changeSpeed > 0)
			this.dvChange.classList.toggle("negative", changeSpeed < 0)
			this.dvChange.textContent = `(${changeSpeed > 0?"+":""}${this.displayString(changeSpeed)}/s)`
		}
		
		this.seen = this.resource.seen
		
		if (this.progressAnimation && this.resource.duration) {
			if (this.resource.timeLeft) {
				this.progressAnimation.playbackRate = this.game.boost
				this.progressAnimation.currentTime = this.resource.duration - this.resource.timeLeft
			} else {
				this.progressAnimation.cancel()
				delete this.progressAnimation
			}
		}
	}
	
	highlight(name) {
		let action = (event) => {
			this.dvDisplay.classList.remove(name)
			this.dvDisplay.removeEventListener("mouseenter", action)
		}
		this.dvDisplay.classList.add(name)
		this.dvDisplay.addEventListener("mouseenter", action)
		
	}
	
	reveal(forced) {
		if (this.seen && !forced)
			return 
		
		if (this.multiDisplay && !this.multiDisplay.seen)
				this.multiDisplay.show()
		
		if (this.onReveal)
			this.onReveal()
		
		this.dvDisplay.classList.remove("unknown")
		this.dvDisplay.classList.remove("hidden")
		if (this.showAnimation)
			makeAnimation(this.dvDisplay,this.showAnimation)
		
		if (this.dvName)
			this.dvName.textContent = this.displayName
	}
	
	destroy() {
		this.dvDisplay.remove()
		
		this.resource.removeDisplay(this)
	}
}

class StoreDisplay extends ResourceDisplay {
	constructor(...data) {
		super(...data)

		if (this.resource.duration) {
			this.dvDisplay.insertBefore(this.dvProgress = createElement("div",{class : `progress`}), this.dvDisplay.firstChild)
		}

		if (this.resource.max == 1)
			this.dvValue.classList.add("hidden")
		
		if (this.resource.bought)
			this.dvDisplay.classList.add("bought")
		
		if (this.resource.target)
			this.dvDisplay.classList.add(this.resource.target)
		
		this.dvDisplay.onmouseenter = (event) => {
			this.updateTooltip(true)
		}
		
		this.dvDisplay.onmousemove = (event) => {
			this.game.gui.tooltip.target(event.clientX, event.clientY)
		}
		
		this.dvDisplay.onmouseout = (event) => {
			this.game.gui.tooltip.hide()
			this.game.gui.tooltip.destroy()
		}
		
		this.dvDisplay.onclick = (event) => {
			if (this.resource.buy()) {
				this.animateBuy()
				this.shouldUpdateTooltip = true
			}
		}
		
		if (this.resource.seen)
			this.reveal()
	}
	
	updateTooltip(forced) {
		
		if (!forced && this.game.gui.tooltip.resource != this.resource)
			return
		
		this.shouldUpdateTooltip = false
		
		let tooltipData = [{
			class : TextFragment,
			className : "title",
			text : this.displayName
		},{
			class : TextFragment,
			className : "obtained",
			text : this.resource.displayObtained?this.resource.displayObtained(this.resource.value):``
		}]
		
		if (this.resource.displayHint) tooltipData.push({
			class : TextFragment,
			className : "description",
			text : this.resource.displayHint				
		})
		
		if (this.resource.info) {
			for (let [name, info] of Object.entries(this.resource.info)) {
				if (this.resource.bought && info.boughtHide)
					continue
				
				tooltipData.push({
					class : InfoDisplay,
					className : "info",
					resource : this.resource,
					info : name,
					infoValues : this.resource.infoValues
				})
			}
		}
				
		if (!this.resource.bought) {
			if (this.resource.calculatedRequirements && Object.entries(this.resource.calculatedRequirements).length) tooltipData.push({
				class : MultiCost,
				className : "section",
				title : "Requirements",
				used : false,
				resources : this.resource.calculatedRequirements			
			})
			if (this.resource.calculatedCost && Object.entries(this.resource.calculatedCost).length) tooltipData.push({
				class : MultiCost,
				className : "section",
				title : "Cost",
				used : true,
				resources : this.resource.calculatedCost			
			})
		}
		
		this.game.gui.tooltip.build(tooltipData)
		this.game.gui.tooltip.resource = this.resource
	}
	
	update(forced) {
		super.update(forced)
		if (this.shouldUpdateTooltip) {
			this.updateTooltip()
		}
	}
	
	onReveal() {
		this.highlight("new")
		
		if (this.store) {
			this.container.appendChild(this.dvDisplay)
			this.store.highlight("updated")
			this.store.reveal()
		}
	}
	
	animateBuy() {
		if (this.store)
			this.store.prepareAnimation(this)
		
		if (this.resource.bought) {
			this.dvDisplay.classList.add("bought")
		}

		if (this.store)
			this.store.animateBuy(this, this.resource.bought)
	}

	
	animateProgress() {
		if (!this.resource.duration || !this.dvProgress) 
			return
		
		this.progressAnimation = this.dvProgress.animate([{
			width : "100%"
		},{
			width : "0%"
		}], this.resource.duration)
		
		if (this.game)
			this.progressAnimation.playbackRate = this.game.boost
		this.progressAnimation.currentTime = this.resource.duration - this.resource.timeLeft
	}
}

class InfoDisplay extends ResourceDisplay {
	initDisplay() {
		this.infoData = this.resource.info[this.info]
		this.value = this.infoValues[this.info]
		this.displayName = this.infoData.displayName || this.info
		this.displayString = x => (this.infoData.displayString ? this.infoData.displayString(this.value) : this.value)
	}
}

class CostDisplay extends ResourceDisplay {
	constructor (...data) {
		super(...data)
		this.value = this.value || 1
		this.displayString = x => this.resource.displayString(this.value)
		this.dvDisplay.appendChild(this.dvPercent = createElement("div", {class : "percent"}))
		
		this.update()
	}
	
	updatePercentage() {
		if (!this.resource.seen || this.resource.leveled) {
			this.percentText = ""
			return
		}
		
		if (this.value > this.resource.value) {
			this.percentText = `(have ${(100 * this.resource.value / this.value).toFixed(1)}%)`
			return
		}
		
		this.percentText = this.used?`(uses ${(100 * this.value / this.resource.value).toFixed(1)}%)`:``
	}
	
	update() {
		super.update()
		
		this.updatePercentage()
		this.dvPercent.textContent = this.percentText
	}
}

class MultiCost {
	constructor (...data) {
		Object.assign(this, ...data)
		
		this.dvDisplay = createElement("div", {class : `${this.className?this.className:"holder"} ${this.name || ""}`})
		if (this.title)
			this.dvDisplay.appendChild(this.dvTitle = createElement("div", {class : `title`}, this.title))
		
		this.displays = new Set()
		
		for (let [name, value] of Object.entries(this.resources)) {
			let resource = this.game.data[name]
			if (!resource) {
				console.log("Can't display "+name, data)
				continue
			}
			
			let display = new CostDisplay ({
				container : this.dvDisplay,
				resource : resource,
				used : this.used,
				styles : [{
					name : "expensive",
					func : x => x.self.value < value
				}],
				forced : true,
				value
			})
			
			this.displays.add(display)
		}
		
		if (this.container)
			this.container.appendChild(this.dvDisplay)
	}
	
	destroy() {
		for (let display of this.displays)
			display.destroy()
		
		this.dvDisplay.remove()
	}
}

class MultiDisplay {
	constructor(...data) {
		Object.assign(this, ...data)

		this.dvDisplay = createElement("div", {class : `${this.className?this.className:"holder"} ${this.name || ""}`})
		this.displays = new Set()
		
		this.seen = false
		
		let resources = []
		
		for (let name of this.resourceList) {
			if (typeof name == "string") {
				resources.push(this.game.data[name])
				continue
			}
			
			for (let resource of Object.values(this.game.data))
				if (resource instanceof name)
					resources.push(resource)
		}
		
		for (let resource of resources) {			
			if (resource.seen)
				this.seen = true
			
			let display = new (this.displayClass || ResourceDisplay) ({
				container : this.dvDisplay,
				game : this.game,
				resource : resource,
				className : this.elementClass,
				showAnimation : this.elementShowAnimation,
				showChange : this.showChange,
				multiDisplay : this
			})
			
			this.displays.add(display)
		}
		
		if (!this.seen)
			this.dvDisplay.classList.add("hidden")

		if (this.container)
			this.container.appendChild(this.dvDisplay)
	}
	
	show() {
		if (this.seen) return
		
		this.seen = true
		this.dvDisplay.classList.remove("hidden")
		if (this.showAnimation)
			makeAnimation(this.dvDisplay, this.showAnimation)
	}
	
	destroy() {
		for (let display of this.displays)
			display.destroy()
		
		this.dvDisplay.remove()
	}
}

// ------------------------------------------------------------------------------------
// Specific dialogs
// ------------------------------------------------------------------------------------
class ImportDialog extends Dialog {
	constructor (...data) {
		super(...data)
		
		this.dvDisplay.appendChild(this.taText = createElement("textarea", {class : `import-area`}))
		this.dvDisplay.appendChild(this.dvButtons = createElement("div", {class : `buttons`}))
		this.dvButtons.appendChild(this.dvDecode = createElement("div", {class : `button`}, "Transcode"))
		this.dvButtons.appendChild(this.dvExport = createElement("div", {class : `button`}, "Export ▲"))
		this.dvButtons.appendChild(this.dvImport = createElement("div", {class : `button`}, "Import ▼"))	
		
		this.dvDecode.onclick = (event) => {
			try {
			if (this.taText.value.slice(-1) == "}")
				this.taText.value = btoa(compressSave(JSON.stringify(JSON.parse(this.taText.value))))
			else
				this.taText.value = JSON.stringify(JSON.parse(decompressSave(atob(this.taText.value))), null, 2)
			} catch(e) {
				console.log("Invalid data")
			}
		}
		
		this.dvExport.onclick = (event) => {
			this.game.save("exportData")
			this.taText.value = localStorage[`${this.game.id}_exportData`]
		}

		this.dvImport.onclick = (event) => {
			localStorage[`${this.game.id}_importData`] = this.taText.value
			this.game.load("importData")
			this.hide()
		}
	}
}

class BuyDialog extends Dialog {
	constructor (...data) {
		super(...data)
		this.dvDisplay.appendChild(this.dvStores = createElement("div", {class : `stores`}))
		this.dvStores.appendChild(this.dvStore = createElement("div", {class : `store`}))
		this.dvStores.appendChild(this.dvBought = createElement("div", {class : `store bought`}))
		
		this.items = new Set()
		
		for (let resource of Object.values(this.game.data)) {
			if (resource.class == this.buyClass) {
				if (resource.seen)
					this.seen = true
								
				let display = new StoreDisplay({
					container : resource.bought?this.dvBought:this.dvStore,
					store : this,
					game : this.game,
					styles : resource.bought?null:[{
						name : "unavailable",
						func : x => !x.self.canAfford
					}],
					showAnimation: {
						animation : [{
							backgroundColor : "rgba(0,0,0,255)",
							maxHeight : 0,
							opacity : 0
						},{
							backgroundColor : "rgba(255,255,0,1)",
							maxHeight : "5vmin",
							opacity : 0.4
						},{
							backgroundColor : Symbol.for("calculate"),
							maxHeight : "10vmin",
							opacity : 1
						}],
						time : 500
					},
					resource
				})
				
				this.items.add(display)
			}
		}
		
		if (this.seen) 
			this.reveal(true)
	}
	
	highlight(name) {
		if (this.active) 
			return
		
		let action = (event) => {
			for (let button of this.displayButtons)
				button.resetHighlight(name, action)
		}
		for (let button of this.displayButtons)
			button.highlight(name, action)
	}
	
	reveal(forced) {
		if (this.seen && !forced) 
			return
		
		this.seen = true
		this.highlight("new")
		
		for (let button of this.displayButtons) {
			button.reveal(forced)
		}
	}
	
	prepareAnimation (element) {
		this.animationData = {}
		for (let item of this.items) {
			let data = {
				x : item.dvDisplay.offsetLeft,
				y : item.dvDisplay.offsetTop
			}
			if (item == element)
				data.style = getComputedStyle(item.dvDisplay)
			this.animationData[item.resource.name] = data
		}
	}
	
	animateBuy(element, bought) {
		if (bought) {
			element.container = this.dvBought
			this.dvBought.appendChild(element.dvDisplay)
		}
		
		if (!this.animationData)
			return
		
		if (this.game.offline || document.hidden)
			return

		for (let item of this.items) {
			let data = this.animationData[item.resource.name]
			if (!data) continue
			if (item != element) {
				item.dvDisplay.animate([{
					transform : `translate(${data.x - item.dvDisplay.offsetLeft}px,${data.y - item.dvDisplay.offsetTop}px)`
				},{
					transform : `translate(0,0)`
				}],200)
			}
		}
		let data = this.animationData[element.resource.name]
		
		let startLeft = data.x - element.dvDisplay.offsetLeft
		let startTop = data.y - element.dvDisplay.offsetTop
		
		let startColor = data.style.backgroundColor
		let endColor = getComputedStyle(this.dvDisplay).backgroundColor
		let tempColor = "gold"

		let startTransform = `translate(${startLeft}px,${startTop}px) scale(1,1)`
		let tempTransform = `translate(${startLeft}px,${startTop}px) scale(2,2)`
		
		element.dvDisplay.animate([{
			transform: startTransform,
			backgroundColor: startColor,
			color: "white",
			zIndex : 25,
		},{
			transform: tempTransform,
			backgroundColor: tempColor,
			color: "black",
			zIndex : 25,
		},{
			transform: tempTransform,
			backgroundColor: endColor,
			color: "white",
			zIndex : 25,
		},{
			transform:`translate(0,0) scale(1,1)`,
			backgroundColor:endColor,
			color : "white",
			zIndex : 25,			
		}], 1000)
	}
}

class SettingsDialog extends Dialog {
	constructor (...data) {
		super(...data)
		this.groups = {}
		for (let setting of gameData.settings) {
			let group = this.groups[setting.group]
			if (!group) {
				group = {
					name : setting.group,
					settings : []
				}
				this.groups[setting.group] = group
			}
			group.settings.push(setting)
		}
		
		this.dvDisplay.appendChild(this.dvGroups = createElement("div", {class : `groups`}))
		
		this.groupTabs = new Tabs({
			container : this.dvDisplay,
			tabClass : Tab,
			tabData : Object.values(this.groups).map((x,n) => ({
				name : x.name,
				displayName : x.name,
				seen : true,
				active : !n,
			})),
			showAnimation : {
				animation : [{
					transform : "scale(0,1)",
					transformOrigin : "right",
					position : "absolute"
				},{
					transform : "scale(1,1)",
					transformOrigin : "right",
					position : "absolute"
				}],
				time : 250
			},
			hideAnimation : {
				animation : [{
					transform : "scale(1,1)",
					transformOrigin : "left",
					position : "absolute"
				},{
					transform : "scale(0,1)",
					transformOrigin : "left",
					position : "absolute"
				}],
				time : 250
			}		
		})
		
		for (let [name, tab] of this.groupTabs.tabs) {
			tab.makeButton({
				container : this.dvGroups
			})
			
			for (let setting of this.groups[name].settings) {
				let display = createElement("div", {class : `switch`})
				tab.dvDisplay.appendChild(display)
				display.appendChild(createElement("div", {class : `name`}, setting.displayName))
				let choices = createElement("div", {class : `choices`})
				display.appendChild(choices)
				for (let choice of setting.choices) {
					let button = createElement("div", {class : `choice ${settings[setting.name] == choice.value?"chosen":""} ${setting.default == choice.value?"default":""}`}, choice.text || choice.value)
					choices.appendChild(button)
					button.onclick = (event) => {
						settings[setting.name] = choice.value
						if (setting.onChange)
							setting.onChange(choice.value)
						localStorage.settings = JSON.stringify(settings)
						for (let node of [...button.parentElement.childNodes])
							node.classList.toggle("chosen", node == button)
					}
				}
			}
		}
	}
}