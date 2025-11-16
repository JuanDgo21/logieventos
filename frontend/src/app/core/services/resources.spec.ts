import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ResourcesServices } from './resources';
import { environment } from '../../../environments/environment';

describe('ResourcesServices', () => {
  let service: ResourcesServices;
  let httpMock: HttpTestingController;

  const apiUrl = environment.API_URL;

  const mockResource = {
    id: 1,
    name: 'Mesa',
    description: 'Mesa grande',
    quantity: 5,
    status: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResourcesServices],
    });

    service = TestBed.inject(ResourcesServices);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ----------------------------------------------------------
  // getResources()
  // ----------------------------------------------------------
  it('should GET all resources', () => {
    service.getResources().subscribe((res) => {
      expect(res).toEqual([mockResource]);
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources`);
    expect(req.request.method).toBe('GET');
    req.flush([mockResource]);
  });

  it('should handle GET resources error', () => {
    service.getResources().subscribe({
      next: () => fail('Should fail'),
      error: (err: unknown) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  // ----------------------------------------------------------
  // getResource(id)
  // ----------------------------------------------------------
  it('should GET one resource by id', () => {
    service.getResource('1').subscribe((res) => {
      expect(res).toEqual(mockResource);
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResource);
  });

  it('should handle GET one resource error', () => {
    service.getResource('1').subscribe({
      next: () => fail('Should fail'),
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });
  });

  // ----------------------------------------------------------
  // createResource()
  // ----------------------------------------------------------
  it('should POST a new resource', () => {
    service.createResource(mockResource).subscribe((res) => {
      expect(res).toEqual(mockResource);
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockResource);

    req.flush(mockResource);
  });

  it('should handle POST error', () => {
    service.createResource(mockResource).subscribe({
      next: () => fail('Should fail'),
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources`);
    req.flush('Error', { status: 400, statusText: 'Bad Request' });
  });

  // ----------------------------------------------------------
  // updateResource()
  // ----------------------------------------------------------
  it('should PUT update a resource', () => {
    service.updateResource('1', mockResource).subscribe((res) => {
      expect(res).toEqual(mockResource);
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockResource);

    req.flush(mockResource);
  });

  it('should handle PUT error', () => {
    service.updateResource('1', mockResource).subscribe({
      next: () => fail('Should fail'),
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  // ----------------------------------------------------------
  // deleteResource()
  // ----------------------------------------------------------
  it('should DELETE a resource', () => {
    service.deleteResource('1').subscribe((res) => {
      expect(res).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should handle DELETE error', () => {
    service.deleteResource('1').subscribe({
      next: () => fail('Should fail'),
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

});
