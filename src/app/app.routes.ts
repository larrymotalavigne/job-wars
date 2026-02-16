import { Routes } from '@angular/router';
import { CardGalleryComponent } from './components/card-gallery/card-gallery.component';
import { PrintSheetComponent } from './components/print-sheet/print-sheet.component';
import { RulesComponent } from './components/rules/rules.component';
import { DeckBuilderComponent } from './components/deck-builder/deck-builder.component';
import { GameLobbyComponent } from './components/game/game-lobby/game-lobby.component';
import { GameBoardComponent } from './components/game/game-board/game-board.component';
import { StatsComponent } from './components/stats/stats.component';
import { CollectionComponent } from './components/collection/collection.component';
import { QuestsComponent } from './components/quests/quests.component';
import { RankedComponent } from './components/ranked/ranked.component';
import { BattlePassComponent } from './components/battle-pass/battle-pass.component';
import { CosmeticsComponent } from './components/cosmetics/cosmetics.component';
import { ProfileComponent } from './components/profile/profile.component';
import { gameGuard } from './guards/game.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'gallery', pathMatch: 'full' },
  { path: 'gallery', component: CardGalleryComponent },
  { path: 'collection', component: CollectionComponent },
  { path: 'deck-builder', component: DeckBuilderComponent },
  { path: 'deck-builder/:deckId', component: DeckBuilderComponent },
  { path: 'print', component: PrintSheetComponent },
  { path: 'rules', component: RulesComponent },
  { path: 'game', component: GameLobbyComponent },
  { path: 'game/play', component: GameBoardComponent, canActivate: [gameGuard], data: { hideNav: true } },
  { path: 'stats', component: StatsComponent },
  { path: 'quests', component: QuestsComponent },
  { path: 'ranked', component: RankedComponent },
  { path: 'battle-pass', component: BattlePassComponent },
  { path: 'cosmetics', component: CosmeticsComponent },
  { path: 'profile', component: ProfileComponent },
];
