import { Component, OnInit } from '@angular/core';
import { MeiService } from '../mei.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  constructor(private meiService: MeiService) { }

  ngOnInit() {
  }

  saveClick(evt: MouseEvent) {
    let target = evt.target as HTMLAnchorElement;
    const mei = this.meiService.generateFullMEI();
    const serializer = new XMLSerializer();
    const content = serializer.serializeToString(mei);
    const blob = new Blob([content], {type: 'application/xml'});
    target.setAttribute('href', window.URL.createObjectURL(blob));
  }

}
