import { Component, Input, OnInit } from '@angular/core';
import { NewPersonnel, Personnel, UpdatePersonnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonnelService } from '../../../core/services/personnel';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-personnel-form',
  standalone: false,
  templateUrl: './personnel-form.html',
  styleUrl: './personnel-form.scss'
})
export class PersonnelFormComponent implements OnInit {
  @Input() personnel?: Personnel;
  @Input() personnelTypes: PersonnelType[] = [];
  
  personnelForm: FormGroup;
  isSaving: boolean = false;
  currentTypeName: string = 'Sin categoría';
  newSkill: string = '';
  errorMessage: string = '';

  statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'inactivo', label: 'Inactivo' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private personnelService: PersonnelService,
    private authService: AuthService
  ) {
    this.personnelForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],
      personnelType: ['', Validators.required],
      status: ['disponible', Validators.required],
      skills: [[]]
    });
  }

  ngOnInit(): void {
    if (this.personnel) {
      this.personnelForm.patchValue({
        firstName: this.personnel.firstName,
        lastName: this.personnel.lastName,
        email: this.personnel.email,
        phone: this.personnel.phone || '',
        personnelType: this.personnel.personnelType, // ✅ Aquí se arregla
        status: this.personnel.status,
        skills: this.personnel.skills || []
      });

      // Establecer nombre de categoría actual
      this.updateCurrentTypeName();
    }
  }

  updateCurrentTypeName(): void {
    if (this.personnel?.personnelType) {
      const id = typeof this.personnel.personnelType === 'string'
        ? this.personnel.personnelType
        : (this.personnel.personnelType as PersonnelType)._id;

      const type = (this.personnelTypes as PersonnelType[]).find(t => t._id === id);
      this.currentTypeName = type ? type.name : 'Sin categoría';
    }
  }

  onTypeChange(event: any): void {
    const typeId = event.target.value;
    const selectedType = this.personnelTypes.find(t => t._id === typeId);
    this.currentTypeName = selectedType ? selectedType.name : 'Sin categoría';
  }

  savePersonnel(): void {
    if (this.personnelForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.personnelForm.value;
    const currentUserId = this.authService.getUserId();

    if (this.personnel) {
      // Actualización
      const updateData: UpdatePersonnel = {
        _id: this.personnel._id,
        ...formValue
      };

      this.personnelService.updatePersonnel(this.personnel._id, updateData)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.activeModal.close('saved');
          },
          error: (err) => {
            console.error('Error updating personnel:', err);
            this.isSaving = false;
          }
        });
    } else {
      // Creación
      const newPersonnel: NewPersonnel = {
        ...formValue,
        createdBy: currentUserId
      };

      this.personnelService.createPersonnel(newPersonnel)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.activeModal.close('saved');
          },
          error: (err) => {
            console.error('Error creating personnel:', err);
            this.isSaving = false;
          }
        });
    }
  }

  addSkill(): void {
    if (this.newSkill.trim() && !this.personnelForm.value.skills.includes(this.newSkill.trim())) {
      const skills = [...this.personnelForm.value.skills, this.newSkill.trim()];
      this.personnelForm.patchValue({ skills });
      this.newSkill = '';
    }
  }

  removeSkill(skill: string): void {
    const skills = this.personnelForm.value.skills.filter((s: string) => s !== skill);
    this.personnelForm.patchValue({ skills });
  }

  private markAllAsTouched(): void {
    Object.values(this.personnelForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}