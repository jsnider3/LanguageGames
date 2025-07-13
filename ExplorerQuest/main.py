import random

def start_game():
    print("Welcome to the Explorer's Quest!")
    print("You're an adventurer in a mysterious world. Your goal is to find hidden treasures without causing harm.")
    health = 100
    treasures_found = 0
    
    while health > 0 and treasures_found < 3:
        action = input("Do you want to 'explore', 'rest', or 'quit'? ").lower()
        
        if action == 'explore':
            event = random.choice(['treasure', 'obstacle', 'nothing'])
            if event == 'treasure':
                treasures_found += 1
                print(f"You found a treasure! Treasures: {treasures_found}/3")
            elif event == 'obstacle':
                damage = random.randint(10, 30)
                health -= damage
                print(f"You encountered an obstacle and lost {damage} health. Health: {health}")
            else:
                print("You explored but found nothing.")
        elif action == 'rest':
            health += 20
            if health > 100:
                health = 100  # Cap at maximum health
            print(f"You rested and gained health. Current health: {health}")
        elif action == 'quit':
            print("Thanks for playing! You quit the game.")
            break
        else:
            print("Invalid action. Try 'explore', 'rest', or 'quit'.")
    
    if treasures_found >= 3:
        print("Congratulations! You've found all the treasures and won the game.")
    elif health <= 0:
        print("Oh no! You've run out of health. Game over.")

if __name__ == "__main__":
    start_game()
