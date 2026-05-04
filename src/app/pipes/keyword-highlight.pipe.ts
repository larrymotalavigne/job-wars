import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { KEYWORD_PATTERNS } from '../models/game.model';

const KEYWORD_COLORS: Record<string, string> = {
  'Première Frappe': '#e65100',
  Célérité: '#2e7d32',
  Construction: '#795548',
  Portée: '#1565c0',
};

@Pipe({ name: 'keywordHighlight', standalone: true })
export class KeywordHighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return text;

    let result = text;
    for (const [keyword, pattern] of Object.entries(KEYWORD_PATTERNS)) {
      const color = KEYWORD_COLORS[keyword] ?? '#333';
      result = result.replace(
        pattern,
        (match) =>
          `<span class="keyword-badge" style="background:${color};color:#fff;padding:1px 6px;border-radius:3px;font-size:0.85em;font-weight:600">${match}</span>`,
      );
    }

    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}
