"""
Encyclopedia system for Star Trader.

Provides in-game documentation and reference information about goods,
factions, ships, modules, production, exploration, ranks, and game mechanics.
"""

from .game_data import (GOODS, ILLEGAL_GOODS, FACTIONS, FACTION_RANKS, 
                       SHIP_CLASSES, MODULE_SPECS, PRODUCTION_RECIPES)
from .constants import (TRADING_SHIP_BONUS_PER_LEVEL, FLEE_BASE_CHANCE,
                       FLEE_PILOTING_MULTIPLIER, BOARDING_BASE_CHANCE,
                       BOARDING_HULL_THRESHOLD, BOARDING_MORALE_EFFECT,
                       BOARDING_LEADERSHIP_EFFECT, REPUTATION_DISCOUNT_THRESHOLD,
                       REPUTATION_PENALTY_THRESHOLD, REPUTATION_PENALTY_MULTIPLIER,
                       RANK_BENEFITS, VICTORY_WEALTH_GOAL, VICTORY_FLEET_GOAL,
                       VICTORY_FACTORY_GOAL, VICTORY_REPUTATION_GOAL,
                       VICTORY_CREW_GOAL, VICTORY_CREW_EXP_GOAL)


class Encyclopedia:
    """Handles all encyclopedia-related functionality."""
    
    def __init__(self):
        """Initialize the encyclopedia system."""
        self.topics = {
            "goods": self.show_goods,
            "factions": self.show_factions,
            "ships": self.show_ships,
            "modules": self.show_modules,
            "production": self.show_production,
            "exploration": self.show_exploration,
            "ranks": self.show_ranks,
            "mechanics": self.show_mechanics
        }
    
    def show_help(self):
        """Show available encyclopedia topics."""
        print("\n--- ENCYCLOPEDIA ---")
        print("Available topics:")
        print("  goods [name]      - Information about trade goods")
        print("  factions [name]   - Details about major factions")
        print("  ships [class]     - Starship specifications")
        print("  modules [type]    - Ship module details")
        print("  production [good] - Production chain information")
        print("  exploration       - Deep space exploration guide")
        print("  ranks             - Faction rank progression")
        print("  mechanics         - Game mechanics and formulas")
        print("\nExample: encyclopedia goods food")
    
    def handle_query(self, parts):
        """Handle encyclopedia query."""
        if len(parts) < 2:
            self.show_help()
            return
        
        topic = parts[1].lower()
        if topic not in self.topics:
            print(f"Unknown topic: {topic}")
            self.show_help()
            return
        
        # Call the appropriate handler with remaining parts
        self.topics[topic](parts[2:] if len(parts) > 2 else [])
    
    def show_goods(self, parts):
        """Show information about trade goods."""
        if not parts:
            # List all goods
            print("\n--- TRADE GOODS ---")
            print("\nLegal Goods:")
            for good in sorted(GOODS.keys()):
                if good not in ILLEGAL_GOODS:
                    print(f"  {good}")
            
            print("\nIllegal Goods:")
            for good in sorted(ILLEGAL_GOODS.keys()):
                print(f"  {good} (ILLEGAL)")
            
            print("\nUse 'encyclopedia goods <name>' for details.")
            return
        
        # Show specific good
        good_name = " ".join(parts).title()
        
        if good_name in GOODS:
            good_data = GOODS[good_name]
            print(f"\n--- {good_name.upper()} ---")
            print(f"Base Price: {good_data['base_price']} credits")
            print(f"Category: Legal trade good")
            
            # Economy modifiers
            if good_name == "Food":
                print("\nEconomy Modifiers:")
                print("  Agricultural: -50% (cheap)")
                print("  Industrial: +100% (expensive)")
                print("  Balanced: Normal price")
                print("\nFood is essential for all colonies. Agricultural")
                print("worlds produce surplus, while industrial worlds")
                print("must import their food supply.")
            elif good_name == "Minerals":
                print("\nEconomy Modifiers:")
                print("  Mining: -40% (cheap)")
                print("  Industrial: +20% (moderate demand)")
                print("  Other: Normal price")
                print("\nRaw minerals are the foundation of industry.")
                print("Mining colonies extract them cheaply.")
            elif good_name == "Machinery":
                print("\nEconomy Modifiers:")
                print("  Industrial: -30% (cheap)")
                print("  Agricultural: +80% (expensive)")
                print("  Other: Normal price")
                print("\nIndustrial worlds manufacture machinery.")
                print("Agricultural colonies need imports.")
            elif good_name == "Electronics":
                print("\nEconomy Modifiers:")
                print("  Tech: -40% (cheap)")
                print("  Industrial: Normal price")
                print("  Other: +60% (expensive)")
                print("\nHigh-tech worlds specialize in electronics.")
                print("Less developed worlds pay premium prices.")
            elif good_name == "Luxury Goods":
                print("\nEconomy Modifiers:")
                print("  Balanced: -20% (produces variety)")
                print("  Industrial: +40% (workers want luxuries)")
                print("  Other: Normal price")
                print("\nLuxuries are in demand everywhere, especially")
                print("in harsh industrial environments.")
            
            # Check if used in production
            used_in = []
            for product, recipe in PRODUCTION_RECIPES.items():
                if good_name in recipe["inputs"]:
                    used_in.append(product)
            
            if used_in:
                print(f"\nUsed in production of: {', '.join(used_in)}")
            
            # Check if produced
            if good_name in PRODUCTION_RECIPES:
                recipe = PRODUCTION_RECIPES[good_name]
                inputs = [f"{amount} {good}" for good, amount in recipe["inputs"].items()]
                print(f"\nProduced from: {', '.join(inputs)}")
                print(f"Output: {recipe['output_quantity']} units")
                print(f"Time: {recipe['time']} days")
                
        elif good_name in ILLEGAL_GOODS:
            good_data = ILLEGAL_GOODS[good_name]
            print(f"\n--- {good_name.upper()} (ILLEGAL) ---")
            print(f"Base Price: {good_data['base_price']} credits")
            print(f"Category: Contraband")
            print("\n⚠️  WARNING: Trading illegal goods will:")
            print("  - Decrease Federation reputation (-5)")
            print("  - Risk customs inspection and fines")
            print("  - Increase wanted level if caught")
            print("\nBlack markets offer high profits but high risks.")
            print("Syndicate connections may help avoid scrutiny.")
            
            if good_name == "Weapons":
                print("\nMilitary-grade weapons are restricted.")
                print("High demand in conflict zones.")
            elif good_name == "Drugs":
                print("\nControlled substances banned in most systems.")
                print("Extremely profitable but dangerous to transport.")
            elif good_name == "Stolen Goods":
                print("\nFenced merchandise of dubious origin.")
                print("Prices vary wildly based on heat level.")
        else:
            print(f"Unknown good: {good_name}")
            print("Use 'encyclopedia goods' to see all goods.")
    
    def show_factions(self, parts):
        """Show information about factions."""
        if not parts:
            print("\n--- MAJOR FACTIONS ---")
            for faction in FACTIONS:
                if faction == "Federation":
                    print(f"\n{faction}:")
                    print("  The democratic government of core worlds")
                    print("  Values: Law, order, and free trade")
                    print("  Benefits: Trade discounts, better missions")
                elif faction == "Syndicate":
                    print(f"\n{faction}:")
                    print("  Loose criminal organization")
                    print("  Values: Profit above all else")
                    print("  Benefits: Black market access, smuggling")
                elif faction == "Independent":
                    print(f"\n{faction}:")
                    print("  Unaligned frontier colonies")
                    print("  Values: Freedom and self-reliance")
                    print("  Benefits: Neutral ground, no politics")
            
            print("\nUse 'encyclopedia factions <name>' for details.")
            return
        
        faction_name = " ".join(parts).title()
        if faction_name not in FACTIONS:
            print(f"Unknown faction: {faction_name}")
            return
        
        print(f"\n--- {faction_name.upper()} ---")
        
        if faction_name == "Federation":
            print("\nThe Galactic Federation maintains order across")
            print("civilized space through military patrols and")
            print("standardized trade regulations.")
            print("\nHeadquarters: Sol System")
            print("Government: Representative Democracy")
            print("Military: Federation Navy")
            print("\nReputation Benefits:")
            print("  - Reduced prices at Federation ports")
            print("  - Access to military-grade equipment")
            print("  - Protection from pirates")
            print("  - High-paying government contracts")
            
        elif faction_name == "Syndicate":
            print("\nThe Syndicate operates in the shadows, controlling")
            print("black markets and smuggling operations across")
            print("the frontier.")
            print("\nStructure: Decentralized crime families")
            print("Leadership: The Shadow Council")
            print("Operations: Smuggling, piracy, protection")
            print("\nReputation Benefits:")
            print("  - Black market access and discounts")
            print("  - Reduced customs inspections")
            print("  - Smuggling route information")
            print("  - Protection racket income")
            
        elif faction_name == "Independent":
            print("\nIndependent colonies value freedom above the")
            print("security of Federation law or Syndicate protection.")
            print("\nGovernment: Varies by colony")
            print("Philosophy: Self-determination")
            print("Trade: Open to all")
            print("\nNeutral Status:")
            print("  - No faction bonuses or penalties")
            print("  - Safe haven for all traders")
            print("  - Diverse market opportunities")
            print("  - No political entanglements")
        
        # Show rank progression
        if faction_name in FACTION_RANKS:
            print(f"\n{faction_name} Ranks:")
            for rank_data in FACTION_RANKS[faction_name]:
                print(f"  {rank_data['rank']:12} (Rep: {rank_data['min_rep']:4}+) - {rank_data['title']}")
    
    def show_ships(self, parts):
        """Show information about ship classes."""
        if not parts:
            print("\n--- STARSHIP CLASSES ---")
            print(f"{'Class':15} {'Cost':>8} {'Hull':>6} {'Fuel':>6} {'Cargo':>7} {'Crew':>6}")
            print("-" * 58)
            
            for ship_class, data in SHIP_CLASSES.items():
                if ship_class == "starter_ship":
                    class_name = "Starter"
                else:
                    class_name = ship_class.title()
                
                cost = "Free" if data["cost"] == 0 else str(data["cost"])
                print(f"{class_name:15} {cost:>8} {data['base_hull']:>6} "
                      f"{data['base_fuel']:>6} {data['base_cargo']:>7} "
                      f"{data['crew_quarters']:>6}")
            
            print("\nUse 'encyclopedia ships <class>' for details.")
            return
        
        ship_class = parts[0].lower()
        if ship_class == "starter":
            ship_class = "starter_ship"
        
        if ship_class not in SHIP_CLASSES:
            print(f"Unknown ship class: {ship_class}")
            return
        
        data = SHIP_CLASSES[ship_class]
        print(f"\n--- {data['name'].upper()} ---")
        print(f"Class: {ship_class.replace('_', ' ').title()}")
        print(f"Cost: {data['cost']:,} credits" if data['cost'] > 0 else "Cost: Starting vessel")
        print(f"\nSpecifications:")
        print(f"  Hull Strength: {data['base_hull']}")
        print(f"  Fuel Capacity: {data['base_fuel']}")
        print(f"  Cargo Capacity: {data['base_cargo']}")
        print(f"  Crew Quarters: {data['crew_quarters']}")
        
        print(f"\nModule Slots:")
        for slot_type, count in data['slots'].items():
            print(f"  {slot_type.replace('_', ' ').title()}: {count}")
        
        # Ship descriptions
        if ship_class == "starter_ship":
            print("\nThe trusty vessel every captain starts with.")
            print("Reliable but basic in every way. Most traders")
            print("upgrade as soon as they can afford it.")
        elif ship_class == "freighter":
            print("\nDesigned for maximum cargo capacity.")
            print("Slow and poorly armed, but profitable for")
            print("traders running safe routes.")
        elif ship_class == "fighter":
            print("\nBuilt for combat and pursuit.")
            print("Limited cargo space but excellent weapons")
            print("and maneuverability. Popular with bounty hunters.")
        elif ship_class == "explorer":
            print("\nLong-range vessel for deep space exploration.")
            print("Extended fuel capacity and balanced systems")
            print("make it ideal for discovering new systems.")
    
    def show_modules(self, parts):
        """Show information about ship modules."""
        if not parts:
            print("\n--- SHIP MODULES ---")
            for module_name, data in MODULE_SPECS.items():
                print(f"\n{module_name}:")
                print(f"  Price: {data['price']:,} credits")
                print(f"  Effect: {data['effect']}")
            
            print("\nModules are permanent upgrades that enhance")
            print("your ship's capabilities. Choose wisely!")
            return
        
        module_name = " ".join(parts).title()
        if module_name not in MODULE_SPECS:
            print(f"Unknown module: {module_name}")
            print("Use 'encyclopedia modules' to see all modules.")
            return
        
        data = MODULE_SPECS[module_name]
        print(f"\n--- {module_name.upper()} ---")
        print(f"Price: {data['price']:,} credits")
        print(f"Effect: {data['effect']}")
        print(f"Type: {data['type'].title()}")
        
        # Detailed descriptions
        if module_name == "Cargo Expansion":
            print("\nIncreases your ship's cargo capacity by 20 units.")
            print("Essential for traders looking to maximize profits")
            print("on each run. More cargo means more profit!")
        elif module_name == "Shield Generator":
            print("\nAdds 10 points to your maximum shield strength.")
            print("Shields absorb damage before it reaches your hull.")
            print("Regenerates between combats.")
        elif module_name == "Fuel Tanks":
            print("\nExtends fuel capacity by 5 units.")
            print("Allows longer journeys without refueling.")
            print("Critical for exploration missions.")
        elif module_name == "Weapon Systems":
            print("\nIncreases weapon damage by 10 points.")
            print("More firepower means faster combat victories")
            print("and better chances against tough enemies.")
        elif module_name == "Engine Upgrade":
            print("\nImproves evasion by 5 points.")
            print("Better engines help dodge enemy fire")
            print("and escape from dangerous situations.")
        
        print("\nNote: Each module can only be installed once.")
        print("Modules can be sold back for 50% of purchase price.")
    
    def show_production(self, parts):
        """Show information about production chains."""
        if not parts:
            print("\n--- PRODUCTION CHAINS ---")
            print("\nFactories convert raw materials into refined goods:")
            
            for product, recipe in PRODUCTION_RECIPES.items():
                inputs = [f"{amt} {good}" for good, amt in recipe["inputs"].items()]
                print(f"\n{product}:")
                print(f"  Inputs: {', '.join(inputs)}")
                print(f"  Output: {recipe['output_quantity']} units")
                print(f"  Time: {recipe['time']} days")
                print(f"  Economy: {recipe['required_economy']}")
            
            print("\nUse 'encyclopedia production <good>' for details.")
            return
        
        product_name = " ".join(parts).title()
        if product_name not in PRODUCTION_RECIPES:
            print(f"{product_name} is not a manufactured good.")
            return
        
        recipe = PRODUCTION_RECIPES[product_name]
        print(f"\n--- {product_name.upper()} PRODUCTION ---")
        print(f"Required Economy Type: {recipe['required_economy']}")
        print(f"Production Time: {recipe['time']} days")
        print(f"\nInputs Required:")
        for good, amount in recipe["inputs"].items():
            print(f"  {good}: {amount} units")
        print(f"\nOutput: {recipe['output_quantity']} units of {product_name}")
        
        # Calculate profitability
        input_cost = sum(GOODS.get(good, ILLEGAL_GOODS.get(good, {})).get("base_price", 0) * amt 
                        for good, amt in recipe["inputs"].items())
        output_value = GOODS.get(product_name, {}).get("base_price", 0) * recipe["output_quantity"]
        profit = output_value - input_cost
        
        print(f"\nBase Profitability:")
        print(f"  Input Cost: {input_cost} credits")
        print(f"  Output Value: {output_value} credits")
        print(f"  Profit Margin: {profit} credits ({profit/input_cost*100:.1f}%)")
        
        print(f"\nFactory Efficiency:")
        print(f"  Level 1: 100% output")
        print(f"  Level 2: 120% output")
        print(f"  Level 3: 140% output")
        print(f"  Level 4: 160% output")
        print(f"  Level 5: 180% output")
    
    def show_exploration(self):
        """Show exploration guide."""
        print("\n--- DEEP SPACE EXPLORATION ---")
        print("\nBeyond known space lie uncharted systems waiting")
        print("to be discovered. Exploration is dangerous but")
        print("can lead to incredible rewards.")
        
        print("\n-- How to Explore --")
        print("1. Travel to any system")
        print("2. Use 'explore' command (costs 20 fuel)")
        print("3. Your ship will scan nearby space")
        print("4. May discover:")
        print("   - New star systems")
        print("   - Derelict ships")
        print("   - Ancient artifacts")
        print("   - Resource caches")
        print("   - Space hazards")
        
        print("\n-- Discovery Chances --")
        print("Base chance: 30%")
        print("Modifiers:")
        print("  +10% in frontier systems")
        print("  +15% with Explorer ship class")
        print("  +5% per 10 exploration experience")
        print("  -20% if system was recently explored")
        
        print("\n-- Uncharted Systems --")
        print("Discovered systems start with:")
        print("  - Random economy type")
        print("  - Basic market (limited goods)")
        print("  - No missions initially")
        print("  - Possible special features:")
        print("    * Ancient ruins")
        print("    * Resource deposits")
        print("    * Pirate havens")
        print("    * Alien artifacts")
        
        print("\n-- Exploration Events --")
        print("Debris Field: Salvage opportunity")
        print("Distress Signal: Rescue or ambush?")
        print("Cosmic Anomaly: Scientific discovery")
        print("Rogue Asteroid: Mineral wealth")
        print("Ghost Ship: Abandoned vessel")
        print("Artifact: Mysterious technology")
        
        print("\n-- Tips --")
        print("- Carry extra fuel for extended exploration")
        print("- Explorer ships have the best range")
        print("- High reputation opens unique discoveries")
        print("- Some artifacts unlock special abilities")
        print("- Map your discoveries for trade routes")
    
    def show_ranks(self):
        """Show faction rank progression."""
        print("\n--- FACTION RANKS ---")
        print("\nReputation with factions unlocks ranks and benefits.")
        print("Gain reputation through trade, missions, and combat.")
        
        for faction in ["Federation", "Syndicate"]:
            print(f"\n-- {faction} Ranks --")
            if faction not in FACTION_RANKS:
                continue
                
            for rank_data in FACTION_RANKS[faction]:
                rep_req = rank_data['min_rep']
                print(f"\n{rank_data['rank']} (Reputation: {rep_req}+)")
                print(f"Title: {rank_data['title']}")
                
                # Show benefits based on rank
                if faction == "Federation":
                    if rank_data['rank'] == "Recruit":
                        print("Benefits: 5% trade discount")
                    elif rank_data['rank'] == "Ensign":
                        print("Benefits: 10% discount, exclusive missions")
                    elif rank_data['rank'] == "Lieutenant":
                        print("Benefits: 15% discount, 10% shipyard discount")
                    elif rank_data['rank'] == "Commander":
                        print("Benefits: 20% discount, 15% shipyard, 1.5x mission rewards")
                    elif rank_data['rank'] == "Captain":
                        print("Benefits: 25% discount, 20% shipyard, 2x missions, special ships")
                    elif rank_data['rank'] == "Admiral":
                        print("Benefits: 30% discount, 25% shipyard, 2.5x missions, immunity")
                        
                elif faction == "Syndicate":
                    if rank_data['rank'] == "Associate":
                        print("Benefits: Black market access, 10% contraband discount")
                    elif rank_data['rank'] == "Operative":
                        print("Benefits: 20% black market discount, reduced scrutiny")
                    elif rank_data['rank'] == "Enforcer":
                        print("Benefits: 30% discount, intimidation bonus")
                    elif rank_data['rank'] == "Lieutenant":
                        print("Benefits: 40% discount, protection racket")
                    elif rank_data['rank'] == "Boss":
                        print("Benefits: 50% discount, smuggling routes")
                    elif rank_data['rank'] == "Kingpin":
                        print("Benefits: 60% discount, crime network, near immunity")
        
        print("\n-- Losing Reputation --")
        print("- Trading illegal goods: -5 Federation")
        print("- Failing missions: -2x mission reputation")
        print("- Attacking faction ships: -10 to -25")
        print("- Being caught smuggling: -15 Federation")
    
    def show_mechanics(self):
        """Show game mechanics and formulas."""
        print("\n--- GAME MECHANICS ---")
        
        print("\n-- Trading --")
        print("Base prices modified by:")
        print("  - System economy type (±20-100%)")
        print("  - Supply and demand (±5% per 10 units)")
        print("  - Random events (±10-50%)")
        print("  - Your reputation (see ranks)")
        print(f"\nTrading ship bonus: {TRADING_SHIP_BONUS_PER_LEVEL*100:.0f}% per level")
        print("Negotiation skill: 1% discount per skill point")
        print("Negotiator crew: Varies by skill level")
        
        print("\n-- Combat --")
        print("Turn order: Based on ship speed")
        print("Hit chance: 70% base + modifiers")
        print("Damage: Weapon power + officer bonus")
        print("Shields: Absorb 100% damage until depleted")
        print(f"\nFlee chance: {FLEE_BASE_CHANCE*100:.0f}% + piloting skill (max +{FLEE_PILOTING_MULTIPLIER*100:.0f}%)")
        print(f"Boarding: Requires target <{BOARDING_HULL_THRESHOLD*100:.0f}% hull")
        print(f"Board success: {BOARDING_BASE_CHANCE*100:.0f}% base")
        print(f"  +Morale bonus (up to {BOARDING_MORALE_EFFECT*100:.0f}%)")
        print(f"  +Leadership (up to {BOARDING_LEADERSHIP_EFFECT*100:.0f}%)")
        
        print("\n-- Reputation Effects --")
        print(f"Discount threshold: {REPUTATION_DISCOUNT_THRESHOLD} reputation")
        print(f"Penalty threshold: {REPUTATION_PENALTY_THRESHOLD} reputation")
        print(f"Penalty amount: {REPUTATION_PENALTY_MULTIPLIER*100:.0f}% worse prices")
        
        print("\n-- Victory Conditions --")
        print(f"Economic: {VICTORY_WEALTH_GOAL:,} credits")
        print(f"Trade Empire: {VICTORY_FLEET_GOAL} ships + {VICTORY_FACTORY_GOAL} factories")
        print(f"Political: {VICTORY_REPUTATION_GOAL} reputation with all factions")
        print(f"Explorer: Visit all systems + discover all uncharted")
        print(f"Personal: {VICTORY_CREW_GOAL} veteran crew (>{VICTORY_CREW_EXP_GOAL} exp each)")
        
        print("\n-- Daily Costs --")
        print("Crew salaries: Varies by role and skill")
        print("Factory operations: 50 credits × level")
        print("Ship maintenance: Free (included in repairs)")
        print("Docking fees: Free (good for gameplay)")