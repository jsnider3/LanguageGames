# Language Learning Game Idea Generator

![Status](https://img.shields.io/badge/status-active-brightgreen)

A web-based tool that generates fun and creative game ideas for language learning. Whether you're a teacher looking for classroom activities or a student wanting to practice on your own, this generator provides instant inspiration.

## Features

- Generate 1, 3, or 5 random language learning game ideas with a single click
- View detailed descriptions for each idea
- See a history of recently generated ideas
- Search and filter ideas by keywords
- Save favorite ideas to a personal list
- Export generated ideas to a text file
- Share ideas via the Web Share API or copy to clipboard
- Dark mode toggle for comfortable viewing in any lighting
- Multi-language interface support (English, Spanish, French, German)
- Responsive design that works on desktop and mobile devices
- Fallback to classic ideas if new ideas can't be loaded
- Avoids showing the same idea multiple times in a row
- Enhanced animations and transitions for a polished user experience

## How It Works

1. Select how many ideas you'd like to generate (1, 3, or 5)
2. Click the "Generate Ideas" button
3. View your new ideas in the main display area
4. Use the action buttons on each idea card to:
   - Save to favorites (heart icon)
   - Share the idea (share icon)
   - Copy to clipboard (copy icon)
5. See your recently generated ideas in the history section
6. View your saved favorite ideas by clicking the "View Favorites" button

## Additional Features

- **Search**: Use the search bar to find specific ideas by keywords
- **Dark Mode**: Toggle dark mode using the sun/moon icon in the header
- **Language Selector**: Change the interface language using the dropdown in the top-right corner
- **Export**: Save your generated ideas to a text file with the "Export Ideas" button

## Running the Application

To run the application, you need to serve the files through a local web server due to browser security restrictions (CORS policy).

If you have Python installed, you can use the built-in HTTP server:

```bash
# Navigate to this directory
cd /path/to/this/directory

# Start the server (default port is 8000)
python -m http.server

# Or specify a port
python -m http.server 8000
```

Then, open your browser and go to `http://localhost:8000` (or the port you specified).

The application will load with a set of ideas and allow you to generate new ones with the click of a button.