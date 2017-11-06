"use strict"

var gameData

;(() => {
	
	// Basic reveal functions
	
	function always() {
		return x => true
	}
	
	function moreThan(value) {
		return x => x.self.value > value
	}
	
	function lessThan(value) {
		return x => x.self.value < value
	}
	
	function notEqual(value) {
		return x => x.self.value != value
	}
	
	// Basic display functions
	
	function empty() {
		return x => ""
	}
	function normal(digits, units = "", minimum) {
		return x => `${displayNumber(x,digits,units,minimum)}`
	}
	
	function percent(digits) {
		return x => `${displayNumber(x*100,digits,"",1)}%`
	}
	
	gameData = {
		gameId : "speedoflight",
		
		guiData : {
			elementData : [{
				name : "dialogs",
				class : Tabs,
				allowNone : true,
				data : {
					autoClose : true,
					tabClass : Dialog,
					tabData: [{
						name: "settings",
						displayName : "Settings",
						class : SettingsDialog
					}, {
						name: "plan",
						displayName : "Plan"
					}, {
						name: "about",
						displayName : "Generator Idle"
					}, {
						name: "achievements",
						displayName : "Achievements",
						class : BuyDialog,
						buyClass : Achievement
					}, {
						name: "import",
						class: ImportDialog,
						displayName : "Import / export game"
					}],
					showAnimation: {
						animation : [{
							transform : "scale(0,0)"
						},{
							transform : "scale(1,1)"
						}],
						time : 300
					},
					hideAnimation: {
						animation : [{
							transform : "scale(1,1)"
						},{
							transform : "scale(0,0)"
						}],
						time : 300
					},
				}
			},{
				name : "tabs",
				class : Tabs,
				data : {
					tabClass : Tab,
					tabData: [{
						name : "mainTab",
						displayName : "Main screen",
						class : MainTab,
					}],
					showAnimation: {
						animation : [{
							left : "100vw"
						},{
							left : "0"
						}],
						time : 250
					},
					hideAnimation: {
						animation : [{
							left : "0"
						},{
							left : "-100vw"
						}],
						time : 250
					}
				}
			},{
				name : "menu",
				class : Menu,
				data : {
					items: [{
						class : MenuItem,
						data : {
							displayName : "About game",
							action : () => {
								game.gui.dialogs.show("about")
							}
						}
					},{					
						class : MenuItem,
						data : {
							displayName : "Achievements",
							action : () => {
								game.gui.dialogs.show("achievements")
							}
						}
					},{					
						class : MenuItem,
						data : {
							displayName : "Import / export game",
							action : () => {
								game.gui.dialogs.show("import")
							}
						}
					},{					
						class : MenuItem,
						data : {
							displayName : "Save game",
							items : [{
								class : MenuSaveSlot,
								data : {
									displayName : "Autosave",
									saveSlot : "autoSave"
								}
							}, {
								class : MenuSaveSlot,
								data : {
									displayName : "Save 1",
									saveSlot : "saveData1"
								}
							}, {
								class : MenuSaveSlot,
								data : {
									displayName : "Save 2",
									saveSlot : "saveData2"
								}
							}, {
								class : MenuSaveSlot,
								data : {
									displayName : "Save 3",
									saveSlot : "saveData3"
								}
							}, {
								class : MenuSaveSlot,
								data : {
									displayName : "Save 4",
									saveSlot : "saveData4"
								}
							}, {
								class : MenuSaveSlot,
								data : {
									displayName : "Save 5",
									saveSlot : "saveData5"
								}
							}]
						}
					},{					
						class : MenuItem,
						data : {
							displayName : "Load game",
							items : [{
								class : MenuLoadSlot,
								data : {
									displayName : "Autosave",
									saveSlot : "autoSave"
								}
							}, {
								class : MenuLoadSlot,
								data : {
									displayName : "Save 1",
									saveSlot : "saveData1"
								}
							}, {
								class : MenuLoadSlot,
								data : {
									displayName : "Save 2",
									saveSlot : "saveData2"
								}
							}, {
								class : MenuLoadSlot,
								data : {
									displayName : "Save 3",
									saveSlot : "saveData3"
								}
							}, {
								class : MenuLoadSlot,
								data : {
									displayName : "Save 4",
									saveSlot : "saveData4"
								}
							}, {
								class : MenuLoadSlot,
								data : {
									displayName : "Save 5",
									saveSlot : "saveData5"
								}
							}]
						}
					},{					
						class : MenuItem,
						data : {
							displayName : "Reset game",
							action : () => {
								game.reset()
							}
						}
					},{					
						class : MenuItem,
						data : {
							displayName : "Settings",
							action : () => {
								game.gui.dialogs.show("settings")
							}
						}
					}]
				}
			},{
				name : "notifications",
				class : Notifications,
				data : {
					max : 10
				}
			},{
				name : "tooltip",
				class : Tooltip,
				data : {
				}
			}]
		}, 
		
		settings : [{
			name : "numberFormat",
			group : "Numbers",
			displayName : "Short number format",
			default : 0,
			choices : [{
				text : "Natural",
				value : 0
			}, {
				text : "Scientific",
				value : 1
			}, {
				text : "Engineering",
				value : 2
			}]
		}, {
			name : "numberDelimiter",
			group : "Numbers",
			displayName : "Scientific number display",
			default : 0,
			choices : [{
				text : "1.23e6",
				value : 0
			},{
				text : "1.23e+6",
				value : 1
			},{
				text : "1.23×10⁶",
				value : 2
			}]
		}, {
			name : "numberMax",
			group : "Numbers",
			displayName : "Upper bound for full numbers",
			default : 1000,
			choices : [{
				value : 10
			},{
				value : 1000
			},{
				value : 1000000
			},{
				value : 10000000
			}]
		}, {
			name : "numberMin",
			group : "Numbers",
			displayName : "Lower bound for full numbers",
			default : 0.01,
			choices : [{
				value : 1
			},{
				value : 0.1
			},{
				value : 0.01
			},{
				value : 0.001
			}]
		}, {
			name : "numberPrecision",
			group : "Numbers",
			displayName : "Precision of short numbers",
			default : 2,
			choices : [{
				text : "12M",
				value : 0
			},{
				text : "12.3M",
				value : 1
			},{
				text : "12.34M",
				value : 2
			},{
				text : "12.345M",
				value : 3
			}]
		}, {
			name : "targetGameFPS",
			group : "Performance",
			displayName : "Game processing speed (target data FPS)",
			default : 60,
			choices : [{
				value : 10
			},{
				value : 20
			},{
				value : 30
			},{
				value : 45
			},{
				value : 60
			}],
			onChange : (value) => {
				game.setTargetFPS(value)
				worker.postMessage({
					name : "setFPS",
					value
				})
			}
		}, {
			name : "targetGuiFPS",
			group : "Performance",
			displayName : "Display refresh speed (target UI FPS)",
			default : 20,
			choices : [{
				value : 5
			},{
				value : 10
			},{
				value : 20
			},{
				value : 30
			},{
				value : 45
			},{
				value : 60
			}]
		}],
		
		
		resources : [{
			
		// Post-offline boost  internal resources
			class : GlobalResource,
			name : "offlinium",
			displayName : "Offlinium",
			displayString : normal(2,"",1),
		},{
			class : GlobalStat,
			name : "offliniumPower",
			displayName : "Offlinium speed boost",
			displayString : x => `×${x}`,
			displayRequirement : moreThan(2),
			dependencies : ["offliniumLevel", "offlinium"],
			valueFunction : x => x.offlinium.value ? 2 ** (x.offliniumLevel.value + 1) : 1,
			value : 2
		},{
			class : GlobalStat,
			name : "offliniumRate",
			displayName : "Offlinium production rate",
			displayString : x => `${normal(3)(x)}/s`,
			displayRequirement : moreThan(0),
			dependencies : ["offliniumProduction", "offlinium"],
			valueFunction : x => x.offliniumProduction.value?(2 ** (x.offliniumProduction.value - 3)):0,
			value : 0.125
		},{
			class : GlobalUpgrade,
			name : "offliniumLevel",
			displayName : "Offlinium level",
			displayHint : "Each level doubles effect of offlinium",
			displayRequirements : {
				offlinium : 1000
			},
			cost : {
				offlinium : {
					baseValue : 1000,
					multiplier : 2
				}
			},
			max : 4
		},{
			class : GlobalUpgrade,
			name : "offliniumProduction",
			displayName : "Offlinium production",
			displayHint : "Each level doubles offlinium gained per second offline",
			displayRequirements : {
				offlinium : 500
			},
			cost : {
				offlinium : {
					baseValue : 500,
					multiplier : 2
				}
			},
			max : 4

		// Your resources start here
		},{
			class : GlobalResource,
			name : "gold",
			displayName : "Gold",
			displayString : normal(0),
			displayRequirement : always(),
		
		}, {
			class : GameAction,
			name : "addGold",
			displayName : "Quick! Click this!",
			displayHint : "We don't have much time! And time is money! Someone smart said that!",
			displayString : empty(),
			displayObtained : x => `You clicked ${x} times!`,
			displayRequirement : always(),
			action : (x, game) => {
				game.data.gold.add(1)
			}

		}, {
			class : Building,
			name : "house",
			displayName : "House",
			displayHint : "Probably if we build a house somebody will come to click for us!",
			baseProduction : 1,
			place : "city",
			dependencies : ["city"],
			displayRequirements : {
				gold : 5
			},
			cost : {
				gold : {
					base : 10,
					multiplier : 1.1
				}
			}
		}, {
			class : Building,
			name : "city",
			displayName : "City",
			displayHint : "We are in a hurry, so let's just build a city already",
			baseProduction : 10,
			place : "planet",
			dependencies : ["planet"],
			displayRequirements : {
				gold : 100
			},
			cost : {
				gold : {
					base : 400,
					multiplier : 1.1
				}
			}
		}, {
			class : Building,
			name : "planet",
			displayName : "Planet",
			displayHint : "The hurry is real, so planets are what we make next",
			baseProduction : 1000,
			place : "galaxy",
			dependencies : ["galaxy"],
			displayRequirements : {
				gold : 3000
			},
			cost : {
				gold : {
					base : 10000,
					multiplier : 1.1
				}
			}
		}, {
			class : Building,
			name : "galaxy",
			displayName : "Galaxy",
			displayHint : "We don't waste time on a little things, time for a HUGE boost",
			baseProduction : 1000000,
			place : "universe",
			dependencies : ["universe"],
			displayRequirements : {
				gold : 2e7
			},
			cost : {
				gold : {
					base : 2e8,
					multiplier : 1.1
				}
			}
		}, {
			class : Building,
			name : "universe",
			displayName : "Universe",
			displayHint : "The world is not enough!!",
			target : "big",
			baseProduction : 1e25,
			displayRequirements : {
				gold : 1e25
			},
			cost : {
				gold : {
					base : 1e26,
					multiplier : 1.1
				}
			}
		
		}, {
			class : GlobalStat,
			name : "income",
			displayName : "Income",
			displayString : normal(0),
			displayRequirement : always(),
			dependencies : [Building, "betterMath"],
			valueFunction : x => {
				let result = 0
				for (let building of x.Building)
					result += building.production
				return result
			}
		}, {
			class : GlobalUpgrade,
			name : "betterMath",
			displayName : "Better math",
			displayHint : "We've figured out why we are so slow, THE MATH IS WRONG! Houses are in the cities, cities are on the planets, it all MAKES SENSE now!",
			displayString : normal(0),
			displayRequirements : {
				gold : 1e6
			},
			cost : {
				gold : 1e7
			},
			max : 1
		}, {
			class : GlobalUpgrade,
			name : "expansion",
			displayName : "Expansion",
			displayHint : "The light spreads at insane speed, so we should spread too!",
			displayString : normal(0),
			displayRequirements : {
				gold : 2e7
			},
			cost : {
				gold : 1e8
			},
			max : 1
		}, {
			class : GlobalUpgrade,
			name : "explosiveGrowth",
			displayName : "Explosive growth",
			displayHint : "Explosions are fast, be like explosions!",
			displayString : normal(0),
			displayRequirements : {
				gold : 1e9,
				expansion : 1
			},
			cost : {
				gold : 1e10
			},
			max : 1
		}, {
			class : GlobalUpgrade,
			name : "speedOfLight",
			displayName : "Speed of light",
			displayHint : "We are almost there!",
			displayString : normal(0),
			displayRequirements : {
				gold : 1e16,
				explosiveGrowth : 1
			},
			cost : {
				gold : 1e17
			},
			max : 1
		}, {
			class : GlobalUpgrade,
			name : "improbability",
			displayName : "Improbability",
			displayHint : "How are gold and speed even related? I forgot!",
			displayString : normal(0),
			displayRequirements : {
				gold : 1e33,
				speedOfLight : 1
			},
			cost : {
				gold : 1e34,
				universe : 100000,
				galaxy : 500000,
				planet : 3000000,
				city : 10000000,
				house : 30000000
			},
			max : 1
		}, {
			class : GlobalUpgrade,
			name : "finishLine",
			displayName : "Finish line",
			displayHint : "Just the final stretch left!",
			displayString : normal(0),
			displayRequirements : {
				achievement5 : 1,
				speedOfLight : 1
			},
			cost : {
				gold : 1e45,
			},
			max : 1
			
		//And a pair of achievements
		},{
			class : Achievement,
			name : "achievement1",
			displayName : "Well that's a start",
			displayHint : "Hopefully things will go faster from here!",
			requirements : {
				house : 1
			}
		},{
			class : Achievement,
			name : "achievement2",
			displayName : "Hoarder",
			displayHint : "We need MOAR moneyz and FAST!",
			requirements : {
				gold : {
					base : 10,
					multiplier : 10
				}
			},
			max : 50
		},{
			class : Achievement,
			name : "achievement3",
			displayName : "Little prince",
			displayHint : "Radical measures for radical hurry!",
			requirements : {
				planet : 1
			}
		},{
			class : Achievement,
			name : "achievement4",
			displayName : "Real incomes",
			displayHint : "We have so much time and so little money! We should have all the money by the time we have no time!",
			requirements : {
				income : {
					base : 5,
					multiplier : 5
				}
			},
			max : 70
		},{
			class : Achievement,
			name : "achievement5",
			displayName : "Almost there!",
			displayHint : "This is almost where we should get ASAP! ",
			requirements : {
				achievement2 : 50,
				achievement4 : 70
			},
		},{
			class : Achievement,
			name : "finalAchievement",
			displayName : "You did it",
			displayHint : "We are happy! Hope you enjoyed the trip!",
			displayRequirement : null,
			displayRequirements : {
				income : 1e100
			},
			requirements : {
				income : 1e100
			},
		}],
		
		templates : {
			Achievement : {
				displayRequirement : always(),
				displayString : normal(0),
				max : 1
			},
			Building : {
				info : {
					singleProduction : {
						displayName : "Production per unit",
						valueFunction : x => x.self.baseProduction * x.self.superValue,
						displayString : normal(0)
					},
					totalProduction : {
						displayName : "Current production",
						valueFunction : x => x.self.production,
						displayString : normal(0)
					}
				},
				displayString : normal(0),
				leveled : false
			}
		},	
	}
})()