import { TestBed } from '@angular/core/testing';

import { ResourcesServices } from './resources';

describe('ResourcesServices', () => {
  let service: ResourcesServices  ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourcesServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
