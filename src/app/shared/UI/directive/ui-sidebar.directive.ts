// ui-sidebar.directive.ts
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { UiSidebarProps } from '../interfaces/ui-sidebar.interface';



@Directive({
  selector: '[uiSidebar]',
  standalone: true,
})
export class UiSidebarDirective {
  // ====== Inputs (coinciden con UiSidebarProps y UiOverlayProps) ======
  @Input() id?: UiSidebarProps ['id'];
  @Input() class?: UiSidebarProps ['class'];
  @Input() style?: UiSidebarProps ['style'];


  @Input() neumorphism?: UiSidebarProps ['neumorphism'] ='flat';
  @Input() variant?: UiSidebarProps ['variant'] = 'filled';


  @Input() drawer?: UiSidebarProps ['drawer'] = false;
  @Input() visible?: UiSidebarProps ['visible'] = true;
  @Input() minimize?: UiSidebarProps ['minimize'] = false;
  @Input() expand?: UiSidebarProps ['expand'] = true;


  @Input() minimizeWidth?: UiSidebarProps ['minimizeWidth'];
  @Input() expandWidth?: UiSidebarProps ['expandWidth'];
  @Input() position?: UiSidebarProps ['position'] = 'left';

  // Omit<MaskingProps, 'showBnt' | 'button'>
  @Input() mask?: UiSidebarProps ['mask'];

  // ====== Outputs (para two-way binding y eventos semánticos) ======
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() minimizeChange = new EventEmitter<boolean>();
  @Output() expandChange = new EventEmitter<boolean>();



}

