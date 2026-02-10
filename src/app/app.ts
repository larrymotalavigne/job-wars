import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Menubar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  menuItems: MenuItem[] = [
    { label: 'Galerie', icon: 'pi pi-th-large', routerLink: '/gallery' },
    { label: 'Constructeur', icon: 'pi pi-objects-column', routerLink: '/deck-builder' },
    { label: 'Imprimer', icon: 'pi pi-print', routerLink: '/print' },
    { label: 'Règles', icon: 'pi pi-book', routerLink: '/rules' },
  ];
}
