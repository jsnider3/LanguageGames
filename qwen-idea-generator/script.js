// script.js

// Function to fetch and display a random idea
async function displayRandomIdea() {
    try {
        // Fetch the ideas from the local JSON file
        const response = await fetch('ideas.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Get a random idea from the array
        const ideas = data.ideas;
        const randomIndex = Math.floor(Math.random() * ideas.length);
        const idea = ideas[randomIndex];

        // Display the idea in the designated element
        const ideaDisplay = document.getElementById('idea-display');
        if (ideaDisplay) {
            ideaDisplay.textContent = idea;
        } else {
            console.error("Element with ID 'idea-display' not found.");
        }
    } catch (error) {
        console.error('Failed to fetch or display idea:', error);
        const ideaDisplay = document.getElementById('idea-display');
        if (ideaDisplay) {
            ideaDisplay.textContent = "Oops! Failed to load a new idea. Please try again.";
        }
    }
}

// Add event listener to the button
document.addEventListener('DOMContentLoaded', () => {
    const newIdeaBtn = document.getElementById('new-idea-btn');
    if (newIdeaBtn) {
        newIdeaBtn.addEventListener('click', displayRandomIdea);
    } else {
        console.error("Button with ID 'new-idea-btn' not found.");
    }

    // Display an initial idea when the page loads
    displayRandomIdea();
});