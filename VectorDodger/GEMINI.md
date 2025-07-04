# Project: Vector Dodger

## 1. Project Goal
To create a visually clean, 2D arcade-style "bullet hell" game that runs in a web browser. The player controls a ship and must survive an endless, ever-increasing wave of enemy projectiles. The only goal is to achieve the highest possible score by surviving for as long as you can.

## 2. Core Concepts
*   **Minimalist Visuals:** The game will use a crisp, retro, vector-graphics style. The player's ship will be a triangle, enemies will be squares, and projectiles will be circles. This creates a stylish look that can be generated entirely with code.
*   **Real-Time Action:** This will be our first real-time game. The player will use the keyboard (WASD or arrow keys) to move their ship and dodge projectiles in a fast-paced environment.
*   **Escalating Challenge:** The game starts simple but ramps up quickly. More enemies will spawn over time, and they will use more complex and difficult-to-dodge firing patterns.
*   **High-Score Chase:** The score is simply how long you survive. The game will feature a local high-score board, encouraging replayability as you try to beat your own best time.

## 3. Gameplay Loop
1.  The game begins with the player's ship at the center of the screen.
2.  Enemies appear at the edges of the screen.
3.  Enemies fire projectiles towards the player.
4.  The player must maneuver their ship to dodge the incoming fire.
5.  If the player's ship is hit, the game ends instantly.
6.  The final survival time is displayed, and the high score is updated if necessary.

## 4. Technical Plan
*   **Platform:** Web Browser (HTML, CSS, and JavaScript).
*   **`index.html`:** A basic HTML file to serve as the container for the game's canvas.
*   **`style.css`:** A stylesheet to center the game and give the page a clean, dark look.
*   **`game.js`:** The heart of the project. It will contain all the game logic, including:
    *   A main game loop using `requestAnimationFrame` for smooth animation.
    *   Classes for the `Player`, `Enemy`, and `Projectile` objects.
    *   Rendering logic using the HTML5 Canvas API to draw the vector shapes.
    *   Keyboard event listeners to handle player input.
    *   Collision detection logic to determine if the player has been hit.
