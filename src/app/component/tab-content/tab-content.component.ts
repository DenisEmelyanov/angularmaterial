import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { TickerData } from 'src/app/model/ticker-data';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.css']
})

export class TabContentComponent {

  tickersData!: TickerData[];
  
  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.tickersData = [
      {
        ticker: 'ASO',
        description: ''
      },
      {
        ticker: 'SBUX',
        description: 'STARBUCKS CORP COM'
      }];
  

  }
}
