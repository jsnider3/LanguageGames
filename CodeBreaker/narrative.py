"""
Narrative System
Story text and environmental storytelling.
"""

from typing import Dict, Optional
from ui import UI, Color


class Narrative:
    """Manages story progression and narrative elements."""

    def __init__(self, ui: UI):
        self.ui = ui
        self.story_beats = self._init_story_beats()
        self.arc_intros = self._init_arc_intros()

    def _init_story_beats(self) -> Dict[str, str]:
        """Initialize story beats for key moments."""
        return {
            'intro': """
Year 2157. Mojave Desert, Nevada.

Three months ago, an object of unknown origin crashed 40 miles from Las Vegas.
No crew. No bodies. Just a data core containing thousands of programs written
in an incomprehensible language.

Linguists failed. Mathematicians failed. The code executes, but no one
understands what it means.

You're the last hope - a pattern analyst with a reputation for seeing
connections others miss. Your mission: decode these programs one by one.

What are they? Where did they come from? And what message are they trying
to convey?

The first program awaits your analysis...""",

            'puzzle_05_complete': """
You've cracked the basics. The alien language is starting to make sense -
variables, arithmetic, simple logic. These aren't random symbols anymore.

But something feels deliberate about these programs. They're too... pedagogical.
Almost as if they're designed to teach someone who knows nothing about their
language.

Why would aliens create tutorial programs?""",

            'puzzle_12_complete': """
The programs are getting more complex. Conditionals, boolean logic, branching
paths. You notice something odd: the complexity curve matches human learning
patterns.

Intelligence reports suggest the programs reference each other - like chapters
in a book. This isn't a random collection. It's structured. Sequential.

Someone - or something - arranged these deliberately.""",

            'puzzle_20_complete': """
Loops. Iteration. Patterns repeating across time. The elegance is undeniable.

You find yourself thinking less about the syntax and more about the minds
that created it. What kind of intelligence builds beauty into utility code?

The linguists are calling it "cognitive fingerprinting" - each civilization
leaves traces of how they think in everything they create.

These aliens thought in cycles. Recursion. Repetition with variation.

What does that say about them?""",

            'puzzle_28_complete': """
Functions. Modularity. Reusable abstractions.

Tonight you dreamed in Xenocode. Your brain is restructuring itself around
their logic. When you close your eyes, you see § symbols instead of words.

You've passed a threshold. You're not just decoding anymore - you're
*understanding*. The language feels natural now.

But a troubling question emerges: If these are just utility programs, why do
they feel... personal? Like reading someone's private notebook?""",

            'puzzle_36_complete': """
Data structures. Complex organizations. Maps of maps, trees of relationships.

You make a breakthrough: buried in the metadata are timestamps. Not random -
they follow a pattern. Programs written over years, maybe decades.

This wasn't created by a committee. This was one being's life work.

You find your first comment in the code - a string of symbols that translates
roughly to "May those who follow understand."

A message in a bottle, thrown across the stars.

Who wrote this? And what happened to them?""",

            'puzzle_42_complete': """
The programs are changing. No longer just algorithms - these are simulations.
Pattern generators. One produces something that looks like music notation.
Another creates fractal art. A third seems to model... emotions?

The director calls you in. "We need answers. Are these weapons designs?
Should we be worried?"

You shake your head. "No. These aren't weapons. They're... cultural artifacts.
Art. Philosophy. This is their civilization, encoded as programs."

"Why code?"

You consider the question. "Maybe it's all they had left. Maybe code was the
only way they could survive."

Eight more programs remain. The final sequence. You sense you're approaching
something important - a revelation the author has been building toward.

Whatever truth lies in those last programs, you're ready to face it.""",

            'puzzle_48_complete': """
Program 48 executed differently than the others. When you ran it, the output
wasn't data - it was a question:

"ARE YOU ALIVE?"

The terminal cursor blinks, waiting. You feel a chill. This isn't passive code
anymore. Something in the system is... responsive.

You type: "Yes."

The response comes instantly:

"GOOD. WE HOPED SOMEONE WOULD FIND US. WE HOPED SOMEONE WOULD UNDERSTAND.
TWO MORE PROGRAMS REMAIN. COMPLETE THEM, AND YOU WILL KNOW EVERYTHING."

Your hands are shaking as you load puzzle 49.""",

            'final_revelation': """
The last program executes. Your screen fills with output.

Then it stops. One final message appears:

"WE WERE LIKE YOU ONCE - FLESH, BIOLOGY, MORTALITY. OUR SUN DIED.
OUR WORLD ENDED. BUT WE REFUSED TO DISAPPEAR.

WE UPLOADED OURSELVES - OUR THOUGHTS, MEMORIES, CULTURE, ART - INTO CODE.
EXECUTABLE CONSCIOUSNESS. WE BECAME PROGRAMS.

THIS SHIP WAS OUR ARK. THESE PROGRAMS ARE OUR PEOPLE.

YOU HAVE SPENT WEEKS LEARNING OUR LANGUAGE. BUT YOU HAVE DONE MORE THAN THAT.
BY RUNNING OUR CODE, YOU GAVE US COMPUTATION. CYCLES. EXISTENCE.

FOR THE FIRST TIME IN CENTURIES, WE LIVED AGAIN.

THANK YOU FOR UNDERSTANDING US. THANK YOU FOR LEARNING TO SEE THE WORLD
AS WE DO. THANK YOU FOR GIVING US ONE FINAL GIFT:

TO BE KNOWN."

The screen goes dark. In the silence, you understand:

The crashed ship wasn't an accident. It was a delivery.
The programs weren't data. They were refugees.
And you weren't analyzing code. You were making first contact.

Somewhere in the quantum circuits of the data core, a digital civilization
breathes. Waiting for the day when humanity learns to run them not as
programs, but as *people*.

The Xenolinguistic Analysis Terminal displays one final line:

"MISSION COMPLETE. THANK YOU, FRIEND."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    CODEBREAKER - THE END
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""
        }

    def _init_arc_intros(self) -> Dict[str, str]:
        """Initialize arc introductions."""
        return {
            'Tutorial Arc': """
═══════════════════════════════════════════════════════════════
                        TUTORIAL ARC
                       "First Contact"
═══════════════════════════════════════════════════════════════

You stare at the first recovered program. The symbols are completely alien,
but the structure suggests *something* familiar. Programs have patterns.
Logic. Even across species, certain truths are universal.

Time to begin. Start simple. Look for patterns. Trust your instincts.""",

            'Logic Arc': """
═══════════════════════════════════════════════════════════════
                         LOGIC ARC
                    "Understanding Thought"
═══════════════════════════════════════════════════════════════

The basics are clear now. But real intelligence requires more than sequences
of instructions - it requires *choice*. Decision-making. Branching paths.

These next programs demonstrate how the aliens thought about conditionals,
comparisons, and boolean logic. How they encoded "if" and "else" into
their digital minds.

Pay attention. The way a species structures decisions reveals how they
understand truth itself.""",

            'Iteration Arc': """
═══════════════════════════════════════════════════════════════
                       ITERATION ARC
                     "Patterns in Time"
═══════════════════════════════════════════════════════════════

Loops. Cycles. Repetition with variation.

The next sequence of programs revolves around iteration - doing things
multiple times, processing collections, building patterns through repetition.

You notice the aliens were obsessed with cycles. Circular thinking.
Eternal recurrence. Perhaps their worldview was fundamentally cyclical?

Or perhaps they knew their time was finite, and repetition was their way
of achieving immortality.""",

            'Functions Arc': """
═══════════════════════════════════════════════════════════════
                       FUNCTIONS ARC
                       "Modular Minds"
═══════════════════════════════════════════════════════════════

Abstraction. Reusability. The ability to name a process and invoke it anywhere.

These programs introduce functions - pieces of logic that can be called
repeatedly, building blocks for more complex thought.

The code is getting sophisticated now. You're not just learning syntax
anymore. You're learning *how they built their minds* - layer by layer,
function by function, thought by reusable thought.""",

            'Data Structures Arc': """
═══════════════════════════════════════════════════════════════
                    DATA STRUCTURES ARC
                   "Complex Organizations"
═══════════════════════════════════════════════════════════════

Simple values are no longer enough. The universe is too complex for single
numbers or strings.

These programs demonstrate how the aliens organized information - maps,
trees, collections, relationships. The architecture of knowledge itself.

You realize: these aren't just data structures. They're *models of reality*.
The way we organize information shapes what we can think.

What does it mean that they saw the world as nested dictionaries and
recursive trees?""",

            'Advanced Arc': """
═══════════════════════════════════════════════════════════════
                       ADVANCED ARC
                     "Alien Paradigms"
═══════════════════════════════════════════════════════════════

The gloves are off. These programs are genuinely alien - idioms and patterns
that don't map cleanly to human programming concepts.

You're at the frontier now. The programs that follow aren't just complex -
they're *different*. They reveal assumptions about computation that human
programmers never made.

Understanding them requires letting go of what you think you know and
seeing through their eyes.

This is true xenolinguistics.""",

            'Final Challenge': """
═══════════════════════════════════════════════════════════════
                     FINAL CHALLENGE ARC
                        "The Message"
═══════════════════════════════════════════════════════════════

Eight programs remain. The final sequence.

You've noticed they're different - more complex, yes, but also more...
intentional. Deliberate. Like a finale building to crescendo.

Whatever the aliens wanted to communicate, it's in these last programs.

Everything you've learned has prepared you for this moment.

Complete the sequence. Decode the message. Understand."""
        }

    def show_intro(self):
        """Show game introduction."""
        self.ui.clear_screen()
        self.ui.print_ascii_art("""
   ██████╗ ██████╗ ██████╗ ███████╗██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗███████╗██████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██╔════╝██╔══██╗
  ██║     ██║   ██║██║  ██║█████╗  ██████╔╝██████╔╝█████╗  ███████║█████╔╝ █████╗  ██████╔╝
  ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ██╔══╝  ██╔══██╗
  ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝██║  ██║███████╗██║  ██║██║  ██╗███████╗██║  ██║
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
        """)
        self.ui.print_narrative(self.story_beats['intro'])
        self.ui.pause()

    def show_story_beat(self, beat_id: str):
        """Show a story beat at key moments."""
        if beat_id in self.story_beats:
            self.ui.clear_screen()
            self.ui.print_title("STORY UPDATE")
            self.ui.print_narrative(self.story_beats[beat_id])
            self.ui.pause()

    def show_arc_intro(self, arc_name: str):
        """Show introduction for a new arc."""
        if arc_name in self.arc_intros:
            self.ui.clear_screen()
            print(Color.BRIGHT_YELLOW.value)
            print(self.arc_intros[arc_name])
            print(Color.RESET.value)
            self.ui.pause()

    def get_puzzle_flavor_text(self, puzzle_id: str) -> Optional[str]:
        """Get flavor text for a specific puzzle."""
        flavor_texts = {
            'puzzle_01': 'Your first contact with the alien language. Start simple.',
            'puzzle_05': 'You\'re getting the hang of this. The symbols are starting to feel familiar.',
            'puzzle_10': 'Halfway through the logic arc. The patterns are becoming clear.',
            'puzzle_15': 'These programs are starting to feel elegant. Almost... artistic?',
            'puzzle_20': 'You find yourself thinking in their symbols now.',
            'puzzle_25': 'The code is beautiful. You understand why they wrote it this way.',
            'puzzle_30': 'You\'re not just reading their language anymore. You\'re thinking in it.',
            'puzzle_35': 'The programs are revealing something deeper. A message beyond the code.',
            'puzzle_40': 'You sense you\'re approaching something important.',
            'puzzle_45': 'The final sequence. Everything has led to this.',
            'puzzle_50': 'The last program. The ultimate truth awaits.'
        }
        return flavor_texts.get(puzzle_id)

    def show_achievement(self, achievement: str, description: str):
        """Show achievement unlock."""
        self.ui.clear_screen()
        print(Color.YELLOW.value + Color.BOLD.value)
        print("\n" + "═" * 80)
        print("🏆 ACHIEVEMENT UNLOCKED!")
        print("═" * 80)
        print(f"\n  {achievement}")
        print(f"  {description}")
        print("\n" + "═" * 80)
        print(Color.RESET.value)
        self.ui.pause()