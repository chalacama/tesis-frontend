import {
  Component,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import {
  InvitationService
} from '../../../../../core/api/course/invitation.service';

import {
  CollaboratorShowResponse,
  CollaboratorSlot,
  InvitationSearchUser
} from '../../../../../core/api/course/invitation.interface';

import {
  AuthService
} from '../../../../../core/api/auth/auth.service';
import { User } from '../../../../../core/api/auth/auth.interfaces';
import { AvatarComponent } from '../../../../../shared/UI/components/media/avatar/avatar.component';

type ConfirmActionType =
  | 'leave'
  | 'change'
  | 'deleteCollaborator'
  | 'deleteOwner'
  | 'cancelInvitation';

@Component({
  selector: 'app-invitation',
  standalone: true,
  imports: [CommonModule, LoadingBarComponent , AvatarComponent],
  templateUrl: './invitation.component.html',
  styleUrl: './invitation.component.css'
})
export class InvitationComponent implements OnInit {

  // Signals
  loading = signal(true);
  saving = signal(false);

  // Datos del backend
  vm = signal<CollaboratorShowResponse | null>(null);

  // Curso actual
  courseId!: number;

  // Usuario actual
  currentUser: User | null = null;
  isAdmin = false;
  isOwner = false;
  isCollaborator = false;
  canEdit = false;
  canInvite = false;

  // Búsqueda de usuarios para invitar
  searchQuery = signal('');
  searchResults: InvitationSearchUser[] = [];
  searching = signal(false);

  // Estado de confirmación
  confirmState = signal<{
    type: ConfirmActionType;
    payload?: any;
  } | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly invitationService: InvitationService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
  this.currentUser = this.authService.getCurrentUser();
  this.isAdmin = this.authService.hasRole('admin');

  // 1) Intentar leer desde el padre (studio/:id)
  const parentId = this.route.parent?.snapshot.paramMap.get('id');
  // 2) Fallback: por si algún día lo mueves a este mismo nivel
  const childId = this.route.snapshot.paramMap.get('id');

  const idParam = parentId ?? childId;

  this.courseId = idParam ? Number(idParam) : NaN;

  if (Number.isNaN(this.courseId)) {
    this.loading.set(false); // 🔴 IMPORTANTE: quitar el skeletor
    alert('El identificador del curso no es válido.');
    return;
  }

  this.loadData();
}


  // =======================
  // CARGA PRINCIPAL
  // =======================

  private loadData(): void {
    this.loading.set(true);

    this.invitationService.getCollaboratorInfo(this.courseId).subscribe({
      next: (res) => {
        this.vm.set(res);
        this.updateLocalRoleFlags(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  private updateLocalRoleFlags(res: CollaboratorShowResponse): void {
    const user = this.currentUser;
    this.isOwner = false;
    this.isCollaborator = false;

    if (user && res.owner && res.owner.id === user.id) {
      this.isOwner = true;
    }

    const slot = res.collaborator_slot;
    if (user && slot && !slot.is_invitation && slot.user.id === user.id) {
      this.isCollaborator = true;
    }

    this.canEdit = res.can_edit;
    this.canInvite = res.can_invite_collaborator;
  }

  // =======================
  // SLOTS / HELPERS
  // =======================

  get collaboratorSlot(): CollaboratorSlot {
    return this.vm()?.collaborator_slot ?? null;
  }

  get ownerUser() {
    return this.vm()?.owner ?? null;
  }

  // =======================
  // BÚSQUEDA E INVITACIÓN
  // =======================

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    if (!value || value.trim().length < 2) {
      this.searchResults = [];
      return;
    }
    this.searchUsers(value.trim());
  }

  private searchUsers(query: string): void {
    this.searching.set(true);
    this.invitationService.validateUser(query).subscribe({
      next: (res) => {
        this.searchResults = res.results;
        this.searching.set(false);
      },
      error: (err) => {
        this.searching.set(false);
        this.showError(err);
      }
    });
  }

  inviteUser(user: InvitationSearchUser): void {
    if (!user.email) return;

    if (!confirm(`¿Invitar a ${user.name} ${user.lastname} (${user.email}) como colaborador?`)) {
      return;
    }

    this.saving.set(true);
    this.invitationService.inviteCollaborator(this.courseId, user.email).subscribe({
      next: (res) => {
        this.saving.set(false);
        alert(res.message);
        this.searchQuery.set('');
        this.searchResults = [];
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  // =======================
  // CONFIRMACIONES
  // =======================

  openConfirm(type: ConfirmActionType, payload?: any): void {
    this.confirmState.set({ type, payload });
  }

  closeConfirm(): void {
    this.confirmState.set(null);
  }

  getConfirmMessage(): string {
    const state = this.confirmState();
    if (!state) return '';

    switch (state.type) {
      case 'leave':
        if (this.isOwner) {
          return '¿Estás seguro de que deseas salir del curso? El colaborador pasará a ser el nuevo dueño.';
        }
        return '¿Estás seguro de que deseas salir del curso?';
      case 'change':
        return '¿Estás seguro de que deseas convertir al colaborador en dueño del curso y pasar a ser colaborador?';
      case 'deleteCollaborator':
        return '¿Estás seguro de que deseas quitar al colaborador de este curso?';
      case 'deleteOwner':
        return '¿Estás seguro de que deseas quitar al dueño actual del curso? Tú pasarás a ser el nuevo dueño.';
      case 'cancelInvitation':
        return '¿Estás seguro de que deseas cancelar esta invitación?';
      default:
        return '';
    }
  }

  performConfirm(): void {
    const state = this.confirmState();
    if (!state) return;

    switch (state.type) {
      case 'leave':
        this.doLeave();
        break;
      case 'change':
        this.doChangeOwnerCollaborator();
        break;
      case 'deleteCollaborator':
        this.doDeleteCollaborator();
        break;
      case 'deleteOwner':
        this.doDeleteOwner();
        break;
      case 'cancelInvitation':
        this.doCancelInvitation();
        break;
    }
  }

  // =======================
  // ACCIONES BACKEND
  // =======================

  private doLeave(): void {
    this.saving.set(true);

    this.invitationService.leaveCourse(this.courseId).subscribe({
      next: (res) => {
        this.saving.set(false);
        alert(res.message);

        // Redirecciones según rol
        if (this.isAdmin) {
          // Admin se queda en la misma vista
          this.loadData();
        } else if (this.isOwner) {
          // Dueño tutor -> vuelve a su estudio
          this.router.navigate(['/studio']);
        } else if (this.isCollaborator && this.currentUser) {
          // Colaborador tutor -> va a su portafolio (colaborations)
          this.router.navigate([
            '/portfolio',
            this.currentUser.username,
            'collaborations'
          ]);
        } else {
          this.loadData();
        }

        this.closeConfirm();
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  private doChangeOwnerCollaborator(): void {
    this.saving.set(true);

    this.invitationService.swapOwnerWithCollaborator(this.courseId).subscribe({
      next: (res) => {
        this.saving.set(false);
        alert(res.message);
        this.closeConfirm();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  private doDeleteCollaborator(): void {
    const slot = this.collaboratorSlot;
    if (!slot || slot.is_invitation) {
      this.closeConfirm();
      return;
    }

    const collaboratorId = slot.user.id;
    this.saving.set(true);

    this.invitationService.deleteCollaborator(this.courseId, collaboratorId).subscribe({
      next: (res) => {
        this.saving.set(false);
        alert(res.message);
        this.closeConfirm();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  private doDeleteOwner(): void {
    const owner = this.ownerUser;
    if (!owner) {
      this.closeConfirm();
      return;
    }

    this.saving.set(true);
    this.invitationService.deleteOwner(this.courseId, owner.id).subscribe({
      next: (res) => {
        this.saving.set(false);
        alert(res.message);
        this.closeConfirm();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  private doCancelInvitation(): void {
    const slot = this.collaboratorSlot;
    if (!slot || !slot.is_invitation) {
      this.closeConfirm();
      return;
    }

    const invitationId = slot.invitation.id;

    this.saving.set(true);
    this.invitationService.cancelInvitation(this.courseId, invitationId).subscribe({
      next: (res) => {
        this.saving.set(false);
        alert(res.message);
        this.closeConfirm();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  // =======================
  // UTILS
  // =======================

  private showError(error: any): void {
    console.error('Invitation error:', error);
    const msg =
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      'Ocurrió un error inesperado.';
    alert(msg);
  }

  isMe(userId: number | undefined | null): boolean {
    return !!this.currentUser && !!userId && this.currentUser.id === userId;
  }

  get hasRealCollaborator(): boolean {
  const slot = this.collaboratorSlot;
  return !!slot && !slot.is_invitation;
}

}


