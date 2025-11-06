import { Component, Input, OnInit } from '@angular/core';
import { NewPersonnelType, PersonnelType, UpdatePersonnelType } from '../../../shared/interfaces/personnel-type';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonnelService } from '../../../core/services/personnel';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-personnel-type-form',
  standalone: false,
  templateUrl: './personnel-type-form.html',
  styleUrl: './personnel-type-form.scss'
})
export class PersonnelTypeFormComponent implements OnInit {
  @Input() type: PersonnelType | null = null;
  typeForm: FormGroup;
  isSaving: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private readonly fb: FormBuilder, // CORREGIDO: Añadido 'readonly'
    private readonly personnelService: PersonnelService, // CORREGIDO: Añadido 'readonly'
    private readonly authService: AuthService // CORREGIDO: Añadido 'readonly'
  ) {
    this.typeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', Validators.maxLength(200)],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    if (this.type) {
      this.typeForm.patchValue({
        name: this.type.name,
        description: this.type.description || '',
        isActive: this.type.isActive
      });
    }
  }

  saveType(): void {
    if (this.typeForm.invalid) {
      return;
    }

    this.isSaving = true;
    const formValue = this.typeForm.value;
    const currentUserId = this.authService.getUserId();

    if (!currentUserId) {
      console.error('No hay usuario autenticado');
      this.isSaving = false;
      this.activeModal.dismiss();
      return;
    }

    if (this.type) {
      const updateData: UpdatePersonnelType = {
        _id: this.type._id,
        name: formValue.name,
        description: formValue.description,
        isActive: formValue.isActive,
        updatedBy: currentUserId
      };

      this.personnelService.updatePersonnelType(this.type._id, updateData)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.activeModal.close('saved');
          },
          error: () => {
            this.isSaving = false;
          }
        });
    } else {
      const newType: NewPersonnelType = {
        name: formValue.name,
        description: formValue.description,
        isActive: formValue.isActive,
        createdBy: currentUserId,
        updatedAt_: ''
      };

      this.personnelService.createPersonnelType(newType)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.activeModal.close('saved');
          },
          error: () => {
            this.isSaving = false;
          }
        });
    }
  }
}