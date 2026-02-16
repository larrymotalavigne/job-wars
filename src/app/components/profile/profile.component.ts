import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ProgressBar } from 'primeng/progressbar';
import { Select } from 'primeng/select';
import { ProfileService } from '../../services/profile.service';
import { PlayerAvatar, PlayerTitle } from '../../models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Card, Button, InputText, ProgressBar, Select],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profile$ = this.profileService.profile$;
  avatars: PlayerAvatar[] = [];
  titles: PlayerTitle[] = [];

  selectedName = '';
  selectedAvatar = '';
  selectedTitle = '';

  constructor(public profileService: ProfileService) {}

  ngOnInit(): void {
    this.profileService.initializeProfile();
    this.loadCustomization();

    const profile = this.profileService.getProfile();
    this.selectedName = profile.displayName;
    this.selectedAvatar = profile.avatarId;
    this.selectedTitle = profile.titleId || '';
  }

  loadCustomization(): void {
    this.avatars = this.profileService.getAllAvatars();
    this.titles = this.profileService.getAllTitles();
  }

  saveName(): void {
    if (this.selectedName.trim()) {
      this.profileService.setDisplayName(this.selectedName.trim());
    }
  }

  saveAvatar(): void {
    this.profileService.setAvatar(this.selectedAvatar);
  }

  saveTitle(): void {
    if (this.selectedTitle) {
      this.profileService.setTitle(this.selectedTitle);
    } else {
      this.profileService.clearTitle();
    }
  }

  getAvatarOptions() {
    return this.avatars
      .filter(a => a.unlocked)
      .map(a => ({ label: a.name, value: a.id }));
  }

  getTitleOptions() {
    return [
      { label: 'Aucun titre', value: '' },
      ...this.titles
        .filter(t => t.unlocked)
        .map(t => ({ label: t.title, value: t.id }))
    ];
  }

  getXPProgress() {
    return this.profileService.getXPProgress();
  }
}
