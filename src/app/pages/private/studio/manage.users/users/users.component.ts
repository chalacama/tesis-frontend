import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';
import { AvatarComponent } from '../../../../../shared/UI/components/media/avatar/avatar.component';

import {
  UserListItem,
  UserListParams,
  UserSort,
  PaginatedResponse,
} from '../../../../../core/api/user/user.interfaces';
import { UserService } from '../../../../../core/api/user/user.service';

import { RoleItem } from '../../../../../core/api/user/role.interfaces';
import { RoleService } from '../../../../../core/api/user/role.service';

import { UiToastService } from '../../../../../shared/services/ui-toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingBarComponent,
    ToastComponent,
    AvatarComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  // Datos
  users: UserListItem[] = [];
  roles: RoleItem[] = [];

  // Estados de carga
  loadingUsers = false; // para skeletor de la tabla
  savingRole = false;   // para barra de carga al cambiar un rol

  // Filtros
  search = '';
  selectedRoleFilter: number | 'all' | null = 'all';
  sort: UserSort = 'alpha_asc';
  perPage = 10;

  // Paginación
  currentPage = 1;
  lastPage = 1;
  totalItems = 0;

  // Modal de confirmación de cambio de rol
  showConfirmModal = false;
  roleChangeUser: UserListItem | null = null;
  roleChangeNewRoleId: number | null = null;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private toast: UiToastService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  // =====================
  // Carga de datos
  // =====================

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: () => {
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: 'No se pudieron cargar los roles.',
        });
      },
    });
  }

  loadUsers(page: number = 1): void {
    this.loadingUsers = true;
    this.currentPage = page;

    const params: UserListParams = {
      search: this.search || undefined,
      role_id:
        this.selectedRoleFilter && this.selectedRoleFilter !== 'all'
          ? Number(this.selectedRoleFilter)
          : undefined,
      sort: this.sort,
      page: this.currentPage,
      per_page: this.perPage,
    };

    this.userService.getUsers(params).subscribe({
      next: (resp: PaginatedResponse<UserListItem>) => {
        this.users = resp.data;
        this.currentPage = resp.current_page;
        this.lastPage = resp.last_page;
        this.totalItems = resp.total;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
        this.toast.add({
          severity: 'danger',
          summary: 'Error',
          message: 'No se pudieron cargar los usuarios.',
        });
      },
    });
  }

  // =====================
  // Filtros y orden
  // =====================

  onApplyFilters(): void {
    this.currentPage = 1;
    this.loadUsers(1);
  }

  onChangeSort(sort: UserSort): void {
    this.sort = sort;
    this.onApplyFilters();
  }

  onChangePerPage(): void {
    this.currentPage = 1;
    this.loadUsers(1);
  }

  onChangeRoleFilter(value: string): void {
    if (value === 'all') {
      this.selectedRoleFilter = 'all';
    } else {
      this.selectedRoleFilter = Number(value);
    }
    this.onApplyFilters();
  }

  // =====================
  // Paginación
  // =====================

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) return;
    this.loadUsers(page);
  }

  // =====================
  // Cambio de rol
  // =====================

  /**
   * Evento cuando se selecciona un nuevo rol en el select de la fila.
   * Solo abre el modal de confirmación, aún no hace el cambio real.
   */
  onRoleSelectChange(user: UserListItem, newRoleId: string): void {
    const parsedId = Number(newRoleId);
    if (!parsedId || parsedId === user.role_id) {
      return;
    }

    this.roleChangeUser = user;
    this.roleChangeNewRoleId = parsedId;
    this.showConfirmModal = true;
  }

  onCancelRoleChange(): void {
    this.showConfirmModal = false;
    this.roleChangeUser = null;
    this.roleChangeNewRoleId = null;
  }

  onConfirmRoleChange(): void {
    if (!this.roleChangeUser || !this.roleChangeNewRoleId) {
      return;
    }

    this.savingRole = true;

    this.userService
      .changeUserRole(this.roleChangeUser.id, this.roleChangeNewRoleId)
      .subscribe({
        next: (resp) => {
          const updated = resp.data;

          // Actualizar en la tabla
          const idx = this.users.findIndex((u) => u.id === updated.id);
          if (idx !== -1) {
            this.users[idx] = { ...this.users[idx], ...updated };
          }

          this.toast.add({
            severity: 'primary',
            summary: 'Rol actualizado',
            message: `El rol de ${updated.name} ${updated.lastname} se actualizó correctamente.`,
          });

          this.savingRole = false;
          this.onCancelRoleChange();
        },
        error: () => {
          this.savingRole = false;
          this.toast.add({
            severity: 'danger',
            summary: 'Error',
            message: 'No se pudo actualizar el rol del usuario.',
          });
          this.onCancelRoleChange();
        },
      });
  }

  // =====================
  // Helpers
  // =====================

  getRoleName(roleId: number | null | undefined): string {
    if (!roleId) return '';
    const role = this.roles.find((r) => r.id === roleId);
    return role ? role.name : '';
  }

  getTotalPagesText(): string {
    return `${this.currentPage} / ${this.lastPage}`;
  }
}

