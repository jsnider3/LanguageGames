import textwrap
import copy
import pickle
import os

# --- Game Data (Constants) ---

VERB_ALIASES = {
    "examine": ["look at", "inspect", "check", "read"],
    "go": ["move", "walk", "travel"],
    "talk": ["speak", "ask", "interrogate"],
    "inventory": ["clues", "notes", "inv"],
}

CHARACTER_NAMES = {
    "lord alistair": "Lord Alistair Blackwood (deceased)",
    "lady eleanor": "Lady Eleanor Blackwood",
    "butler": "Mr. Fitzwilliam (The Butler)",
    "isabella": "Isabella Vance"
}

CHARACTER_DIALOGUE = {
    "lady eleanor": {
        "default": "'I have nothing to say,' she says, her voice cold. 'My husband is gone, and I am in mourning.'",
        "with_note": "When you show her the note, her face pales. 'Alistair was... a complicated man. He had many secrets.'"
    },
    "butler": {
        "default": "The butler stands rigidly. 'I have served the Blackwood family for thirty years. This is a great tragedy.'",
        "with_locket": "He glances at the locket. 'Ah, young Isabella. A shame she got mixed up in all this. Lord Alistair was quite fond of her.'"
    },
    "isabella": {
        "default": "The young maid looks terrified. 'I... I didn't see anything! I swear!'",
        "with_locket": "She bursts into tears when she sees the locket. 'He gave that to me. He said... he said he loved me.'"
    }
}

GAME_WORLD = {
    "study": {
        "description": "You are in the grand study. A large oak desk sits in the center, and the walls are lined with bookshelves. The air is thick with the scent of old books and a faint, sweet smell of poison.",
        "items": ["desk", "bookshelves"],
        "characters": ["lord alistair"],
        "exits": {"lounge": "Go to the Lounge"}
    },
    "lounge": {
        "description": "You are in the lounge. Plush velvet armchairs are arranged around a marble fireplace. A large portrait of the Blackwood family hangs above the mantelpiece.",
        "items": ["fireplace", "portrait"],
        "characters": ["lady eleanor", "butler"],
        "exits": {"study": "Go to the Study", "ballroom": "Go to the Ballroom"}
    },
    "ballroom": {
        "description": "You are in the magnificent ballroom. A crystal chandelier hangs from the high ceiling, casting a soft glow on the polished marble floor.",
        "items": ["chandelier"],
        "characters": ["isabella"],
        "exits": {"lounge": "Go to the Lounge", "gardens": "Go to the Gardens"}
    },
    "gardens": {
        "description": "You are in the serene gardens. Manicured hedges and rose bushes line the gravel paths. A stone fountain bubbles peacefully in the center.",
        "items": ["fountain", "rose bushes"],
        "characters": [],
        "exits": {"ballroom": "Go to the Ballroom"}
    }
}

ITEM_DETAILS = {
    "desk": {
        "description": "A large, ornate oak desk. On it, you find a half-empty glass of wine and a handwritten note.",
        "reveals": "note"
    },
    "note": {
        "description": "The note reads: 'My dearest Eleanor, I know your secret. Meet me in the study at midnight. We need to talk. -A'",
        "is_clue": True
    },
    "bookshelves": {
        "description": "Rows upon rows of classic literature. Nothing seems out of place."
    },
    "fireplace": {
        "description": "A grand marble fireplace. The embers are cold."
    },
    "portrait": {
        "description": "A portrait of the Blackwood family. Lord Alistair, Lady Eleanor, and their son. Lady Eleanor's eyes seem to follow you."
    },
    "chandelier": {
        "description": "A magnificent crystal chandelier. It's sparkling, even in the dim light."
    },
    "fountain": {
        "description": "A stone fountain with a cherub statue. The water is clear."
    },
    "rose bushes": {
        "description": "Beautiful, fragrant rose bushes. You notice a small, shiny object amidst the thorns.",
        "reveals": "locket"
    },
    "locket": {
        "description": "A silver locket. Inside, there's a picture of Isabella Vance, the young maid.",
        "is_clue": True
    },
    "lord alistair": {
        "description": "You examine the body of Lord Alistair. He is slumped over the desk, his face pale. A small trickle of dried blood runs from the corner of his mouth. It seems he was poisoned."
    }
}

SAVE_FILE = "savegame.dat"

class Game:
    def __init__(self):
        self.world_state = copy.deepcopy(GAME_WORLD)
        self.current_location = "study"
        self.inventory = []
        self.game_over = False

    def _print_wrap(self, text):
        """Prints text wrapped to the terminal width."""
        print(textwrap.fill(text, width=80))

    def _show_location_details(self):
        """Prints the details of the current location."""
        location = self.world_state[self.current_location]
        self._print_wrap(f"\n--- {self.current_location.title()} ---")
        self._print_wrap(location["description"])
        
        if location["items"]:
            print("You see the following items:", ", ".join(location["items"]))
        
        if location["characters"]:
            full_names = [CHARACTER_NAMES[c] for c in location["characters"]]
            print("You see the following people:", ", ".join(full_names))

        if location["exits"]:
            print("Exits:", ", ".join(location["exits"].keys()))

    def _parse_command(self, command):
        """Parses the player's command, handling flexible verbs."""
        parts = command.split(" ", 1)
        verb = parts[0]
        noun = parts[1] if len(parts) > 1 else None

        # Normalize verbs using aliases
        for canonical_verb, aliases in VERB_ALIASES.items():
            if verb == canonical_verb or verb in aliases:
                verb = canonical_verb
                break

        if verb in ["go", "talk", "examine", "accuse"] and noun and noun.startswith("to "):
            noun = noun[3:]
            
        if noun:
            for key, full_name in CHARACTER_NAMES.items():
                if noun in key or noun in full_name.lower():
                    noun = key
                    break
        
        return verb, noun

    def _handle_go(self, noun):
        """Handles the 'go' command."""
        if noun in self.world_state[self.current_location]["exits"]:
            self.current_location = noun
            self._show_location_details()
        else:
            print(f"You can't go to '{noun}' from here.")

    def _handle_examine(self, noun):
        """Handles the 'examine' command."""
        location = self.world_state[self.current_location]
        
        is_in_room = noun in location["items"] or noun in location["characters"]
        is_in_inventory = noun in self.inventory

        if not is_in_room and not is_in_inventory:
            print(f"You don't see a '{noun}' here, nor do you have it.")
            return

        if noun in ITEM_DETAILS:
            detail = ITEM_DETAILS[noun]
            self._print_wrap(detail["description"])
            
            if detail.get("is_clue"):
                if noun not in self.inventory:
                    self._print_wrap(f"CLUE FOUND: You've added the {noun} to your notes.")
                    self.inventory.append(noun)
                    # Remove from room if it's there
                    if noun in location["items"]:
                        location["items"].remove(noun)
                
            if "reveals" in detail:
                revealed_item = detail["reveals"]
                if revealed_item not in location["items"]:
                    location["items"].append(revealed_item)
                    self._print_wrap(f"You have discovered a new item: {revealed_item}.")
        else:
            print(f"You can't examine the '{noun}'.")

    def _handle_talk(self, noun):
        """Handles the 'talk to' command."""
        location = self.world_state[self.current_location]
        
        if noun == "lord alistair":
            self._print_wrap("'You can't talk to a dead man,' you mutter to yourself.")
            return

        if noun not in location["characters"]:
            print(f"You don't see '{noun}' here.")
            return

        dialogue = CHARACTER_DIALOGUE.get(noun, {})
        
        if noun == "lady eleanor" and "note" in self.inventory:
            self._print_wrap(dialogue["with_note"])
        elif (noun == "butler" or noun == "isabella") and "locket" in self.inventory:
            self._print_wrap(dialogue["with_locket"])
        elif "default" in dialogue:
            self._print_wrap(dialogue["default"])
        else:
            print(f"You can't talk to '{noun}'.")

    def _handle_accuse(self, noun):
        """Handles the 'accuse' command."""
        if noun not in CHARACTER_NAMES:
            print(f"You can't accuse '{noun}'. That person is not here.")
            return

        self._print_wrap(f"You point a finger at {CHARACTER_NAMES[noun]}.")

        if noun == "lady eleanor" and "note" in self.inventory and "locket" in self.inventory:
            self._print_wrap("\n'It was you!' you declare. 'You found out about your husband's affair with Isabella from the locket, and you confronted him. The note proves it.'")
            self._print_wrap("\nLady Eleanor's cold facade crumbles. 'He was going to leave me for a servant girl! He deserved it.'")
            self._print_wrap("\nCongratulations, you have solved The Crimson Case!")
        else:
            self._print_wrap(f"\n'{CHARACTER_NAMES[noun]} looks at you, bewildered. 'What are you talking about?'")
            self._print_wrap("\nYou don't have enough evidence to support your claim. The case goes cold, and a murderer walks free.")
            self._print_wrap("\nGAME OVER")
        
        self.game_over = True

    def _handle_inventory(self):
        """Handles the 'inventory' command."""
        if not self.inventory:
            print("You haven't found any clues yet.")
        else:
            print("You have the following clues:")
            for item in self.inventory:
                print(f"- {item}")

    def _handle_save(self):
        """Saves the current game state to a file."""
        try:
            with open(SAVE_FILE, "wb") as f:
                pickle.dump(self, f)
            print("Game saved successfully.")
        except Exception as e:
            print(f"Error saving game: {e}")

    def _handle_load(self):
        """Loads a game state from a file."""
        if not os.path.exists(SAVE_FILE):
            print("No save file found.")
            return

        try:
            with open(SAVE_FILE, "rb") as f:
                loaded_game = pickle.load(f)
            
            # Restore the state from the loaded game object
            self.world_state = loaded_game.world_state
            self.current_location = loaded_game.current_location
            self.inventory = loaded_game.inventory
            self.game_over = loaded_game.game_over
            
            print("\nGame loaded successfully.")
            self._show_location_details()
        except Exception as e:
            print(f"Error loading game: {e}")

    def run(self):
        """The main game loop."""
        print("Welcome to The Crimson Case.")
        self._print_wrap("Commands: 'quit', 'look', 'inventory', 'save', 'load', 'go [location]', 'examine [item]', 'talk to [person]', 'accuse [person]'")
        self._show_location_details()

        while not self.game_over:
            command = input("> ").strip().lower()
            if not command:
                continue
                
            verb, noun = self._parse_command(command)

            if verb == "quit":
                print("Thanks for playing!")
                break
            elif verb == "look":
                self._show_location_details()
            elif verb == "inventory":
                self._handle_inventory()
            elif verb == "save":
                self._handle_save()
            elif verb == "load":
                self._handle_load()
            elif verb == "go":
                if noun:
                    self._handle_go(noun)
                else:
                    print("Go where?")
            elif verb == "examine":
                if noun:
                    self._handle_examine(noun)
                else:
                    print("Examine what?")
            elif verb == "talk":
                if noun:
                    self._handle_talk(noun)
                else:
                    print("Talk to whom?")
            elif verb == "accuse":
                if noun:
                    self._handle_accuse(noun)
                else:
                    print("Accuse whom?")
            else:
                print(f"Unknown command: '{verb}'")

if __name__ == "__main__":
    game = Game()
    game.run()

