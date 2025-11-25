import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { User } from '../../../../core/api/auth/auth.interfaces';
import { IconComponent } from '../../../../shared/UI/components/button/icon/icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  datosUsuario$!: Observable<User | null>;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.datosUsuario$ = this.auth.currentUser;
  }

  getFullName(u: User | null | undefined): string {
    if (!u) return '';
    const n = (u.name || '').trim();
    const ln = (u.lastname || '').trim();
    const full = [n, ln].filter(Boolean).join(' ');
    return full || (u.username || '');
  }

  getInitialsFromUser(u: User | null | undefined): string {
    if (!u) return 'U';
    const base = this.getFullName(u) || u.username || 'U';
    return base.split(/\s+/).slice(0,2).map(p => p[0]?.toUpperCase() || '').join('') || 'U';
  }
}
