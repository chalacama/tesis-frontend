// src/app/shared/ui/directives/ui-avatar.directive.ts
import { Directive, Input } from '@angular/core';
import { UiAvatarProps } from '../interfaces/ui-avatar.interface';

@Directive({
  selector: '[appUiAvatar]',
  standalone: true,
})
export class UiAvatarDirective {
  // === Identificación / clases / estilos ===
  @Input() id?: UiAvatarProps['id'];
  @Input() avatarClass?: UiAvatarProps['avatarClass'] = '';
  @Input() avatarStyle?: UiAvatarProps['avatarStyle'];

  // === Contenido / media ===
  @Input() name?: UiAvatarProps['name'];               // Para iniciales si no hay imagen
  @Input() src?: UiAvatarProps['src'];                 // De UiMediaProps
  @Input() alt?: UiAvatarProps['alt'] = '';            // De UiMediaProps

  // === Apariencia (UiProps heredados vía UiMediaProps) ===
  @Input() severity?: UiAvatarProps['severity'] = 'primary';
  @Input() size?: UiAvatarProps['size'] = 'md';
  @Input() disabled?: UiAvatarProps['disabled'] = false;
  @Input() neumorphism?: UiAvatarProps['neumorphism'] = 'flat';
  @Input() variant?: UiAvatarProps['variant'] = 'flat';

  // === Accesibilidad (UiA11Props) ===
  @Input() ariaLabel?: UiAvatarProps['ariaLabel'];
  @Input() role?: UiAvatarProps['role'] = 'img';
  @Input() tabIndex?: UiAvatarProps['tabIndex'] = 0;
  @Input() ariaPressed?: UiAvatarProps['ariaPressed'];
  @Input() title?: UiAvatarProps['title'];
  @Input() onKeyDown?: UiAvatarProps['onKeyDown']; // ['enter','space']

  // === Badge opcional ===
  @Input() badge?: UiAvatarProps['badge'];
}

