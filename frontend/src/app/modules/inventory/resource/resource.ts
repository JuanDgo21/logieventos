// src/app/features/resources/resources.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from '../../../core/services/resource.service';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// interface Resource {
//   id?: number;
//   name: string;
//   description: string;
//   quantity: number;
//   status: boolean;
// }

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './resource.html',
  styleUrls: ['./resource.scss']
})
export class ResourcesComponent {
  // resources: Resource[] = [];
  // newResource: Resource = { name: '', description: '', quantity: 0, status: true };
  // editingResource: Resource | null = null;
  // apiUrl = 'http://localhost:3000/api/resources';

  // constructor(private http: HttpClient) {
  //   resourcesService: ResourceService
  //   router: Router
  //   this.loadResources();
  // }

  // loadResources() {
  //   this.http.get<Resource[]>(this.apiUrl).subscribe(data => {
  //     this.resources = data;
  //   });
  // }

  // createResource() {
  //   this.http.post<Resource>(this.apiUrl, this.newResource).subscribe(() => {
  //     this.loadResources();
  //     this.newResource = { name: '', description: '', quantity: 0, status: true };
  //   });
  // }

  // editResource(resource: Resource) {
  //   this.editingResource = { ...resource };
  // }

  // updateResource() {
  //   if (!this.editingResource) return;
    
  //   this.http.put<Resource>(`${this.apiUrl}/${this.editingResource.id}`, this.editingResource)
  //     .subscribe(() => {
  //       this.loadResources();
  //       this.editingResource = null;
  //     });
  // }

  // deleteResource(id: number) {
  //   this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
  //     this.loadResources();
  //   });
  // }
}