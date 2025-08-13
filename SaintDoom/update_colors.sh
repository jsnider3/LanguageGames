#!/bin/bash

# Update enemy files with theme imports
for file in /mnt/c/Users/josh/OneDrive/Documents/Git/LanguageGames/SaintDoom/enemies/*.js; do
  if ! grep -q "import { THEME }" "$file"; then
    # Add THEME import after BaseEnemy import
    sed -i "/import { BaseEnemy }/a\import { THEME } from '../modules/config/theme.js';" "$file"
  fi
done

# Update boss files with theme imports
for file in /mnt/c/Users/josh/OneDrive/Documents/Git/LanguageGames/SaintDoom/bosses/*.js; do
  if ! grep -q "import { THEME }" "$file"; then
    # Add THEME import after BaseEnemy import
    sed -i "/import { BaseEnemy }/a\import { THEME } from '../modules/config/theme.js';" "$file"
  fi
done

# Update visual effects
file="/mnt/c/Users/josh/OneDrive/Documents/Git/LanguageGames/SaintDoom/effects/visualEffects.js"
if ! grep -q "import { THEME }" "$file"; then
  sed -i "1a\import { THEME } from '../modules/config/theme.js';" "$file"
fi

echo "Theme imports added to all relevant files"