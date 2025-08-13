// script.js

// Fallback ideas in case JSON file is not accessible
const fallbackIdeas = [
    {
        title: "Word Association Chain",
        description: "Start with a word, and each player must say a word associated with the previous one. For example: 'Apple' -> 'Red' -> 'Fire' -> 'Heat'. Great for vocabulary building!"
    },
    {
        title: "Sentence Building Relay",
        description: "Players take turns adding one word to build a sentence. The challenge is to create a coherent sentence without planning ahead. Enhances grammar and creativity."
    },
    {
        title: "Picture Description Race",
        description: "Show a complex picture. Players have 30 seconds to memorize it, then describe as much as they can in the target language. Encourages detailed vocabulary usage."
    },
    {
        title: "Grammar Auction",
        description: "Give teams play money. Read out grammatically correct and incorrect sentences. Teams bid on correct ones. Most money wins. Reinforces grammar rules playfully."
    },
    {
        title: "Back-to-Back Drawing",
        description: "One player describes a simple image without naming it, the other draws it. Switch roles. Excellent for practicing descriptive language and prepositions."
    }
];

// Translations for multi-language support
const translations = {
    en: {
        title: "Language Learning Game Idea Generator",
        generateIdeas: "Generate Ideas",
        searchPlaceholder: "Search ideas...",
        search: "Search",
        ideaCount: "Number of ideas:",
        exportIdeas: "Export Ideas",
        viewFavorites: "View Favorites",
        recentIdeas: "Recent Ideas",
        favoriteIdeas: "Favorite Ideas",
        clearFavorites: "Clear All Favorites",
        ideaPlaceholder: "Your ideas will appear here...",
        loading: "Generating ideas...",
        noFavorites: "No favorite ideas yet. Click the heart icon on an idea to save it here.",
        noHistory: "No recent ideas. Generate some ideas to see them here.",
        copied: "Copied to clipboard!",
        error: "Failed to load new ideas. Showing classic ideas."
    },
    es: {
        title: "Generador de Ideas de Juegos para Aprender Idiomas",
        generateIdeas: "Generar Ideas",
        searchPlaceholder: "Buscar ideas...",
        search: "Buscar",
        ideaCount: "Número de ideas:",
        exportIdeas: "Exportar Ideas",
        viewFavorites: "Ver Favoritos",
        recentIdeas: "Ideas Recientes",
        favoriteIdeas: "Ideas Favoritas",
        clearFavorites: "Borrar Todos los Favoritos",
        ideaPlaceholder: "Tus ideas aparecerán aquí...",
        loading: "Generando ideas...",
        noFavorites: "Aún no hay ideas favoritas. Haz clic en el icono del corazón en una idea para guardarla aquí.",
        noHistory: "No hay ideas recientes. Genera algunas ideas para verlas aquí.",
        copied: "¡Copiado al portapapeles!",
        error: "Error al cargar nuevas ideas. Mostrando ideas clásicas."
    },
    fr: {
        title: "Générateur d'Idées de Jeux pour Apprendre les Langues",
        generateIdeas: "Générer des Idées",
        searchPlaceholder: "Rechercher des idées...",
        search: "Recherche",
        ideaCount: "Nombre d'idées :",
        exportIdeas: "Exporter les Idées",
        viewFavorites: "Voir les Favoris",
        recentIdeas: "Idées Récentes",
        favoriteIdeas: "Idées Favorites",
        clearFavorites: "Effacer Tous les Favoris",
        ideaPlaceholder: "Vos idées apparaîtront ici...",
        loading: "Génération d'idées...",
        noFavorites: "Pas encore d'idées favorites. Cliquez sur l'icône de cœur sur une idée pour la sauvegarder ici.",
        noHistory: "Pas d'idées récentes. Générez des idées pour les voir ici.",
        copied: "Copié dans le presse-papiers !",
        error: "Échec du chargement de nouvelles idées. Affichage des idées classiques."
    },
    de: {
        title: "Generator für Sprachlernspiel-Ideen",
        generateIdeas: "Ideen generieren",
        searchPlaceholder: "Ideas suchen...",
        search: "Suchen",
        ideaCount: "Anzahl der Ideen:",
        exportIdeas: "Ideas exportieren",
        viewFavorites: "Favoriten anzeigen",
        recentIdeas: "Letzte Ideen",
        favoriteIdeas: "Lieblingsideen",
        clearFavorites: "Alle Favoriten löschen",
        ideaPlaceholder: "Ihre Ideen werden hier erscheinen...",
        loading: "Ideas generieren...",
        noFavorites: "Noch keine Lieblingsideen. Klicken Sie auf das Herz-Symbol bei einer Idee, um sie hier zu speichern.",
        noHistory: "Keine kürzlichen Ideen. Generieren Sie einige Ideen, um sie hier zu sehen.",
        copied: "In die Zwischenablage kopiert!",
        error: "Fehler beim Laden neuer Ideen. Klassische Ideen werden angezeigt."
    }
};

let ideas = [];
let recentIdeas = []; // To track recently shown ideas and avoid repetition
let favoriteIdeas = []; // To store user's favorite ideas
const MAX_RECENT_IDEAS = 10; // Keep track of last 10 ideas to avoid immediate repeats

// DOM Elements
const elements = {
    generateBtn: null,
    ideaContainer: null,
    ideaPlaceholder: null,
    loading: null,
    ideaCountSelect: null,
    errorMessage: null,
    historyList: null,
    searchInput: null,
    searchBtn: null,
    exportBtn: null,
    favoritesBtn: null,
    favoritesContainer: null,
    favoritesList: null,
    clearFavoritesBtn: null,
    favoritesCount: null,
    darkModeToggle: null,
    languageSelect: null
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    elements.generateBtn = document.getElementById('generate-btn');
    elements.ideaContainer = document.getElementById('idea-container');
    elements.ideaPlaceholder = document.getElementById('idea-placeholder');
    elements.loading = document.getElementById('loading');
    elements.ideaCountSelect = document.getElementById('idea-count');
    elements.errorMessage = document.getElementById('error-message');
    elements.historyList = document.getElementById('history-list');
    elements.searchInput = document.getElementById('search-input');
    elements.searchBtn = document.getElementById('search-btn');
    elements.exportBtn = document.getElementById('export-btn');
    elements.favoritesBtn = document.getElementById('favorites-btn');
    elements.favoritesContainer = document.getElementById('favorites-container');
    elements.favoritesList = document.getElementById('favorites-list');
    elements.clearFavoritesBtn = document.getElementById('clear-favorites-btn');
    elements.favoritesCount = document.getElementById('favorites-count');
    elements.darkModeToggle = document.getElementById('dark-mode-toggle');
    elements.languageSelect = document.getElementById('language-select');
    
    // Load ideas on page load
    fetchIdeas();
    
    // Load favorites from localStorage
    loadFavorites();
    
    // Set up event listeners
    setupEventListeners();
    
    // Apply initial theme
    applyTheme();
    
    // Set initial language
    updateLanguage();
});

// Set up event listeners
function setupEventListeners() {
    if (elements.generateBtn) {
        elements.generateBtn.addEventListener('click', handleGenerateClick);
    }
    
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', handleSearch);
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', exportIdeas);
    }
    
    if (elements.favoritesBtn) {
        elements.favoritesBtn.addEventListener('click', toggleFavorites);
    }
    
    if (elements.clearFavoritesBtn) {
        elements.clearFavoritesBtn.addEventListener('click', clearFavorites);
    }
    
    if (elements.darkModeToggle) {
        elements.darkModeToggle.addEventListener('change', toggleDarkMode);
    }
    
    if (elements.languageSelect) {
        elements.languageSelect.addEventListener('change', updateLanguage);
    }
}

// Fetch ideas from JSON file
async function fetchIdeas() {
    try {
        const response = await fetch('ideas.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        ideas = data.ideas || [];
        console.log('Ideas loaded:', ideas);
        hideError();
    } catch (error) {
        console.error('Failed to load ideas.json, using fallback ideas:', error);
        ideas = fallbackIdeas;
        showError(getTranslation('error'));
    }
}

// Show error message
function showError(message) {
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.remove('hidden');
    }
}

// Hide error message
function hideError() {
    if (elements.errorMessage) {
        elements.errorMessage.classList.add('hidden');
    }
}

// Get a random idea from the list, avoiding recent repeats
function getRandomIdea() {
    if (ideas.length === 0) {
        return { title: "No Ideas Available", description: "Please check the ideas source." };
    }

    // Filter out recent ideas
    const availableIdeas = ideas.filter(idea => !recentIdeas.includes(idea.title));

    // If all ideas are recent, reset the recent ideas list
    if (availableIdeas.length === 0) {
        recentIdeas = [];
        return ideas[Math.floor(Math.random() * ideas.length)];
    }

    // Select a random idea from available ones
    const selectedIdea = availableIdeas[Math.floor(Math.random() * availableIdeas.length)];
    
    // Add to recent ideas
    recentIdeas.push(selectedIdea.title);
    if (recentIdeas.length > MAX_RECENT_IDEAS) {
        recentIdeas.shift(); // Remove oldest
    }

    return selectedIdea;
}

// Create an idea card element
function createIdeaCard(idea, isFavorite = false) {
    const card = document.createElement('div');
    card.className = 'idea-card';
    card.innerHTML = `
        <div class="idea-title">${idea.title}</div>
        <div class="idea-description">${idea.description}</div>
        <div class="idea-actions">
            <button class="idea-btn favorite ${isFavorite ? 'favorited' : ''}" data-title="${idea.title}">
                <i class="fas fa-heart${isFavorite ? '' : '-o'}"></i>
            </button>
            <button class="idea-btn share" data-title="${idea.title}" data-description="${idea.description}">
                <i class="fas fa-share-alt"></i>
            </button>
            <button class="idea-btn copy" data-title="${idea.title}" data-description="${idea.description}">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    
    // Add event listeners for the buttons
    const favoriteBtn = card.querySelector('.idea-btn.favorite');
    const shareBtn = card.querySelector('.idea-btn.share');
    const copyBtn = card.querySelector('.idea-btn.copy');
    
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(idea);
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareIdea(idea);
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyIdea(idea);
        });
    }
    
    return card;
}

// Display multiple ideas in the container
function displayIdeas(ideasToShow) {
    // Hide placeholder and loading
    if (elements.ideaPlaceholder) elements.ideaPlaceholder.classList.add('hidden');
    if (elements.loading) elements.loading.classList.add('hidden');

    // Clear container
    if (elements.ideaContainer) elements.ideaContainer.innerHTML = '';

    // Display ideas
    if (elements.ideaContainer) {
        ideasToShow.forEach(idea => {
            const isFavorite = favoriteIdeas.some(fav => fav.title === idea.title);
            const ideaCard = createIdeaCard(idea, isFavorite);
            elements.ideaContainer.appendChild(ideaCard);
        });
    }

    // Add to history
    addToHistory(ideasToShow);
}

// Add ideas to history
function addToHistory(ideasToShow) {
    if (!elements.historyList) return;
    
    // Add each idea to the top of the history list
    ideasToShow.slice().reverse().forEach(idea => {
        const historyItem = document.createElement('li');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-title">${idea.title}</div>
            <div class="history-description">${idea.description}</div>
        `;
        elements.historyList.insertBefore(historyItem, elements.historyList.firstChild);
    });

    // Limit history to 20 items
    while (elements.historyList.children.length > 20) {
        elements.historyList.removeChild(elements.historyList.lastChild);
    }
    
    // Show message if no history
    if (elements.historyList.children.length === 0) {
        const noHistory = document.createElement('li');
        noHistory.className = 'history-item';
        noHistory.textContent = getTranslation('noHistory');
        elements.historyList.appendChild(noHistory);
    }
}

// Handle button click
function handleGenerateClick() {
    const count = elements.ideaCountSelect ? parseInt(elements.ideaCountSelect.value) : 1;

    // Clear previous ideas and error message
    if (elements.ideaContainer) elements.ideaContainer.innerHTML = '';
    hideError();

    // Show loading
    if (elements.ideaPlaceholder) elements.ideaPlaceholder.classList.add('hidden');
    if (elements.loading) elements.loading.classList.remove('hidden');

    // Ensure ideas are loaded
    if (ideas.length === 0) {
        fetchIdeas().then(() => {
            // Small delay to show loading animation
            setTimeout(() => {
                const ideasToShow = [];
                for (let i = 0; i < count; i++) {
                    ideasToShow.push(getRandomIdea());
                }
                displayIdeas(ideasToShow);
            }, 600);
        });
    } else {
        // Small delay to show loading animation
        setTimeout(() => {
            const ideasToShow = [];
            for (let i = 0; i < count; i++) {
                ideasToShow.push(getRandomIdea());
            }
            displayIdeas(ideasToShow);
        }, 600);
    }
}

// Handle search
function handleSearch() {
    const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    
    if (!searchTerm) {
        // If search is empty, generate new ideas
        handleGenerateClick();
        return;
    }
    
    // Filter ideas based on search term
    const filteredIdeas = ideas.filter(idea => 
        idea.title.toLowerCase().includes(searchTerm) || 
        idea.description.toLowerCase().includes(searchTerm)
    );
    
    // Display filtered ideas
    if (elements.ideaContainer) {
        elements.ideaContainer.innerHTML = '';
        
        if (filteredIdeas.length > 0) {
            filteredIdeas.forEach(idea => {
                const isFavorite = favoriteIdeas.some(fav => fav.title === idea.title);
                const ideaCard = createIdeaCard(idea, isFavorite);
                elements.ideaContainer.appendChild(ideaCard);
            });
        } else {
            // Show message if no ideas found
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = `No ideas found for "${searchTerm}". Try a different search term.`;
            elements.ideaContainer.appendChild(noResults);
        }
    }
    
    hideError();
}

// Toggle favorite status of an idea
function toggleFavorite(idea) {
    const index = favoriteIdeas.findIndex(fav => fav.title === idea.title);
    
    if (index >= 0) {
        // Remove from favorites
        favoriteIdeas.splice(index, 1);
    } else {
        // Add to favorites
        favoriteIdeas.push(idea);
    }
    
    // Save to localStorage
    saveFavorites();
    
    // Update UI
    updateFavoritesCount();
    updateFavoriteButtons();
    
    // Update favorites list if visible
    if (elements.favoritesContainer && !elements.favoritesContainer.classList.contains('hidden')) {
        displayFavorites();
    }
}

// Update favorite buttons in the UI
function updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.idea-btn.favorite');
    favoriteButtons.forEach(btn => {
        const title = btn.getAttribute('data-title');
        const isFavorite = favoriteIdeas.some(fav => fav.title === title);
        
        if (isFavorite) {
            btn.classList.add('favorited');
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '<i class="fas fa-heart-o"></i>';
        }
    });
}

// Save favorites to localStorage
function saveFavorites() {
    localStorage.setItem('favoriteIdeas', JSON.stringify(favoriteIdeas));
}

// Load favorites from localStorage
function loadFavorites() {
    const savedFavorites = localStorage.getItem('favoriteIdeas');
    if (savedFavorites) {
        try {
            favoriteIdeas = JSON.parse(savedFavorites);
            updateFavoritesCount();
        } catch (e) {
            console.error('Failed to parse favorite ideas from localStorage', e);
            favoriteIdeas = [];
        }
    }
}

// Update favorites count display
function updateFavoritesCount() {
    if (elements.favoritesCount) {
        elements.favoritesCount.textContent = favoriteIdeas.length;
    }
}

// Display favorites
function displayFavorites() {
    if (!elements.favoritesList) return;
    
    // Clear the list
    elements.favoritesList.innerHTML = '';
    
    // Add favorites to the list
    if (favoriteIdeas.length > 0) {
        favoriteIdeas.forEach(idea => {
            const favoriteItem = document.createElement('li');
            favoriteItem.className = 'favorite-item';
            favoriteItem.innerHTML = `
                <div class="favorite-title">${idea.title}</div>
                <div class="favorite-description">${idea.description}</div>
                <button class="remove-favorite" data-title="${idea.title}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add event listener to remove button
            const removeBtn = favoriteItem.querySelector('.remove-favorite');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFavorite(idea.title);
                });
            }
            
            elements.favoritesList.appendChild(favoriteItem);
        });
    } else {
        // Show message if no favorites
        const noFavorites = document.createElement('li');
        noFavorites.className = 'favorite-item';
        noFavorites.textContent = getTranslation('noFavorites');
        elements.favoritesList.appendChild(noFavorites);
    }
}

// Remove a favorite idea
function removeFavorite(title) {
    favoriteIdeas = favoriteIdeas.filter(idea => idea.title !== title);
    saveFavorites();
    updateFavoritesCount();
    updateFavoriteButtons();
    
    // Update favorites list if visible
    if (elements.favoritesContainer && !elements.favoritesContainer.classList.contains('hidden')) {
        displayFavorites();
    }
}

// Clear all favorites
function clearFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        favoriteIdeas = [];
        saveFavorites();
        updateFavoritesCount();
        updateFavoriteButtons();
        
        // Update favorites list if visible
        if (elements.favoritesContainer && !elements.favoritesContainer.classList.contains('hidden')) {
            displayFavorites();
        }
    }
}

// Toggle favorites view
function toggleFavorites() {
    if (!elements.favoritesContainer) return;
    
    const isHidden = elements.favoritesContainer.classList.contains('hidden');
    
    if (isHidden) {
        // Show favorites
        elements.favoritesContainer.classList.remove('hidden');
        displayFavorites();
    } else {
        // Hide favorites
        elements.favoritesContainer.classList.add('hidden');
    }
}

// Export ideas to a text file
function exportIdeas() {
    // Get all ideas currently displayed
    const ideaElements = document.querySelectorAll('.idea-card');
    
    if (ideaElements.length === 0) {
        alert('No ideas to export. Generate some ideas first.');
        return;
    }
    
    let exportText = 'Language Learning Game Ideas\n\n';
    
    ideaElements.forEach((element, index) => {
        const title = element.querySelector('.idea-title').textContent;
        const description = element.querySelector('.idea-description').textContent;
        exportText += `${index + 1}. ${title}\n${description}\n\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'language-learning-ideas.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Share an idea (using Web Share API if available)
function shareIdea(idea) {
    const shareData = {
        title: idea.title,
        text: idea.description,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback: copy to clipboard
        copyIdea(idea);
    }
}

// Copy an idea to clipboard
function copyIdea(idea) {
    const text = `${idea.title}\n${idea.description}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification(getTranslation('copied'));
            })
            .catch((error) => {
                console.error('Failed to copy text: ', error);
                // Fallback to prompt
                prompt('Copy to clipboard: Ctrl+C, Enter', text);
            });
    } else {
        // Fallback to prompt
        prompt('Copy to clipboard: Ctrl+C, Enter', text);
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #2ecc71;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Toggle dark mode
function toggleDarkMode() {
    if (elements.darkModeToggle.checked) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', elements.darkModeToggle.checked);
}

// Apply theme based on localStorage or system preference
function applyTheme() {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedDarkMode !== null) {
        const isDarkMode = savedDarkMode === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        if (elements.darkModeToggle) {
            elements.darkModeToggle.checked = isDarkMode;
        }
    } else if (prefersDarkScheme) {
        document.body.classList.add('dark-mode');
        if (elements.darkModeToggle) {
            elements.darkModeToggle.checked = true;
        }
    }
}

// Update language
function updateLanguage() {
    const selectedLanguage = elements.languageSelect ? elements.languageSelect.value : 'en';
    
    // Update page title
    document.title = getTranslation('title', selectedLanguage);
    
    // Update specific elements
    if (document.querySelector('h1')) {
        document.querySelector('h1').textContent = getTranslation('title', selectedLanguage);
    }
    
    if (elements.generateBtn) {
        elements.generateBtn.textContent = getTranslation('generateIdeas', selectedLanguage);
    }
    
    if (elements.searchInput) {
        elements.searchInput.placeholder = getTranslation('searchPlaceholder', selectedLanguage);
    }
    
    if (elements.searchBtn) {
        elements.searchBtn.innerHTML = `<i class="fas fa-search"></i> ${getTranslation('search', selectedLanguage)}`;
    }
    
    if (document.querySelector('label[for="idea-count"]')) {
        document.querySelector('label[for="idea-count"]').textContent = getTranslation('ideaCount', selectedLanguage);
    }
    
    if (elements.exportBtn) {
        elements.exportBtn.innerHTML = `<i class="fas fa-download"></i> ${getTranslation('exportIdeas', selectedLanguage)}`;
    }
    
    if (elements.favoritesBtn) {
        elements.favoritesBtn.innerHTML = `<i class="fas fa-heart"></i> ${getTranslation('viewFavorites', selectedLanguage)} (<span id="favorites-count">${favoriteIdeas.length}</span>)`;
        // Update the favorites count reference
        elements.favoritesCount = document.getElementById('favorites-count');
    }
    
    if (document.querySelector('#history-container h2')) {
        document.querySelector('#history-container h2').textContent = getTranslation('recentIdeas', selectedLanguage);
    }
    
    if (document.querySelector('#favorites-container h2')) {
        document.querySelector('#favorites-container h2').textContent = getTranslation('favoriteIdeas', selectedLanguage);
    }
    
    if (elements.clearFavoritesBtn) {
        elements.clearFavoritesBtn.textContent = getTranslation('clearFavorites', selectedLanguage);
    }
    
    if (elements.ideaPlaceholder) {
        elements.ideaPlaceholder.textContent = getTranslation('ideaPlaceholder', selectedLanguage);
    }
    
    if (elements.loading) {
        elements.loading.querySelector('p').textContent = getTranslation('loading', selectedLanguage);
    }
    
    // Save selected language
    localStorage.setItem('language', selectedLanguage);
}

// Get translation for a key
function getTranslation(key, language = null) {
    const lang = language || (elements.languageSelect ? elements.languageSelect.value : 'en');
    return translations[lang] && translations[lang][key] ? translations[lang][key] : translations['en'][key];
}