import unittest
from unittest.mock import patch
import io
import sys
import os
import random
import signal

# Add the parent directory to the Python path to allow for local imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from startrader.main import Game
from startrader.galaxy import Galaxy
from startrader.classes import Ship, Player, Mission

class TimeoutError(Exception):
    pass

class TestStarTrader(unittest.TestCase):
    """Tests for the Star Trader game."""

    def timeout_handler(self, signum, frame):
        """Handles the timeout signal."""
        raise TimeoutError("Test timed out after 10 seconds")

    def setUp(self):
        """Set up a new Game instance for each test."""
        # Seeding random ensures that market prices are predictable for tests
        random.seed(42)
        self.game = Game()
        signal.signal(signal.SIGALRM, self.timeout_handler)
        signal.alarm(10) # 10 second timeout

    def tearDown(self):
        """Cancel the alarm after each test."""
        signal.alarm(0)

    def test_galaxy_creation(self):
        """Test that the galaxy and its systems are created correctly."""
        self.assertGreater(len(self.game.galaxy.systems), 4) # Should have more than the 4 core systems
        self.assertIn("Sol", self.game.galaxy.systems)
        self.assertIn("Vega", self.game.galaxy.systems)

    def test_market_prices(self):
        """Test that market prices reflect the economy type."""
        sol_market = self.game.galaxy.systems["Sol"].market
        agri_market = self.game.galaxy.systems["Alpha Centauri"].market
        ind_market = self.game.galaxy.systems["Sirius"].market

        # Food should be cheap at an agricultural world and expensive elsewhere
        self.assertLess(agri_market["Food"]["price"], sol_market["Food"]["price"])
        self.assertGreater(ind_market["Food"]["price"], agri_market["Food"]["price"])

        # Machinery should be cheap at an industrial world
        self.assertLess(ind_market["Machinery"]["price"], sol_market["Machinery"]["price"])

    def test_initial_player_state(self):
        """Test the player's starting conditions."""
        self.assertEqual(self.game.player.credits, 1000)
        self.assertEqual(self.game.player.location.name, "Sol")
        self.assertEqual(self.game.player.ship.get_cargo_used(), 0)

    def test_buy_valid(self):
        """Test a successful purchase."""
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        food_price = sol_market["Food"]["price"]
        
        # Command: buy food 10
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "food", "10"])

        self.assertEqual(self.game.player.credits, initial_credits - (food_price * 10))
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 10)

    def test_buy_insufficient_credits(self):
        """Test buying with not enough credits."""
        self.game.player.credits = 10 # Not enough for anything
        initial_cargo_size = self.game.player.ship.get_cargo_used()

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_buy(["buy", "food", "10"])
            self.assertIn("Not enough credits", fake_out.getvalue())
        
        self.assertEqual(self.game.player.ship.get_cargo_used(), initial_cargo_size)

    def test_sell_valid(self):
        """Test a successful sale."""
        # First, give the player something to sell
        self.game.player.ship.add_cargo("Minerals", 5)
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        minerals_price = sol_market["Minerals"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell(["sell", "minerals", "3"])

        self.assertEqual(self.game.player.credits, initial_credits + (minerals_price * 3))
        self.assertEqual(self.game.player.ship.cargo_hold["Minerals"], 2)

    def test_sell_more_than_owned(self):
        """Test selling more of a good than is in the cargo hold."""
        self.game.player.ship.add_cargo("Food", 5)
        initial_credits = self.game.player.credits

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_sell(["sell", "food", "10"])
            self.assertIn("You don't have 10 units of Food to sell", fake_out.getvalue())

        self.assertEqual(self.game.player.credits, initial_credits)
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 5)

    def test_travel_valid(self):
        """Test a valid trip between systems without events."""
        initial_fuel = self.game.player.ship.fuel
        fuel_cost = self.game.galaxy.fuel_costs[("Sol", "Sirius")]

        # Patch random.random to ensure no event fires during this test
        with patch('random.random', return_value=1.0):
            with patch('sys.stdout', new=io.StringIO()):
                self.game._handle_travel(["travel", "sirius"])

        self.assertEqual(self.game.player.location.name, "Sirius")
        self.assertEqual(self.game.player.ship.fuel, initial_fuel - fuel_cost)

    def test_travel_insufficient_fuel(self):
        """Test traveling without enough fuel."""
        self.game.player.ship.fuel = 0 # Not enough for any trip
        initial_location = self.game.player.location

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_travel(["travel", "sirius"])
            self.assertIn("Not enough fuel", fake_out.getvalue())

        self.assertEqual(self.game.player.location.name, initial_location.name)

    def test_travel_invalid_destination(self):
        """Test traveling to a non-existent system."""
        initial_location = self.game.player.location

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_travel(["travel", "betelgeuse"])
            self.assertIn("Unknown system", fake_out.getvalue())

        self.assertEqual(self.game.player.location.name, initial_location.name)

    def test_shipyard_upgrade(self):
        """Test a valid ship upgrade."""
        self.game.player.credits = 5000 # Ensure enough credits
        initial_credits = self.game.player.credits
        
        # First, remove the default weapon to make a free slot
        self.game.player.ship.modules["weapon"] = []
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_upgrade(["upgrade", "W-2"]) # Upgrade to Heavy Laser

        self.assertIn("W-2", self.game.player.ship.modules["weapon"])
        self.assertEqual(self.game.player.credits, initial_credits - 3500)
        self.assertGreater(self.game.player.ship.get_weapon_damage(self.game.player), 10)

    def test_shipyard_upgrade_no_slots(self):
        """Test that the player can't install a module if there are no free slots."""
        self.game.player.credits = 5000 # Ensure enough credits
        
        # The ship starts with a W-1 installed, and only has one weapon slot
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_upgrade(["upgrade", "W-2"])
            self.assertIn("All 'weapon' slots are currently in use.", fake_out.getvalue())
            
        self.assertNotIn("W-2", self.game.player.ship.modules["weapon"])

    def test_shipyard_repair(self):
        """Test repairing the ship."""
        self.game.player.ship.hull = 50
        self.game.player.credits = 1000
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_repair(None)
        
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)
        # 50 damage * 15 credits/hp = 750. 1000 - 750 = 250
        self.assertEqual(self.game.player.credits, 250)

    def test_event_pirates(self):
        """Test the pirate event, choosing to fight."""
        initial_credits = self.game.player.credits
        event_manager = self.game.event_manager
        
        # Rig the event to happen and be a pirate
        with patch('random.random', return_value=0.1):
            with patch('random.choice', return_value='pirate'):
                # Mock the input to always choose 'fight'
                with patch('builtins.input', return_value='fight'):
                    with patch('sys.stdout', new=io.StringIO()) as fake_out:
                        event_manager.trigger_event()
                        self.assertIn("You destroyed the", fake_out.getvalue())
        
        # Check that the player received salvage
        self.assertGreater(self.game.player.credits, initial_credits)

    def test_event_asteroid_field(self):
        """Test the asteroid field event."""
        initial_hull = self.game.player.ship.hull
        event_manager = self.game.event_manager
        
        with patch('random.random', return_value=0.1):
            with patch('random.choice', return_value='asteroid'):
                with patch('random.randint', return_value=10): # Force 10 damage
                     with patch('sys.stdout', new=io.StringIO()):
                        event_manager.trigger_event()

        self.assertEqual(self.game.player.ship.hull, initial_hull - 10)

    def test_price_fluctuation_on_buy(self):
        """Test that buying a good increases its price."""
        sol_market = self.game.galaxy.systems["Sol"].market
        initial_price = sol_market["Food"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "food", "20"])

        self.assertGreater(sol_market["Food"]["price"], initial_price)

    def test_price_fluctuation_on_sell(self):
        """Test that selling a good decreases its price."""
        # First, give the player something to sell
        self.game.player.ship.add_cargo("Minerals", 20)
        sol_market = self.game.galaxy.systems["Sol"].market
        initial_price = sol_market["Minerals"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell(["sell", "minerals", "20"])

        self.assertLess(sol_market["Minerals"]["price"], initial_price)

    def test_economic_event_famine(self):
        """Test the effect of a famine event on market prices."""
        # Trigger a famine in Sirius
        self.game.galaxy.active_events["Sirius"] = {"type": "famine", "duration": 5}
        sirius_market = self.game.galaxy.systems["Sirius"].market
        initial_price = sirius_market["Food"]["price"]
        
        # Update markets to apply event effects
        self.game.galaxy.update_markets()

        # Price of food in the famine system should be dramatically higher
        self.assertGreater(sirius_market["Food"]["price"], initial_price)

    def test_buy_multi_word_item(self):
        """Test buying an item with a space in its name."""
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        item_price = sol_market["Luxury Goods"]["price"]
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "luxury", "goods", "5"])

        self.assertEqual(self.game.player.credits, initial_credits - (item_price * 5))
        self.assertEqual(self.game.player.ship.cargo_hold["Luxury Goods"], 5)

    def test_faction_initialization(self):
        """Test that factions are assigned to systems and player reputation is initialized."""
        self.assertEqual(self.game.galaxy.systems["Sol"].faction, "Federation")
        self.assertEqual(self.game.galaxy.systems["Sirius"].faction, "Syndicate")
        self.assertIn("Federation", self.game.player.reputation)
        self.assertEqual(self.game.player.reputation["Federation"], 0)

    def test_reputation_gain_on_trade(self):
        """Test that buying or selling goods increases reputation with the local faction."""
        initial_rep = self.game.player.reputation["Federation"]
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "food", "1"])
        
        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + 1)

        initial_rep = self.game.player.reputation["Federation"]
        self.game.player.ship.add_cargo("Food", 1) # Need something to sell
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell(["sell", "food", "1"])

        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + 1)

    def test_reputation_discount_fuel(self):
        """Test that high reputation gives a fuel discount."""
        self.game.player.reputation["Federation"] = 100 # High rep
        
        fuel_cost_base = self.game.galaxy.fuel_costs[("Sol", "Sirius")]
        fuel_cost_discounted = int(fuel_cost_base * 0.9)

        # Travel from Sol (Federation)
        self.game.player.location = self.game.galaxy.systems["Sol"]
        
        with patch('random.random', return_value=1.0):
            with patch('sys.stdout', new=io.StringIO()) as fake_out:
                self.game._handle_travel(["travel", "sirius"])
                self.assertIn("discount on fuel", fake_out.getvalue())
        
        expected_fuel = self.game.player.ship.max_fuel - fuel_cost_discounted
        self.assertEqual(self.game.player.ship.fuel, expected_fuel)

    def test_reputation_discount_repair(self):
        """Test that high reputation gives a repair discount."""
        self.game.player.location = self.game.galaxy.systems["Sol"] # Shipyard is here
        self.game.player.reputation["Federation"] = 100 # High rep
        self.game.player.ship.hull = 80
        self.game.player.credits = 1000

        damage = self.game.player.ship.max_hull - self.game.player.ship.hull
        cost_base = damage * 15
        cost_discounted = int(cost_base * 0.9)

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_repair(None)

        self.assertEqual(self.game.player.credits, 1000 - cost_discounted)
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)

    def test_full_playthrough_scenario(self):
        """
        Runs a full playthrough scenario to test the game's flow and systems integration.
        This test is derived from the original playtest.py script.
        """
        # Use a specific seed to make the playthrough predictable
        random.seed(123)
        self.game = Game()

        # 1. Initial state check
        self.assertEqual(self.game.player.credits, 1000)
        self.assertEqual(self.game.player.location.name, "Sol")

        # 2. Buy food in Sol (Federation space)
        initial_rep = self.game.player.reputation["Federation"]
        food_price = self.game.galaxy.systems["Sol"].market["Food"]["price"]
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "food", "15"])
        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + 1)
        self.assertEqual(self.game.player.credits, 1000 - (food_price * 15))
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 15)

        # 3. Travel to Sirius (Syndicate space)
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_travel(["travel", "sirius"])
        self.assertEqual(self.game.player.location.name, "Sirius")

        # 4. Sell food in Sirius
        initial_rep_syndicate = self.game.player.reputation["Syndicate"]
        credits_before_sale = self.game.player.credits
        food_price_sirius = self.game.galaxy.systems["Sirius"].market["Food"]["price"]
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell(["sell", "food", "15"])
        self.assertEqual(self.game.player.reputation["Syndicate"], initial_rep_syndicate + 1)
        self.assertEqual(self.game.player.credits, credits_before_sale + (food_price_sirius * 15))
        self.assertEqual(self.game.player.ship.get_cargo_used(), 0)

        # 5. Travel back to Sol
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_travel(["travel", "sol"])
        self.assertEqual(self.game.player.location.name, "Sol")

        # 6. Test discounted repair
        self.game.player.ship.hull = 70
        self.game.player.reputation["Federation"] = 55 # Manually set high rep
        self.game.player.credits = 1000 # Reset credits for predictability
        
        damage = self.game.player.ship.max_hull - self.game.player.ship.hull
        expected_cost = int((damage * 15) * 0.9)

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_repair(None)
        
        self.assertEqual(self.game.player.credits, 1000 - expected_cost)
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)

        # 7. Test discounted fuel
        self.game.player.reputation["Federation"] = 55 # Ensure high rep
        fuel_cost_base = self.game.galaxy.fuel_costs[("Sol", "Alpha Centauri")]
        expected_fuel_cost = int(fuel_cost_base * 0.9)
        initial_fuel = self.game.player.ship.fuel

        with patch('random.random', return_value=1.0): # Prevent random events
            with patch('sys.stdout', new=io.StringIO()):
                self.game._handle_travel(["travel", "alpha", "centauri"])
        
        self.assertEqual(self.game.player.ship.fuel, initial_fuel - expected_fuel_cost)
        self.assertEqual(self.game.player.location.name, "Alpha Centauri")

    def test_mission_system(self):
        """Tests the full lifecycle of a mission: generation, acceptance, and completion."""
        # 1. Find a suitable non-bounty mission
        sol_system = self.game.galaxy.systems["Sol"]
        mission_to_accept = next((m for m in sol_system.available_missions if m.type != "BOUNTY"), None)
        self.assertIsNotNone(mission_to_accept, "Could not find a suitable DELIVER/PROCURE mission in Sol")

        # Give player plenty of fuel to avoid travel failure
        self.game.player.ship.fuel = 1000
        
        mission_id = mission_to_accept.id
        initial_cargo = self.game.player.ship.get_cargo_used()
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_accept(["accept", mission_id])
            
        self.assertIn(mission_to_accept, self.game.player.active_missions)
        self.assertNotIn(mission_to_accept, sol_system.available_missions)

        # 3. Prepare for completion
        if mission_to_accept.type == "PROCURE":
            self.game.player.ship.add_cargo(mission_to_accept.good, mission_to_accept.quantity)
        
        # 4. Travel to the destination
        destination_name = mission_to_accept.destination_system.name
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_travel(["travel"] + destination_name.lower().split())
        
        self.assertEqual(self.game.player.location.name, destination_name)
        
        # 5. Complete the mission
        initial_credits = self.game.player.credits
        initial_rep = self.game.player.reputation[mission_to_accept.faction]
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_complete(["complete", mission_id])
            self.assertIn("MISSION COMPLETE", fake_out.getvalue())
            
        self.assertEqual(len(self.game.player.active_missions), 0)
        self.assertEqual(self.game.player.credits, initial_credits + mission_to_accept.reward_credits)
        self.assertEqual(self.game.player.reputation[mission_to_accept.faction], initial_rep + mission_to_accept.reward_reputation)
        self.assertEqual(self.game.player.ship.get_cargo_used(), initial_cargo)

    def test_mission_types_and_failure(self):
        """Tests mission failure and the difference between DELIVER and PROCURE missions."""
        # Find or create a PROCURE mission
        self.game = Game()
        sol_system = self.game.galaxy.systems["Sol"]
        procure_mission = next((m for m in sol_system.available_missions if m.type == "PROCURE"), None)
        if not procure_mission:
            # If no procure mission was generated, create one for the test
            procure_mission = Mission(sol_system, self.game.galaxy.systems["Sirius"], "Federation", "Minerals", 10, "PROCURE")
            sol_system.available_missions.append(procure_mission)

        # 1. Test accepting a PROCURE mission (should not give cargo)
        initial_cargo = self.game.player.ship.get_cargo_used()
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_accept(["accept", procure_mission.id])
        self.assertEqual(self.game.player.ship.get_cargo_used(), initial_cargo)
        self.assertIn(procure_mission, self.game.player.active_missions)
        
        # 2. Test mission failure
        initial_rep = self.game.player.reputation[procure_mission.faction]
        # Manually expire the mission
        procure_mission.expiration_day = self.game.current_day -1
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._check_mission_failure()
            self.assertIn("MISSION FAILED", fake_out.getvalue())
            
        self.assertEqual(len(self.game.player.active_missions), 0)
        # Check for reputation penalty (2x the reward)
        self.assertEqual(self.game.player.reputation[procure_mission.faction], initial_rep - (procure_mission.reward_reputation * 2))

        # 3. Test accepting a DELIVER mission (should give cargo)
        deliver_mission = Mission(sol_system, self.game.galaxy.systems["Sirius"], "Federation", "Food", 5, "DELIVER")
        sol_system.available_missions.append(deliver_mission)
        
        initial_cargo = self.game.player.ship.get_cargo_used()
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_accept(["accept", deliver_mission.id])
        
        self.assertIn(deliver_mission, self.game.player.active_missions)
        self.assertEqual(self.game.player.ship.get_cargo_used(), initial_cargo + deliver_mission.quantity)

    def test_save_and_load_game(self):
        """Tests saving the game state to a file and loading it back."""
        # 1. Change the game state
        food_price = self.game.galaxy.systems["Sol"].market["Food"]["price"]
        with patch('sys.stdout', new=io.StringIO()):
            self.game.player.credits = 5000
            self.game.player.add_reputation("Federation", 25)
            self.game.current_day = 10
            self.game._handle_buy(["buy", "food", "5"])
            
            # Find a non-bounty mission to make the test predictable
            mission = next((m for m in self.game.galaxy.systems["Sol"].available_missions if m.type != "BOUNTY"), None)
            self.assertIsNotNone(mission, "Could not find a suitable mission to test saving/loading")
            self.game._handle_accept(["accept", mission.id])

        # 2. Save the game
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_save(None)
        
        self.assertTrue(os.path.exists("savegame.json"))

        # 3. Load the save into the same game instance
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_load(None)

        # 4. Verify the loaded state matches the saved state
        self.assertEqual(self.game.player.credits, 5000 - (food_price * 5))
        self.assertEqual(self.game.player.reputation["Federation"], 26) # 25 + 1 from buying food
        self.assertEqual(self.game.current_day, 10)
        
        expected_cargo = 5
        if mission.type == "DELIVER":
            expected_cargo += mission.quantity
        self.assertEqual(self.game.player.ship.get_cargo_used(), expected_cargo)
        
        self.assertEqual(len(self.game.player.active_missions), 1)
        self.assertEqual(self.game.player.active_missions[0].id, mission.id)

        # Clean up the save file
        os.remove("savegame.json")

    def test_sell_module(self):
        """Tests selling a module from the ship."""
        # 1. Sell the shield module
        initial_credits = self.game.player.credits
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell_module(["sellmodule", "S-1"])
        
        self.assertNotIn("S-1", self.game.player.ship.modules["shield"])
        self.assertEqual(self.game.player.credits, initial_credits + 750) # 1500 * 0.5

        # 2. Test selling the last weapon (should fail)
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_sell_module(["sellmodule", "W-1"])
            self.assertIn("Cannot sell your last weapon", fake_out.getvalue())
            
        self.assertIn("W-1", self.game.player.ship.modules["weapon"])

    def test_news_command(self):
        """Tests the news command to ensure it reports events and bounties."""
        # 1. Create a famine event
        self.game.galaxy.active_events["Sirius"] = {"type": "famine", "duration": 5}
        
        # 2. Create a bounty mission
        bounty_mission = Mission(self.game.galaxy.systems["Sol"], self.game.galaxy.systems["Vega"], "Federation", None, None, "BOUNTY", "Red-Eye")
        self.game.galaxy.systems["Sol"].available_missions.append(bounty_mission)
        
        # 3. Call the news handler and check the output
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_news(None)
            output = fake_out.getvalue()
            
            self.assertIn("A severe famine continues in the Sirius system.", output)
            self.assertIn("WANTED: The pirate Red-Eye is wanted by the Federation.", output)

    def test_bounty_hunting(self):
        """Tests the full lifecycle of a bounty hunting mission."""
        # 1. Create and accept a bounty mission
        bounty_mission = Mission(self.game.galaxy.systems["Sol"], self.game.galaxy.systems["Sirius"], "Federation", None, None, "BOUNTY", "Blackheart")
        self.game.galaxy.systems["Sol"].available_missions.append(bounty_mission)
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_accept(["accept", bounty_mission.id])
            
        self.assertIn(bounty_mission, self.game.player.active_missions)

        # 2. Travel to the target system
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_travel(["travel", "sirius"])
            
        self.assertEqual(self.game.player.location.name, "Sirius")

        # 3. Trigger a pirate encounter and defeat the bounty target
        initial_credits = self.game.player.credits
        initial_rep = self.game.player.reputation["Federation"]
        
        with patch('random.random', return_value=0.1): # Force event
            with patch('random.choice', return_value='pirate'):
                with patch('builtins.input', return_value='fight'):
                    with patch('sys.stdout', new=io.StringIO()) as fake_out:
                        self.game.event_manager.trigger_event()
                        self.assertIn("You've found him! The notorious pirate Blackheart is here!", fake_out.getvalue())
                        self.assertIn("--- MISSION COMPLETE ---", fake_out.getvalue())

        # 4. Verify rewards
        self.assertEqual(self.game.player.credits, initial_credits + bounty_mission.reward_credits)
        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + bounty_mission.reward_reputation)
        self.assertEqual(len(self.game.player.active_missions), 0)
