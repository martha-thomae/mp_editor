import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IRI } from '../utils/definitions';

type BBox = {
  ulx: string,
  uly: string,
  lrx: string,
  lry: string
};

@Injectable({
  providedIn: 'root'
})
export class SelectedStaffService {
  _staffLoc: Subject<[IRI, BBox]>;

  constructor() {
    this._staffLoc = new Subject<[IRI, BBox]>();
  }

  getStaffLocation() {
    return this._staffLoc;
  }

  set staffLocation(loc: [IRI, BBox]) {
    this._staffLoc.next(loc);
  }


}
