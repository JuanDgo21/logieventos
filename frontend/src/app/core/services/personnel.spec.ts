import { TestBed } from '@angular/core/testing';

import { PersonnelService } from './personnel';

describe('PersonnelService', () => {
  let service: PersonnelService  ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonnelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
