import { Routes } from '@angular/router';
import { CardGalleryComponent } from './components/card-gallery/card-gallery.component';
import { PrintSheetComponent } from './components/print-sheet/print-sheet.component';
import { RulesComponent } from './components/rules/rules.component';

export const routes: Routes = [
  { path: '', redirectTo: 'gallery', pathMatch: 'full' },
  { path: 'gallery', component: CardGalleryComponent },
  { path: 'print', component: PrintSheetComponent },
  { path: 'rules', component: RulesComponent },
];
