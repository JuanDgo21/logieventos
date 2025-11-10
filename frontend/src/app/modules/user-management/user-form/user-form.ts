  import { Component, Input, OnInit } from '@angular/core';
  import { User } from '../../../shared/interfaces/user';
  import { FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
  import { UserService } from '../../../core/services/user';

  @Component({
    selector: 'app-user-form',
    standalone: false, // NOSONAR (typescript:S7648)
    templateUrl: './user-form.html',
    styleUrl: './user-form.scss'
  })
  export class UserFormComponent implements OnInit {
  @Input() user: User | null = null;
  userForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  roles = ['admin', 'coordinador', 'lider'];
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    public activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      document: [this.user?.document || '', [Validators.required, Validators.pattern(/^\d*$/)]],  
      fullname: [this.user?.fullname || '', Validators.required],
      username: [this.user?.username || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      role: [this.user?.role || 'lider', Validators.required],
      password: ['', this.user ? null : Validators.required],
      confirmPassword: ['', this.user ? null : Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const userData = {
      ...this.userForm.value,
      active: true
    };

    delete userData.confirmPassword;

    if (this.user && !userData.password) {
      delete userData.password;
    }

    const operation = this.user 
      ? this.userService.updateUser(this.user._id!, userData)
      : this.userService.createUser(userData);

    operation.subscribe({
      next: () => {
        this.activeModal.close('saved');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al guardar el usuario';
        this.loading = false;
      }
    });
  }

  get f() {
    return this.userForm.controls;
  }
}