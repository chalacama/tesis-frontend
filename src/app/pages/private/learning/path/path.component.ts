import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService} from '../../../../core/api/auth/auth.service'; // ajusta ruta a tu proyecto
import { User } from '../../../../core/api/auth/auth.interfaces';


@Component({
  selector: 'app-path',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.css']
})
export class PathComponent {
  private auth = inject(AuthService);
  user = signal<User | null>(this.auth.getCurrentUser());

  displayNameUpper = computed(() => {
    const u = this.user();
    if (!u) return 'USUARIO';
    const full = `${u.name ?? ''} ${u.lastname ?? ''}`.trim();
    return (full || u.username || 'Usuario').toUpperCase();
  });

  initials = computed(() => {
    const u = this.user();
    if (!u) return 'U';
    const src = `${u.name ?? ''} ${u.lastname ?? ''}`.trim() || u.username || 'U';
    return src
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  });

  avatarUrl = computed(() => this.user()?.profile_picture_url || null);
  username = computed(() => this.user()?.username ?? '');
  email = computed(() => (this.user() as any)?.email ?? ''); // si tienes email en User, ajusta
}

