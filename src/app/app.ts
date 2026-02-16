import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { Toast } from 'primeng/toast';
import { filter, map } from 'rxjs';
import { CollectionService } from './services/collection.service';
import { CurrencyService } from './services/currency.service';
import { QuestService } from './services/quest.service';
import { RankedService } from './services/ranked.service';
import { BattlePassService } from './services/battle-pass.service';
import { CosmeticsService } from './services/cosmetics.service';
import { ProfileService } from './services/profile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Menubar, Toast, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  hideNav = false;

  get balance$() {
    return this.currencyService.balance$;
  }

  menuItems: MenuItem[] = [
    { label: 'Galerie', icon: 'pi pi-th-large', routerLink: '/gallery' },
    { label: 'Collection', icon: 'pi pi-star', routerLink: '/collection' },
    { label: 'Constructeur', icon: 'pi pi-objects-column', routerLink: '/deck-builder' },
    { label: 'Jouer', icon: 'pi pi-play', routerLink: '/game' },
    { label: 'Quêtes', icon: 'pi pi-trophy', routerLink: '/quests' },
    { label: 'Battle Pass', icon: 'pi pi-gift', routerLink: '/battle-pass' },
    { label: 'Cosmétiques', icon: 'pi pi-palette', routerLink: '/cosmetics' },
    { label: 'Profil', icon: 'pi pi-user', routerLink: '/profile' },
    { label: 'Classé', icon: 'pi pi-shield', routerLink: '/ranked' },
    { label: 'Statistiques', icon: 'pi pi-chart-line', routerLink: '/stats' },
    { label: 'Imprimer', icon: 'pi pi-print', routerLink: '/print' },
    { label: 'Règles', icon: 'pi pi-book', routerLink: '/rules' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private collectionService: CollectionService,
    private currencyService: CurrencyService,
    private questService: QuestService,
    private rankedService: RankedService,
    private battlePassService: BattlePassService,
    private cosmeticsService: CosmeticsService,
    private profileService: ProfileService
  ) {
    // Initialize all services on first launch
    this.collectionService.initializeCollection();
    this.currencyService.initializeCurrency();
    this.questService.initializeQuests();
    this.rankedService.initializeRanked();
    this.battlePassService.initializeBattlePass();
    this.cosmeticsService.initializeCosmetics();
    this.profileService.initializeProfile();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => {
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        return r.snapshot.data;
      }),
    ).subscribe(data => {
      this.hideNav = !!data['hideNav'];
    });
  }
}
