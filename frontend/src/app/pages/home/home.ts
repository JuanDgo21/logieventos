import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';

interface Feature {
  icon: string;
  title: string;
  items: string[];
  highlight?: boolean;
}

interface DemoStep {
  number: number;
  title: string;
  description: string;
  active?: boolean;
}

interface Stat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class Home implements OnInit {

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });
  }

  heroFeatures = [
    'Reducción de errores en un 90%',
    'Ahorro de tiempo en gestión',
    'Control total de tus eventos',
    'Integración con proveedores'
  ];

  cardItems = [
    'Automatiza procesos repetitivos',
    'Optimiza recursos logísticos',
    'Controla fechas y personal',
    'Asigna mobiliario y servicios',
    'Gestiona proveedores sin fallos'
  ];

  stats: Stat[] = [
    { value: '500', label: 'Clientes satisfechos' },
    { value: '10K', label: 'Eventos gestionados' },
    { value: '95%', label: 'Tasa de éxito' }
  ];

  features: Feature[] = [
    {
      icon: 'users',
      title: 'Gestión de Usuarios',
      items: [
        'Registro seguro',
        'Roles personalizados',
        'Control de accesos',
        'Firma digital'
      ],
      highlight: false
    },
    {
      icon: 'calendar-check',
      title: 'Calendario',
      items: [
        'Eventos en tiempo real',
        'Disponibilidad',
        'Asignación de lugares',
        'Sincronización'
      ],
      highlight: true
    },
    {
      icon: 'boxes',
      title: 'Inventario',
      items: [
        'Control de recursos',
        'Asignación automática',
        'Registro actualizado',
        'Prevención de sobrecupos'
      ],
      highlight: false
    },
    {
      icon: 'user-tie',
      title: 'Personal',
      items: [
        'Registro de equipo',
        'Asignación de turnos',
        'Gestión de asistencia',
        'Contratos digitales'
      ],
      highlight: false
    },
    {
      icon: 'chart-line',
      title: 'Reportes',
      items: [
        'Descarga de contratos',
        'Análisis visual',
        'Tendencias',
        'Decisiones estratégicas'
      ],
      highlight: false
    },
    {
      icon: 'award',
      title: 'Beneficios',
      items: [
        'Reducción de costos',
        'Ahorro de tiempo',
        'Escalabilidad',
        'Acceso 24/7'
      ],
      highlight: false
    }
  ];


  demoSteps: DemoStep[] = [
    {
      number: 1,
      title: 'Configura tu evento',
      description: 'Define los parámetros básicos de tu evento en minutos',
      active: true
    },
    {
      number: 2,
      title: 'Asigna recursos',
      description: 'Selecciona y asigna todo lo necesario para tu evento',
      active: false
    },
    {
      number: 3,
      title: 'Invita participantes',
      description: 'Envía invitaciones y gestiona confirmaciones',
      active: false
    }
  ];

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  nextDemoStep() {
    const currentIndex = this.demoSteps.findIndex(step => step.active);
    const nextIndex = (currentIndex + 1) % this.demoSteps.length;
    
    this.demoSteps.forEach(step => step.active = false);
    this.demoSteps[nextIndex].active = true;
  }

  prevDemoStep() {
    const currentIndex = this.demoSteps.findIndex(step => step.active);
    const prevIndex = (currentIndex - 1 + this.demoSteps.length) % this.demoSteps.length;
    
    this.demoSteps.forEach(step => step.active = false);
    this.demoSteps[prevIndex].active = true;
  }
}