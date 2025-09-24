// directive/ui-file-upload.directive.ts
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { UifileUploadProps } from '../interfaces/ui-file-upload.interface';

@Directive({
  selector: '[uiFileUpload]',
  standalone: true
})
export class UiFileUploadDirective {

  // ====== UiFormProps / UiA11Props (sin onKeyDown) ======
  @Input() severity?: UifileUploadProps['severity'];
  @Input() size?: UifileUploadProps['size'] = 'sm';
  @Input() disabled?: UifileUploadProps['disabled'] = false;
  @Input() neumorphism: UifileUploadProps['neumorphism'] = 'flat';
  @Input() variant: UifileUploadProps['variant'] = 'filled';
  @Input() invalid: UifileUploadProps['invalid'];

  @Input() ariaLabel?: UifileUploadProps['ariaLabel'];
  @Input() role?: UifileUploadProps['role'];
  @Input() tabIndex?: UifileUploadProps['tabIndex'];
  @Input() ariaPressed?: UifileUploadProps['ariaPressed'];
  @Input() title?: UifileUploadProps['title'];

  // ====== Propios del FileUpload ======
  @Input() id?: UifileUploadProps['id'];
  @Input() types?: UifileUploadProps['types'];
  @Input() formats?: UifileUploadProps['formats'];
  @Input() orientation?: UifileUploadProps['orientation'] = 'vertical';

  @Input() label?: UifileUploadProps['label'];
  @Input() fudClass?: UifileUploadProps['fudClass'];
  @Input() fudStyle?: UifileUploadProps['fudStyle'];

  @Input() clearbtn?: UifileUploadProps['clearbtn'];

  @Input() icon?: UifileUploadProps['icon'];

  @Input() max?: UifileUploadProps['max'] = 1;
  @Input() min?: UifileUploadProps['min'] = 1;
  @Input() maxMb?: UifileUploadProps['maxMb'];
  @Input() minSecond?: UifileUploadProps['minSecond'];
  @Input() maxSecond?: UifileUploadProps['maxSecond'];

  @Input() preview?: UifileUploadProps['preview'];

  @Output() fileSelected = new EventEmitter<File|null>();
}

