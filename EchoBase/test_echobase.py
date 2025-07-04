import unittest
from unittest.mock import patch
import io
import sys
import os

# Add the parent directory to the Python path to allow for local imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# We need to import the classes from the game file
from EchoBase.echobase import Colony, Game

class TestColony(unittest.TestCase):
    """Tests for the Colony class."""

    def setUp(self):
        """Set up a new Colony instance for each test."""
        self.colony = Colony()

    def test_initial_state(self):
        """Test that the colony initializes with the correct default values."""
        self.assertEqual(self.colony.day, 1)
        self.assertEqual(self.colony.colonists, 10)
        self.assertEqual(self.colony.food, 50)
        self.assertEqual(self.colony.water, 50)
        self.assertEqual(self.colony.jobs["unassigned"], 10)
        self.assertEqual(self.colony.jobs["farming"], 0)

    def test_next_day_logic(self):
        """Test the resource calculation for the next day."""
        self.colony.jobs["unassigned"] = 5
        self.colony.jobs["farming"] = 3  # Should produce 6 food
        self.colony.jobs["mining"] = 2   # Should produce 2 materials
        
        self.colony.next_day()

        # Day should advance
        self.assertEqual(self.colony.day, 2)
        # Food: 50 (start) + 6 (produced) - 10 (consumed) = 46
        self.assertEqual(self.colony.food, 46)
        # Water: 50 (start) - 10 (consumed) = 40
        self.assertEqual(self.colony.water, 40)
        # Materials: 20 (start) + 2 (produced) = 22
        self.assertEqual(self.colony.materials, 22)

    def test_game_over_on_starvation(self):
        """Test that the game ends if food runs out."""
        self.colony.food = 5  # Not enough for 10 colonists
        result = self.colony.next_day()
        self.assertFalse(result) # Should signal game over

    def test_game_over_on_dehydration(self):
        """Test that the game ends if water runs out."""
        self.colony.water = 5 # Not enough for 10 colonists
        result = self.colony.next_day()
        self.assertFalse(result) # Should signal game over


class TestGame(unittest.TestCase):
    """Tests for the Game class and command handling."""

    def setUp(self):
        """Set up a new Game instance for each test."""
        self.game = Game()

    def test_valid_assignment(self):
        """Test assigning colonists to a job."""
        initial_unassigned = self.game.colony.jobs["unassigned"]
        initial_farming = self.game.colony.jobs["farming"]
        
        # Command: assign 5 farming
        command_parts = ["assign", "5", "farming"]
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_assign(command_parts)
        
        self.assertEqual(self.game.colony.jobs["unassigned"], initial_unassigned - 5)
        self.assertEqual(self.game.colony.jobs["farming"], initial_farming + 5)

    def test_assign_more_colonists_than_available(self):
        """Test assigning more colonists than are unassigned."""
        initial_unassigned = self.game.colony.jobs["unassigned"] # Should be 10
        
        # Command: assign 15 farming
        command_parts = ["assign", "15", "farming"]
        
        # Use patch to suppress print output during the test
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_assign(command_parts)
            output = fake_out.getvalue().strip()
            self.assertIn("Not enough unassigned colonists", output)

        # Ensure the state has not changed
        self.assertEqual(self.game.colony.jobs["unassigned"], initial_unassigned)

    def test_assign_invalid_job(self):
        """Test assigning colonists to a non-existent job."""
        initial_unassigned = self.game.colony.jobs["unassigned"]
        
        command_parts = ["assign", "5", "building"]
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_assign(command_parts)
            output = fake_out.getvalue().strip()
            self.assertIn("Invalid job", output)
            
        self.assertEqual(self.game.colony.jobs["unassigned"], initial_unassigned)

    def test_valid_unassignment(self):
        """Test unassigning colonists from a job."""
        # First, assign some colonists to a job
        self.game.colony.jobs["unassigned"] = 5
        self.game.colony.jobs["farming"] = 5
        
        initial_unassigned = self.game.colony.jobs["unassigned"]
        initial_farming = self.game.colony.jobs["farming"]

        # Command: unassign 3 farming
        command_parts = ["unassign", "3", "farming"]
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_unassign(command_parts)
        
        self.assertEqual(self.game.colony.jobs["unassigned"], initial_unassigned + 3)
        self.assertEqual(self.game.colony.jobs["farming"], initial_farming - 3)

    def test_unassign_more_colonists_than_assigned(self):
        """Test unassigning more colonists than are in a job."""
        self.game.colony.jobs["farming"] = 5
        initial_farming = self.game.colony.jobs["farming"]
        
        # Command: unassign 8 farming
        command_parts = ["unassign", "8", "farming"]
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_unassign(command_parts)
            output = fake_out.getvalue().strip()
            self.assertIn("Not enough colonists in farming to unassign", output)

        # Ensure the state has not changed
        self.assertEqual(self.game.colony.jobs["farming"], initial_farming)


if __name__ == '__main__':
    unittest.main()
