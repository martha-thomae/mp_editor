import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { Staff, Voice } from './definitions';

const NAMESPACE = 'http://www.music-encoding.org/ns/mei';

@Injectable({
  providedIn: 'root'
})
export class StaffService {

  stavesByIndex: Map<number, Array<Staff>>;
  canvasIndex: Map<string, number>;
  _selectedStaff: Staff = null;
  selectedStaff = new Subject<Staff>();

  constructor() {
    this.stavesByIndex = new Map();
    this.canvasIndex = new Map();
  }

  initIndex(index: number, uri: string) {
    if (!this.stavesByIndex.has(index)) {
      this.stavesByIndex.set(index, []);
      this.canvasIndex.set(uri, index);
    }
  }

  addStaff(index: number, staff: Staff) {
    this.stavesByIndex.get(index).push(staff);
  }

  getStavesForIndex(index: number): Array<Staff> {
    return this.stavesByIndex.get(index);
  }

  get selected() {
    return this._selectedStaff;
  }

  set selected(staff: Staff) {
    this._selectedStaff = staff;
    this.selectedStaff.next(staff);
  }

  get staves(): Staff[] {
    let array = [];
    for (const setOfStaves of this.stavesByIndex.values()) {
      array = array.concat(setOfStaves);
    }
    return array;
  }

  getStaffById(id: string): Staff {
    let staves = this.staves.filter(staff => { return staff.id === id; });
    if (staves.length > 0) {
      return staves[0];
    }
    return null;
  }

  generateFullMEI(): Document {
    let meiDoc = this._createSkeletonMEI();
    // Iterate through voices
    let staves = this.staves;
    console.log(staves);
    for (let voice in Voice) {
      console.log(voice);
      let voiceStaves = staves.filter(staff => {
        console.log(staff.voice);
        console.log(voice);
        return staff.voice == voice;
      });
      if (voiceStaves.length > 0) {
        this._addPart(meiDoc, voiceStaves);
      }
    }
    return meiDoc;
  }

  _addPart(meiDoc: Document, staves: Staff[]) {
    let facsimile = meiDoc.querySelector("facsimile");

    staves.sort(Staff.compare);
    let part = meiDoc.createElementNS(NAMESPACE, "part");
    part.setAttribute("label", staves[0].voice.toString());
    let scoreDef = this._generateScoreDef(meiDoc);
    part.appendChild(scoreDef);
    let section = meiDoc.createElementNS(NAMESPACE, "section");
    part.appendChild(section);
    let staff = meiDoc.createElementNS(NAMESPACE, "staff");
    staff.setAttribute("n", "1");
    section.appendChild(staff);
    let layer = meiDoc.createElementNS(NAMESPACE, "layer");
    staff.appendChild(layer);
    let page: string = undefined;
    let graphic: Element = undefined;
    for (let staff of staves) {
      if (staff.canvas !== page) {
        // Add pb
        let pb = meiDoc.createElementNS(NAMESPACE, "pb");
        let temp = Array.from(facsimile.querySelectorAll("graphic"))
          .filter(graphic => graphic.getAttribute("target") === staff.canvas);
        if (temp.length > 0) {
          graphic = temp[0];
          pb.setAttribute("facs", graphic.getAttribute("xml:id"));
        }
        else {
          let surface = this._createNewSurface(meiDoc, staff.canvas);
          graphic = surface.querySelector("graphic");
          pb.setAttribute("facs", graphic.getAttribute("xml:id"));
          facsimile.appendChild(surface);
        }
        page = staff.canvas
        layer.appendChild(pb);
      }
      let zone = this._createNewZone(meiDoc, staff);
      graphic.appendChild(zone);
      let sb = meiDoc.createElementNS(NAMESPACE, "sb");
      sb.setAttribute("facs", zone.getAttribute("xml:id"));
      layer.appendChild(sb);
      let staffContents: Element[] = this._getStaffContents(meiDoc, staff);
      staffContents.forEach(child => section.appendChild(child));
    }

    let parts = meiDoc.querySelector('parts');
    parts.appendChild(part);
  }

  _createSkeletonMEI(): Document {
    let meiDoc = document.implementation.createDocument(NAMESPACE, "mei", null);
    let mei = meiDoc.documentElement;
    mei.setAttribute('meiversion', '4.0.1');
    // Create Header
    let head = meiDoc.createElementNS(NAMESPACE, 'meiHead');
    // TODO Add more to header
    mei.appendChild(head);

    // Create music skeleton
    let music = meiDoc.createElementNS(NAMESPACE, 'music');
    let facsimile = meiDoc.createElementNS(NAMESPACE, 'facsimile');
    let body = meiDoc.createElementNS(NAMESPACE, 'body');
    let mdiv = meiDoc.createElementNS(NAMESPACE, 'mdiv');
    let parts = meiDoc.createElementNS(NAMESPACE, 'parts');
    mei.appendChild(music);
    music.appendChild(facsimile);
    music.appendChild(body);
    body.appendChild(mdiv);
    mdiv.appendChild(parts);

    return meiDoc;
  }

  _createNewSurface(meiDoc: XMLDocument, pageURI: string): Element {
    let surface = meiDoc.createElementNS(NAMESPACE, 'surface');
    surface.setAttribute('xml:id', 'm-' + uuid());
    let graphic = meiDoc.createElementNS(NAMESPACE, 'graphic');
    graphic.setAttribute('xml:id', 'm-' + uuid());
    graphic.setAttribute('target', pageURI);
    graphic.setAttribute('ulx', '0');
    graphic.setAttribute('uly', '0');
    // Set height and width
    surface.appendChild(graphic);
    return surface;
  }

  _getStaffContents(meiDoc: XMLDocument, staff: Staff): Element[] {
    // TODO make this actual MEI
    return [];
  }

  _generateScoreDef(meiDoc: XMLDocument): Element {
    // Use the first staff to set defaults.
    let scoreDef = meiDoc.createElementNS(NAMESPACE, "scoreDef");
    let staffGrp = meiDoc.createElementNS(NAMESPACE, "staffGrp");
    scoreDef.appendChild(staffGrp);
    let staffDef = meiDoc.createElementNS(NAMESPACE, "staffDef");
    staffDef.setAttribute("n", "1");
    staffDef.setAttribute("lines", "5");
    staffGrp.appendChild(staffDef);
    return scoreDef;
  }

  _createNewZone(meiDoc: XMLDocument, staff: Staff): Element {
    let zone = meiDoc.createElementNS(NAMESPACE, "zone");
    zone.setAttribute('xml:id', 'm-' + uuid());
    zone.setAttribute('ulx', Math.round(staff.bbox.ulx).toString());
    zone.setAttribute('uly', Math.round(staff.bbox.uly).toString());
    zone.setAttribute('lrx', Math.round(staff.bbox.lrx).toString());
    zone.setAttribute('lry', Math.round(staff.bbox.lry).toString());
    return zone;
  }
}
