import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  standalone: false,
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss'
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmar acción';
  @Input() message: string = '¿Estás seguro de que deseas realizar esta acción?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmClass: string = 'btn-primary';
  @Input() showCloseButton: boolean = true;

  constructor(public activeModal: NgbActiveModal) {}

  confirm(): void {
    this.activeModal.close(true);
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }
}