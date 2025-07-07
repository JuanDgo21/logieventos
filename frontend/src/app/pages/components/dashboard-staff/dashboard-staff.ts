import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Personnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';
import { PersonnelService } from '../../../core/services/personnel';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonnelFormComponent } from '../../../modules/staff/personnel-form/personnel-form';

@Component({
  selector: 'app-dashboard-staff',
  standalone: false,
  templateUrl: './dashboard-staff.html',
  styleUrl: './dashboard-staff.scss'
})
export class DashboardStaffComponent  implements OnInit {
  // Datos reales del dashboard
  stats = {
    totalEmployees: 0,
    activeEmployees: 0,
    onVacation: 0,
    newHires: 0
  };

  departmentDistribution = {
    labels: [] as string[],
    data: [] as number[],
    colors: ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-secondary'],
    total: 0
  };

  quickActions = [
    {
      title: 'Agregar Empleado',
      icon: 'fas fa-user-plus',
      color: 'bg-primary',
      action: () => this.openAddPersonnelModal()
    },
    {
      title: 'Gestionar Vacaciones',
      icon: 'fas fa-umbrella-beach',
      color: 'bg-success',
      action: () => this.showAlert('Gestionar vacaciones')
    },
    {
      title: 'Generar Reporte',
      icon: 'fas fa-file-alt',
      color: 'bg-info',
      action: () => this.showAlert('Generar reporte')
    }
  ];

  personnelList: Personnel[] = [];
  personnelTypes: PersonnelType[] = [];
  isLoading: boolean = true;

  constructor(
    public authService: AuthService,
    private personnelService: PersonnelService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    this.personnelService.personnelList$.subscribe(personnel => {
      this.personnelList = personnel;
      this.calculateStats();
      this.calculateDepartmentDistribution();
      this.isLoading = false;
    });

    this.personnelService.personnelTypes$.subscribe(types => {
      this.personnelTypes = types;
      this.calculateDepartmentDistribution();
    });

    this.personnelService.getAllPersonnel().subscribe();
    this.personnelService.getAllPersonnelTypes().subscribe();
  }

  calculateStats(): void {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    this.stats.totalEmployees = this.personnelList.length;
    this.stats.activeEmployees = this.personnelList.filter(p => p.status === 'disponible' || p.status === 'asignado').length;
    this.stats.onVacation = this.personnelList.filter(p => p.status === 'vacaciones').length;
    
    this.stats.newHires = this.personnelList.filter(p => {
      const hireDate = new Date(p.createdAt || '');
      return hireDate > lastMonth;
    }).length;
  }

  calculateDepartmentDistribution(): void {
    if (!this.personnelTypes.length || !this.personnelList.length) return;

    this.departmentDistribution.labels = [];
    this.departmentDistribution.data = [];
    this.departmentDistribution.total = this.personnelList.length;

    const typeCounts: {[key: string]: number} = {};

    this.personnelList.forEach(person => {
      const typeId = typeof person.personnelType === 'string' ? 
        person.personnelType : 
        (person.personnelType as PersonnelType)._id;
      
      typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;
    });

    this.personnelTypes.forEach((type, index) => {
      if (typeCounts[type._id]) {
        this.departmentDistribution.labels.push(type.name);
        this.departmentDistribution.data.push(typeCounts[type._id]);
      }
    });
  }

  calculatePercentage(value: number): number {
    if (this.departmentDistribution.total === 0) return 0;
    return (value / this.departmentDistribution.total) * 100;
  }

  showAlert(action: string): void {
    alert(`Acción: ${action} (simulada)`);
  }

  openAddPersonnelModal(): void {
    const modalRef = this.modalService.open(PersonnelFormComponent, { size: 'lg' });
    modalRef.componentInstance.personnelTypes = this.personnelTypes;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }

  getTypeName(typeId: string): string {
    const type = this.personnelTypes.find(t => t._id === typeId);
    return type ? type.name : 'Sin categoría';
  }

  getGradient(key: string): string {
    const gradients: {[key: string]: string} = {
      'totalEmployees': 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
      'activeEmployees': 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
      'onVacation': 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)',
      'newHires': 'linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)',
      'Agregar Empleado': 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
      'Gestionar Vacaciones': 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
      'Generar Reporte': 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)',
      'disponible': 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
      'asignado': 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
      'vacaciones': 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)',
      'inactivo': 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
    };

    return gradients[key] || 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)';
  }

  getColor(colorClass: string): string {
    const colors: {[key: string]: string} = {
      'bg-primary': '#6a11cb',
      'bg-success': '#38ef7d',
      'bg-info': '#17a2b8',
      'bg-warning': '#f9d423',
      'bg-danger': '#ff416c',
      'bg-secondary': '#6c757d'
    };

    return colors[colorClass] || '#6a11cb';
  }
}