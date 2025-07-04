import random
import time
import argparse

class Player:
    """
    The player character.
    """
    def __init__(self, name="Hero"):
        self.name = name
        self.hp = 20
        self.max_hp = 20
        self.attack_power = 5
        self.gold = 0
        self.dungeon_level = 1

    def is_alive(self):
        return self.hp > 0

    def take_damage(self, damage):
        self.hp -= damage
        if self.hp < 0:
            self.hp = 0

class Monster:
    """
    A base class for all monsters.
    """
    def __init__(self, name, hp, attack_power, gold_reward):
        self.name = name
        self.hp = hp
        self.attack_power = attack_power
        self.gold_reward = gold_reward

    def is_alive(self):
        return self.hp > 0

    def take_damage(self, damage):
        self.hp -= damage
        if self.hp < 0:
            self.hp = 0

class Goblin(Monster):
    """A weak but common monster."""
    def __init__(self):
        super().__init__(name="Goblin", hp=8, attack_power=3, gold_reward=random.randint(1, 5))

class Orc(Monster):
    """A tougher monster."""
    def __init__(self):
        super().__init__(name="Orc", hp=15, attack_power=6, gold_reward=random.randint(5, 12))


class Dungeon:
    """
    Manages the generation of dungeon rooms.
    """
    def __init__(self, level=1):
        self.level = level

    def generate_room(self):
        """Randomly generates a new room with an event."""
        room_type = random.choices(["monster", "treasure", "empty"], [0.6, 0.2, 0.2])[0]

        if room_type == "monster":
            monster_type = random.choice([Goblin, Orc])
            return {"type": "monster", "content": monster_type()}
        elif room_type == "treasure":
            gold_found = random.randint(5, 20) * self.level
            return {"type": "treasure", "content": gold_found}
        else:
            return {"type": "empty", "content": None}


class Game:
    """
    Manages the main game loop and state.
    """
    def __init__(self):
        self.player = Player()
        self.dungeon = Dungeon()
        self.game_over = False

    def _handle_monster_room(self, room):
        """Handles the logic for a room containing a monster."""
        monster = room["content"]
        print(f"A wild {monster.name} with {monster.hp} HP appears!")

        while monster.is_alive() and self.player.is_alive():
            print("\nWhat do you do?")
            command = input("> ").strip().lower()

            if command == "attack":
                # Player attacks monster
                player_damage = self.player.attack_power
                monster.take_damage(player_damage)
                print(f"You attack the {monster.name} for {player_damage} damage.")
                
                # Monster attacks player (if still alive)
                if monster.is_alive():
                    monster_damage = monster.attack_power
                    self.player.take_damage(monster_damage)
                    print(f"The {monster.name} attacks you for {monster_damage} damage. You have {self.player.hp} HP left.")
                else:
                    print(f"You have defeated the {monster.name}!")
                    self.player.gold += monster.gold_reward
                    print(f"You find {monster.gold_reward} gold. Total gold: {self.player.gold}")

            elif command == "run":
                print("You flee from the battle.")
                # 25% chance the monster gets a free hit
                if random.random() < 0.25:
                    monster_damage = monster.attack_power
                    self.player.take_damage(monster_damage)
                    print(f"The {monster.name} gets a parting shot in for {monster_damage} damage! You have {self.player.hp} HP left.")
                return # Exit the combat loop
            else:
                print("Invalid command. Choose 'attack' or 'run'.")

        if not self.player.is_alive():
            self.game_over = True
            print("\nYou have been defeated. Your adventure ends here.")

    def _handle_treasure_room(self, room):
        """Handles the logic for a room containing treasure."""
        gold = room["content"]
        print(f"You enter a quiet room. You find a chest containing {gold} gold!")
        self.player.gold += gold
        print(f"Your total gold is now {self.player.gold}.")

    def _handle_empty_room(self, room):
        """Handles the logic for an empty room."""
        print("The room is empty. You take a moment to catch your breath.")
        # Small chance to heal
        if random.random() < 0.3:
            heal_amount = random.randint(1, 5)
            self.player.hp = min(self.player.max_hp, self.player.hp + heal_amount)
            print(f"You find some discarded bandages and heal for {heal_amount} HP. Current HP: {self.player.hp}")

    def run(self):
        """The main game loop."""
        print("Welcome to The Shadowed Keep!")
        print("Your adventure begins...")
        time.sleep(1)

        while not self.game_over:
            print(f"\n--- Dungeon Level: {self.player.dungeon_level} ---")
            
            room = self.dungeon.generate_room()
            
            if room["type"] == "monster":
                self._handle_monster_room(room)
            elif room["type"] == "treasure":
                self._handle_treasure_room(room)
            elif room["type"] == "empty":
                self._handle_empty_room(room)

            if not self.player.is_alive():
                self.game_over = True
                print(f"\n--- GAME OVER ---")
                print(f"You reached dungeon level {self.player.dungeon_level}.")
                print(f"You collected {self.player.gold} gold.")
                break

            print("\nYou see a staircase leading deeper into the keep.")
            print("Do you want to 'continue' to the next level or 'quit'?")
            
            while True:
                command = input("> ").strip().lower()
                if command == "continue":
                    self.player.dungeon_level += 1
                    self.dungeon.level = self.player.dungeon_level
                    print("You descend deeper into the darkness...")
                    time.sleep(1)
                    break
                elif command == "quit":
                    print("You flee from the keep with your treasure. Coward!")
                    self.game_over = True
                    break
                else:
                    print("Invalid command.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="The Shadowed Keep - A Text-Based Roguelike.")
    parser.add_argument("--seed", type=int, help="A seed for the random number generator for reproducible runs.")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    game = Game()
    game.run()
