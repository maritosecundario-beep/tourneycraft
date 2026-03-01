# **App Name**: TourneyCraft

## Core Features:

- Team & Player Creation: Create and manage teams with custom names, abbreviations, ratings, visual assets (crest, kit, stadium). Also, create and manage players with attributes (shoot, defense), monetary value, jersey number, and position, either assigned to a team or as free agents.
- Global Settings Configuration: Configure global app settings such as default currency name ('CR'), customizable player positions, and various visual themes.
- Tournament Setup: Define new tournaments by setting a name, selecting a sport (predefined or custom), choosing a mode (Normal or Arcade), and configuring scoring rules (e.g., 'N to N range', 'best of N', 'first to N'). Select between League (single table, groups, conferences) or Knockout formats.
- Dynamic Tournament Adjustments: Modify tournament settings even after creation, including initial team economics (earnings for win/loss/draw) and the variability of these earnings for unpredictability.
- Automated Fixture Generator Tool: Generate tournament calendars and schedules automatically, ensuring each team plays a single game per matchday if the user opts out of manual calendar creation.
- Match Simulation Engine: Simulate individual matches or entire tournaments based on team ratings (higher rating increases win probability) and defined scoring rules. This includes specific simulation logic for different game endings and simulating non-user-controlled matches in Arcade mode, as well as all matches in Normal mode.
- Arcade Mode Player Management: In Arcade mode's dual league feature, users control which player participates in each primary league match. For AI-controlled teams, players with higher monetary value have a 70% chance of playing in the primary league.

## Style Guidelines:

- Color scheme: Dark theme, reflecting a structured and strategic environment for managing complex data and customizable elements.
- Primary color: A vibrant yet stable blue (#3D8CFF), conveying reliability, strategy, and focus, with good contrast against a dark background.
- Background color: A very dark, subtle blue-gray (#1B1E22), creating a sophisticated and data-friendly backdrop that minimizes eye strain.
- Accent color: A lively aqua (#33DAFF), analogous to the primary but distinct in hue and brightness, used for highlights, interactive elements, and key information.
- Headline and Body text font: 'Inter' (sans-serif) for its modern, neutral, and highly readable design, suitable for displaying data-rich content, configurations, and detailed lists clearly.
- Use a mix of sport-specific icons (e.g., footballs, trophies) and abstract icons (e.g., gears, sliders) to represent tournament elements and customization options, maintaining a consistent, clean vector style.
- Employ a modular and structured layout, utilizing clear card-based components for team and player profiles, tabular displays for league standings, and step-by-step forms for tournament creation to ensure ease of navigation and data entry.
- Implement subtle, unobtrusive animations for state changes, navigation transitions, and data updates (e.g., scoreboard changes), providing visual feedback without distracting from the primary task of data management.