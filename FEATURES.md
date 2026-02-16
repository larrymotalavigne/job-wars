# Job Wars - Feature Roadmap

This document outlines planned features for the Job Wars card game, organized by priority and implementation phases.

## Current Features ✅

- Card Collection system with unlock conditions
- Deck Builder with validation (30 cards, max copies)
- Single-player vs AI
- Online multiplayer (WebSocket-based)
- Statistics tracking (games, wins, win streaks, deck stats)
- Limited formats (Sealed and Draft) - basic implementation
- Tutorial system
- Game lobby with mode selection
- Sound effects
- Chat and emotes
- Deck import/export
- Turn timer
- Mulligan system
- Card printing sheets

---

## 🎯 Phase 1 - Core Engagement (3-4 months)

### 1. Daily Quests & Rewards System
**Priority**: High
**Business Value**: Increases daily active users and retention

Features:
- Daily login rewards (streak-based bonuses)
- Quest system with daily/weekly quests
  - Examples: "Play 3 games with Health domain", "Win with less than 10 reputation", "Play 10 Job cards"
- Quest progress tracking
- Reward currency (coins/gems) for unlocking specific cards
- Quest reroll system (1 free reroll per day)
- Notification system for completed quests

Technical Requirements:
- QuestService with quest types and progress tracking
- Reward currency system
- Quest completion UI overlay
- Integration with game events

### 2. Ranked/Competitive Mode
**Priority**: High
**Business Value**: Creates competitive progression beyond collection completion

Features:
- ELO/MMR rating system
- Rank tiers (Bronze, Silver, Gold, Platinum, Diamond, Master)
- Seasonal rankings with rewards
- Leaderboards (global, by domain)
- Rank-based matchmaking
- Rank history and progression tracking
- End-of-season rewards
- Ranked points visualization

Technical Requirements:
- RankingService with ELO calculation
- Season management system
- Matchmaking algorithm updates
- Ranked game mode in lobby
- Leaderboard API/service

### 3. Enhanced Tutorial
**Priority**: High
**Business Value**: Better onboarding = higher conversion

Features:
- Interactive step-by-step gameplay tutorial
- Domain-specific tutorials (showcase each domain's playstyle)
- Advanced mechanics tutorials (combat phases, effect targeting, keywords)
- Practice mode with AI (adjustable difficulty)
- Tutorial rewards (unlock starter cards)
- Skip option for experienced players
- Tutorial completion tracking

Technical Requirements:
- Extend existing TutorialService
- Interactive overlays with highlights
- Scripted AI opponents
- Progress checkpoints

### 4. Collection Filters & Search
**Priority**: Medium
**Business Value**: Improves user experience

Features:
- Advanced filtering (domain, cost, rarity, keyword, type)
- Text search by card name
- Card favorites/bookmarks
- "Cards I own" toggle
- Deck builder card suggestions based on domain synergy
- Missing cards indicator in deck builder
- Sort options (cost, name, rarity, domain)

Technical Requirements:
- Filter service/component
- LocalStorage for favorites
- Enhanced collection component
- Deck builder integration

---

## 💰 Phase 2 - Monetization (2-3 months)

### 5. Battle Pass / Season Pass
**Priority**: High
**Business Value**: Primary monetization opportunity

Features:
- Free track (all players)
- Premium track (purchasable)
- 50-100 progression levels
- Season-themed rewards (card cosmetics, currency, exclusive cards)
- Daily/weekly challenges for BP XP
- Level skip tokens
- Season duration: 8-12 weeks
- Season themes (e.g., "Tech Revolution", "Healthcare Heroes")

Technical Requirements:
- BattlePassService with progression tracking
- Season configuration system
- Reward distribution system
- Premium purchase flow
- BP progress UI component

### 6. Card Cosmetics & Customization
**Priority**: High
**Business Value**: Non-pay-to-win monetization

Features:
- Alternate card art (unlockable/purchasable)
- Animated card effects (entrance animations, glow effects)
- Foil/shiny card variants
- Custom card backs
- Card style collection system
- Preview system in collection
- In-game shop for cosmetics

Technical Requirements:
- Card variant system in card model
- Animation framework for cards
- Cosmetics inventory service
- Shop UI and purchase flow
- Asset pipeline for variants

### 7. Profile Customization
**Priority**: Medium
**Business Value**: Player identity and expression

Features:
- Player avatars (unlockable/purchasable)
- Titles/badges earned through achievements
- Profile borders/frames
- Expanded emote packs
- Profile showcase (favorite deck, stats display)
- Player level and XP system
- Profile viewing for other players

Technical Requirements:
- ProfileService with customization options
- Achievement system integration
- Profile UI component
- Cosmetics inventory
- Player level/XP tracking

---

## 🎮 Phase 3 - Community (2-3 months)

### 8. Friends System
**Priority**: High
**Business Value**: Social bonds increase retention

Features:
- Add/remove friends
- Friend requests and notifications
- Direct challenges
- Spectate friend games (observer mode)
- Friends leaderboard
- Online status indicators
- Friend activity feed

Technical Requirements:
- FriendService with relationship management
- Friend list UI
- Spectator mode implementation
- Real-time status updates via WebSocket

### 9. Deck Sharing & Meta Analysis
**Priority**: Medium
**Business Value**: Community engagement

Features:
- Public deck sharing with descriptions
- Deck ratings and comments
- "Copy deck" functionality
- Meta reports (most played cards/decks, win rates)
- Featured decks from top players
- Deck tags and categories
- Deck of the week

Technical Requirements:
- Deck repository/API
- Voting/rating system
- Meta analytics service
- Deck import from shared codes
- Public deck browser UI

### 10. Tournament System
**Priority**: Medium
**Business Value**: High-engagement competitive events

Features:
- Single-elimination brackets
- Swiss-style tournaments
- Entry fees (in-game currency) with prize pools
- Tournament history and rewards
- Scheduled tournaments (daily, weekly)
- Tournament spectating
- Tournament replays

Technical Requirements:
- TournamentService with bracket management
- Match scheduling system
- Tournament lobby and bracket UI
- Prize distribution
- Tournament history tracking

---

## 🎮 Phase 4 - Advanced Features (ongoing)

### 11. Campaign/Story Mode
**Priority**: Medium
**Business Value**: Solo player content and onboarding

Features:
- Progressive single-player challenges (easy → hard)
- Boss battles with special rules and unique decks
- Domain-specific storylines (20 campaigns, one per domain)
- Unlock cards through story completion
- Difficulty modes (normal, heroic)
- Campaign rewards and achievements

### 12. Guilds/Clans
**Priority**: Medium
**Business Value**: Community building and retention

Features:
- Create/join guilds (max members)
- Guild vs Guild tournaments
- Shared guild achievements
- Guild chat
- Guild leveling system
- Guild emblems/customization
- Guild leaderboards

### 13. Special Game Modes
**Priority**: Low
**Business Value**: Variety keeps game fresh

Features:
- Commander format (singleton decks, 40 cards)
- 2v2 team battles
- Domain-restricted modes (e.g., only Health + IT domains)
- Chaos mode (random effects each turn)
- Mirror match (both players use same deck)
- Rotating weekly modes

### 14. Replay System
**Priority**: Low
**Business Value**: Content creation and learning

Features:
- Save and watch game replays
- Share replays with URLs
- Highlight plays (automatically detect key moments)
- Learn from top players
- Replay analysis tools
- Download replays

---

## 🛠️ Quick Wins (Can implement quickly)

These features can be implemented in 1-2 weeks each:

### Achievements System
- Leverage existing stats service
- Define achievement categories (games played, wins, domains, streaks)
- Achievement pop-ups
- Achievement rewards (cosmetics, currency)

### Card Back Customization
- Simple visual feature
- Add card back selection to profile
- Create 5-10 initial card backs
- Unlock conditions (achievements, BP rewards)

### Friend Challenges
- Extend existing multiplayer service
- Add "Challenge Friend" button
- Challenge notification system
- Friend match history

### Deck Templates
- Use existing starter decks infrastructure
- Create 10-15 templates per domain
- Template browser with previews
- "Import template" functionality

### Statistics Dashboard Enhancement
- Already have stats, improve visualization
- Add charts (Chart.js already included)
- Win rate over time
- Most played domains
- Performance trends

---

## 💡 Feature Dependencies

**Must be implemented first:**
- Currency System (needed for: Quests, Shop, Battle Pass, Tournaments)
- Achievement System (needed for: Profile Customization, Quests, Unlocks)
- Season System (needed for: Battle Pass, Ranked, Limited Events)

**Can be implemented independently:**
- Collection Filters
- Enhanced Tutorial
- Deck Sharing
- Replay System

---

## 📊 Success Metrics

**Phase 1 Metrics:**
- Daily Active Users (DAU) increase by 40%
- Average session length increase by 25%
- 7-day retention increase by 30%
- New player completion rate (tutorial) > 70%

**Phase 2 Metrics:**
- Conversion rate (free to paying) > 5%
- Average Revenue Per User (ARPU) > $2
- Battle Pass completion rate > 40%
- Cosmetic purchase rate > 15%

**Phase 3 Metrics:**
- Friend connections per user > 3
- Tournament participation rate > 20%
- Deck shares per week > 100
- Guild membership rate > 60%

---

## 🚀 Implementation Order

1. **Currency System** (foundation)
2. **Daily Quests & Rewards** (engagement)
3. **Ranked Mode** (competition)
4. **Collection Filters** (UX improvement)
5. **Battle Pass** (monetization)
6. **Card Cosmetics** (monetization)
7. **Profile Customization** (personalization)
8. **Friends System** (social)
9. **Tournament System** (events)
10. **Campaign Mode** (content)

---

## Notes

- All features should work offline-first with localStorage fallback
- Maintain non-pay-to-win design philosophy
- Ensure mobile-responsive design for all new UI
- Add analytics tracking for all new features
- Consider accessibility (keyboard navigation, screen readers)
- Maintain French language consistency (game is in French)
