import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIChart } from 'primeng/chart';
import { DeckStats } from '../../../models/deck.model';
import { DOMAIN_COLORS, Domain } from '../../../models/card.model';

@Component({
  selector: 'app-deck-stats',
  standalone: true,
  imports: [CommonModule, UIChart],
  templateUrl: './deck-stats.component.html',
  styleUrl: './deck-stats.component.scss',
})
export class DeckStatsComponent implements OnChanges {
  @Input() stats!: DeckStats;

  costCurveData: any;
  costCurveOptions: any;
  domainData: any;
  domainOptions: any;
  typeData: any;
  typeOptions: any;

  ngOnChanges() {
    this.buildCostCurve();
    this.buildDomainChart();
    this.buildTypeChart();
  }

  private buildCostCurve() {
    const maxCost = Math.max(7, ...Object.keys(this.stats.costCurve).map(Number));
    const labels = Array.from({ length: maxCost + 1 }, (_, i) => String(i));
    const data = labels.map(l => this.stats.costCurve[Number(l)] ?? 0);

    this.costCurveData = {
      labels,
      datasets: [
        {
          label: 'Cartes',
          data,
          backgroundColor: '#5b8def',
          borderRadius: 4,
        },
      ],
    };

    this.costCurveOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Coût' } },
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    };
  }

  private buildDomainChart() {
    const entries = Object.entries(this.stats.domainDistribution);
    const labels = entries.map(([k]) => k);
    const data = entries.map(([, v]) => v);
    const colors = labels.map(label => {
      const domainEntry = Object.entries(Domain).find(([, v]) => v === label);
      if (domainEntry) {
        const domainKey = domainEntry[1] as Domain;
        return DOMAIN_COLORS[domainKey]?.primary ?? '#999';
      }
      return '#999';
    });

    this.domainData = {
      labels,
      datasets: [{ data, backgroundColor: colors }],
    };

    this.domainOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    };
  }

  private buildTypeChart() {
    const entries = Object.entries(this.stats.typeDistribution);
    const labels = entries.map(([k]) => k);
    const data = entries.map(([, v]) => v);

    this.typeData = {
      labels,
      datasets: [
        {
          label: 'Cartes',
          data,
          backgroundColor: ['#5b8def', '#ef9a5b', '#8b5bef'],
          borderRadius: 4,
        },
      ],
    };

    this.typeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    };
  }
}
