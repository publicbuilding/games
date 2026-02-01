# PublicBuilding Games

A collection of freemium web games, designed for browser and mobile.

## Games

| Game | Description | Status |
|------|-------------|--------|
| 🐍 Snake | Classic snake with modern twists | In Development |
| 🃏 Poker | Texas Hold'em simulator with AI | In Development |
| 🏰 World Builder | Anno-style city/economy builder | In Development |

## Tech Stack

- HTML5 Canvas
- TypeScript
- Vite (build tool)
- Mobile-first responsive design

## Development

```bash
# Install dependencies
npm install

# Run individual games
npm run dev:snake
npm run dev:poker
npm run dev:worldbuilder

# Build all
npm run build

# Test all
npm test
```

## Structure

```
games/
├── snake/          # Snake game
├── poker/          # Poker simulator
├── worldbuilder/   # Anno-style builder
└── shared/         # Common utilities, UI components
```

## License

MIT
