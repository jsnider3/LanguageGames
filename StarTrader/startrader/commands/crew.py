"""
Crew management command handlers.
"""

import random
from .base import BaseCommandHandler
from ..classes import CrewMember

# Crew role definitions
CREW_ROLES = {
    "Navigator": {
        "bonus": 0.05,
        "bonus_description": "Reduces fuel consumption",
        "base_salary": 100
    },
    "Negotiator": {
        "bonus": 0.1,
        "bonus_description": "Better trading prices",
        "base_salary": 80
    },
    "Engineer": {
        "bonus": 0.05,
        "bonus_description": "Improves fuel efficiency",
        "base_salary": 120
    },
    "Gunner": {
        "bonus": 0.1,
        "bonus_description": "Increases combat damage",
        "base_salary": 150
    }
}


class CrewCommands(BaseCommandHandler):
    """Handles all crew-related commands."""
    
    def handle_recruits(self, parts):
        """Display available crew members for hire."""
        system = self.get_current_system()
        
        if system.economy_type == "Agricultural":
            print("This agricultural system doesn't have a recruitment office.")
            return
        
        # Generate recruits if needed
        if not hasattr(self.game, 'available_recruits') or not self.game.available_recruits:
            self._generate_recruits()
        
        print(f"\n--- {system.name} Recruitment Office ---")
        print("Available crew members:")
        print(f"{'#':<3} {'Name':<20} {'Role':<15} {'Cost':<10} {'Level':<10}")
        print("-" * 60)
        
        for i, recruit in enumerate(self.game.available_recruits):
            print(f"{i+1:<3} {recruit.name:<20} {recruit.role:<15} {recruit.hire_cost:<10} {recruit.level:<10}")
        
        print(f"\nYour crew: {len(self.player.crew)}")
        print("Use 'hire <number>' to hire a crew member.")
        print("Use 'crew' to view your current crew.")
    
    def handle_hire(self, parts):
        """Hire a crew member."""
        if not self.validate_command(parts, 2, "hire <recruit number>"):
            return
        
        if not hasattr(self.game, 'available_recruits') or not self.game.available_recruits:
            print("No recruits available. Visit a recruitment office.")
            return
        
        try:
            recruit_num = int(parts[1]) - 1
        except ValueError:
            print("Recruit number must be a number.")
            return
        
        if recruit_num < 0 or recruit_num >= len(self.game.available_recruits):
            print("Invalid recruit number.")
            return
        
        recruit = self.game.available_recruits[recruit_num]
        
        if self.player.credits < recruit.hire_cost:
            print(f"Not enough credits. You need {recruit.hire_cost}, but only have {self.player.credits}.")
            return
        
        # Check crew limit
        max_crew = 5 + (2 if "Crew Quarters" in self.player.ship.modules else 0)
        if len(self.player.crew) >= max_crew:
            print(f"Crew quarters full! Maximum crew: {max_crew}")
            print("Upgrade with Crew Quarters module or fire existing crew.")
            return
        
        # Hire the crew member
        self.player.credits -= recruit.hire_cost
        self.player.crew.append(recruit)
        self.game.available_recruits.remove(recruit)
        
        print(f"Hired {recruit.name} as {recruit.role} for {recruit.hire_cost} credits.")
        print(f"Your crew now has {len(self.player.crew)} members.")
        
        # Morale boost for new hire
        self.player.adjust_crew_morale(5, "The crew welcomes their new member!")
        
        # Generate new recruits
        self._generate_recruits()
    
    def handle_crew(self, parts):
        """Display current crew roster."""
        if not self.player.crew:
            print("You have no crew members.")
            return
        
        print("\n--- CREW ROSTER ---")
        print(f"Crew members: {len(self.player.crew)}")
        print(f"Average morale: {self.player.get_average_morale():.0f}%")
        print()
        
        for i, member in enumerate(self.player.crew):
            print(f"{i+1}. {member.name}")
            print(f"   Role: {member.role} (Level {member.level})")
            print(f"   Experience: {member.experience}")
            print(f"   Morale: {member.morale}%")
            print(f"   Salary: {member.salary} credits/day")
            
            # Show role-specific bonuses
            role_data = CREW_ROLES.get(member.role, {})
            if "bonus" in role_data:
                bonus_desc = role_data["bonus_description"]
                bonus_value = role_data["bonus"] * member.level
                print(f"   Bonus: {bonus_desc} ({bonus_value:.0%})")
            print()
        
        print("Use 'fire <number>' to dismiss a crew member.")
    
    def handle_fire(self, parts):
        """Fire a crew member."""
        if not self.validate_command(parts, 2, "fire <crew number>"):
            return
        
        if not self.player.crew:
            print("You have no crew to fire.")
            return
        
        try:
            crew_num = int(parts[1]) - 1
        except ValueError:
            print("Crew number must be a number.")
            return
        
        if crew_num < 0 or crew_num >= len(self.player.crew):
            print(f"Invalid crew number. You have {len(self.player.crew)} crew members.")
            return
        
        member = self.player.crew[crew_num]
        
        print(f"Fire {member.name} ({member.role})? (y/n)")
        if input().strip().lower() != 'y':
            return
        
        self.player.crew.remove(member)
        print(f"{member.name} has been dismissed.")
        
        # Morale penalty
        if self.player.crew:
            self.player.adjust_crew_morale(-10, "The crew is upset about the dismissal.")
    
    def _generate_recruits(self):
        """Generate new crew members for hire."""
        if not hasattr(self.game, 'available_recruits'):
            self.game.available_recruits = []
        
        # Generate 3-5 recruits
        num_recruits = random.randint(3, 5) - len(self.game.available_recruits)
        
        first_names = [
            "Alex", "Jordan", "Casey", "Morgan", "Riley", "Sam", "Taylor", "Jamie",
            "Avery", "Quinn", "Blake", "Drew", "Reese", "Skyler", "Cameron", "Dakota"
        ]
        
        last_names = [
            "Chen", "Smith", "Johnson", "Patel", "Williams", "Brown", "Jones", "Garcia",
            "Martinez", "Rodriguez", "Lee", "Walker", "Hall", "Kim", "Singh", "Ali"
        ]
        
        for _ in range(num_recruits):
            # Random name
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Random role
            role = random.choice(list(CREW_ROLES.keys()))
            
            # Level based on system type
            system = self.get_current_system()
            if system.economy_type == "High-Tech":
                level = random.randint(2, 4)
            else:
                level = random.randint(1, 3)
            
            # Create crew member
            role_data = CREW_ROLES[role]
            skill_bonus = role_data["bonus"] * level
            salary = role_data["base_salary"] + (level - 1) * 20
            description = f"Level {level} {role}. {role_data['bonus_description']}."
            
            member = CrewMember(name, role, skill_bonus, salary, description)
            member.level = level  # Store level for display
            member.hire_cost = salary * 10  # Hire cost is 10x the salary
            self.game.available_recruits.append(member)