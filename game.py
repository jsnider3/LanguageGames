# The Crimson Case
# A text-based detective game

# --- Character Details ---

character_names = {
    "lord alistair": "Lord Alistair Blackwood (deceased)",
    "lady eleanor": "Lady Eleanor Blackwood",
    "butler": "Mr. Fitzwilliam (The Butler)",
    "isabella": "Isabella Vance"
}

character_dialogue = {
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


# --- Game World Data ---

game_world = {
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

# --- Item Details ---

item_details = {
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
    }
}

# --- Game State ---

current_location = "study"
inventory = [] # Will store clues

# --- Helper Functions ---

def show_location_details():
    """Prints the details of the current location."""
    location = game_world[current_location]
    print(f"\n--- {current_location.title()} ---")
    print(location["description"])
    
    if location["items"]:
        print("You see the following items:", ", ".join(location["items"]))
    
    # Print full character names
    if location["characters"]:
        full_names = [character_names[c] for c in location["characters"]]
        print("You see the following people:", ", ".join(full_names))

    if location["exits"]:
        print("Exits:", ", ".join(location["exits"].keys()))

def parse_command(command):
    """Parses the player's command."""
    parts = command.split(" ", 1)
    verb = parts[0]
    noun = parts[1] if len(parts) > 1 else None
    return verb, noun

# --- Command Handlers ---

def handle_go(noun):
    """Handles the 'go' command."""
    global current_location
    if noun in game_world[current_location]["exits"]:
        current_location = noun
        show_location_details()
    else:
        print(f"You can't go to '{noun}' from here.")

def handle_examine(noun):
    """Handles the 'examine' command."""
    location = game_world[current_location]
    
    if noun not in location["items"] and noun not in item_details:
        print(f"You don't see a '{noun}' here.")
        return

    if noun in item_details:
        detail = item_details[noun]
        print(detail["description"])
        
        if detail.get("is_clue") and noun not in inventory:
            print(f"CLUE FOUND: You've added the {noun} to your notes.")
            inventory.append(noun)
            
        if "reveals" in detail:
            revealed_item = detail["reveals"]
            if revealed_item not in location["items"]:
                location["items"].append(revealed_item)
                print(f"You have discovered a new item: {revealed_item}.")
    else:
        print(f"You can't examine the '{noun}'.")

def handle_talk(noun):
    """Handles the 'talk to' command."""
    location = game_world[current_location]
    
    if noun not in location["characters"]:
        print(f"You don't see '{noun}' here.")
        return

    dialogue = character_dialogue.get(noun, {})
    
    # Check for specific clue-based dialogue
    if noun == "lady eleanor" and "note" in inventory:
        print(dialogue["with_note"])
    elif (noun == "butler" or noun == "isabella") and "locket" in inventory:
        print(dialogue["with_locket"])
    elif "default" in dialogue:
        print(dialogue["default"])
    else:
        print(f"You can't talk to '{noun}'.")


def handle_accuse(noun):
    """Handles the 'accuse' command."""
    if noun not in character_names:
        print(f"You can't accuse '{noun}'. That person is not here.")
        return

    print(f"You point a finger at {character_names[noun]}.")

    # Winning condition
    if noun == "lady eleanor" and "note" in inventory and "locket" in inventory:
        print("\n'It was you!' you declare. 'You found out about your husband's affair with Isabella from the locket, and you confronted him. The note proves it.'")
        print("\nLady Eleanor's cold facade crumbles. 'He was going to leave me for a servant girl! He deserved it.'")
        print("\nCongratulations, you have solved The Crimson Case!")
        return True  # End the game
    # Losing condition
    else:
        print(f"\n'{character_names[noun]} looks at you, bewildered. 'What are you talking about?'")
        print("\nYou don't have enough evidence to support your claim. The case goes cold, and a murderer walks free.")
        print("\nGAME OVER")
        return True  # End the game

def main():
    """The main game loop."""
    print("Welcome to The Crimson Case.")
    print("Commands: 'quit', 'look', 'go [location]', 'examine [item]', 'talk to [person]', 'accuse [person]'")
    show_location_details()

    while True:
        command = input("> ").strip().lower()
        if not command:
            continue
            
        verb, noun = parse_command(command)

        if verb == "quit":
            print("Thanks for playing!")
            break
        elif verb == "look":
            show_location_details()
        elif verb == "go":
            if noun:
                handle_go(noun)
            else:
                print("Go where?")
        elif verb == "examine":
            if noun:
                handle_examine(noun)
            else:
                print("Examine what?")
        elif verb == "talk":
            if noun and noun.startswith("to "):
                noun = noun[3:]
            
            if noun:
                handle_talk(noun)
            else:
                print("Talk to whom?")
        elif verb == "accuse":
            if noun:
                if handle_accuse(noun):
                    break  # End game
            else:
                print("Accuse whom?")
        else:
            print(f"Unknown command: '{verb}'")

if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()
