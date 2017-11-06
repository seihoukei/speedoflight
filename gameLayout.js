class MainTab extends Tab {
	constructor (...data) {
		super (...data)
		
		this.addGold = new StoreDisplay({
			game : this.game,
			container : this.dvDisplay,
			className : "button gold",
			resource : "addGold"
		})

		this.resources = new MultiDisplay({
			game : this.game,
			container : this.dvDisplay,
			className : "resources",
			resourceList : ["gold","income"],
		})
		
		this.buildings = new MultiDisplay({
			game : this.game,			
			container : this.dvDisplay,
			resourceList : [Building],
			displayClass : StoreDisplay,
			className : "buildings shop",
			elementClass : "button",
			elementShowAnimation : {
				animation : [{
					transform : 'translate(100vw,0)'
				},{
					transform : 'translate(0,0)'
				}], 
				time : 1000
			}
		})

		this.upgrades = new MultiDisplay({
			game : this.game,
			container : this.dvDisplay,
			resourceList : [GlobalUpgrade],
			displayClass : StoreDisplay,
			className : "upgrades shop",
			elementClass : "button",
			elementShowAnimation : {
				animation : [{
					transform : 'translate(0,100vh)'
				},{
					transform : 'translate(0,0)'
				}], 
				time : 1000
			}			
		})
		
		this.dvDisplay.appendChild(this.dvThanks = createElement("div",{class:"thanks"}))
		this.dvThanks.appendChild(createElement("div",{},"Game by seihoukei"))
		this.dvThanks.appendChild(createElement("div",{},"Thanks for wasting your time!"))
	}
}