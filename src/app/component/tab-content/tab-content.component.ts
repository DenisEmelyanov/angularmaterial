import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TickerData } from 'src/app/model/ticker-data';
import { Transaction } from 'src/app/model/transaction';
import { DataService } from 'src/app/service/data.service';
import { SummaryGridComponent } from '../summary-grid/summary-grid.component';

@Component({
  selector: 'app-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrls: ['./tab-content.component.css']
})
//https://stackoverflow.com/questions/37587732/how-to-call-another-components-function-in-angular2
export class TabContentComponent {
  
  tickersData!: TickerData[];
  openTabs: any= [];
  tabIndex: any = 0;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.tickersData = [
      {
        ticker: 'ASO',
        description: 'ACADEMY SPORTS & OUTDOORS INC COM'
      },
      {
        ticker: 'SBUX',
        description: 'STARBUCKS CORP COM'
      }];
  }

  onAddingTab(tickerData: any) {
    this.addTab(tickerData, true);
  }

  addTab(tickerData: TickerData, selectAfterAdding: boolean) {
    //TODO:check if tab is already added
    this.openTabs.push(tickerData);

    if (selectAfterAdding) {
      this.tabIndex = this.openTabs.length;
    }
  }
}
