import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Button } from 'primeng/button';
import { CardComponent, CardDesign } from '../card/card.component';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-print-sheet',
  standalone: true,
  imports: [CommonModule, Button, CardComponent],
  templateUrl: './print-sheet.component.html',
  styleUrl: './print-sheet.component.scss',
})
export class PrintSheetComponent implements OnInit {
  cards: Card[] = [];
  pages: Card[][] = [];
  design: CardDesign = 'classique';

  constructor(
    private route: ActivatedRoute,
    private cardService: CardService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['design']) {
        this.design = params['design'] as CardDesign;
      }
      if (params['cards']) {
        const ids = params['cards'].split(',');
        this.cards = ids
          .map((id: string) => this.cardService.getCardById(id))
          .filter((c: Card | undefined): c is Card => !!c);
      } else {
        this.cards = this.cardService.getAllCards();
      }
      this.paginateCards();
    });
  }

  paginateCards() {
    this.pages = [];
    for (let i = 0; i < this.cards.length; i += 9) {
      this.pages.push(this.cards.slice(i, i + 9));
    }
  }

  print() {
    window.print();
  }
}
