import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TickerData } from 'src/app/model/ticker-data';
import { DataService } from 'src/app/service/data.service';

@Component({
  selector: 'app-summary-grid',
  templateUrl: './summary-grid.component.html',
  styleUrls: ['./summary-grid.component.css']
})
export class SummaryGridComponent {
  @Input()
  tickersData!: TickerData[];

  @Output() 
  detailsClickEvent = new EventEmitter<TickerData>();

  dataSource: any;

  displayedColumns: string[] = ["ticker", "description", "action"];//"risk", "closeDate", "total net premium", "annualized return", 
  @ViewChild(MatPaginator) paginatior !: MatPaginator;
  @ViewChild(MatSort) sort !: MatSort;

  constructor(private dataService: DataService) {

  }

  ngOnInit() {
    this.dataSource = this.tickersData;
    // get transactions using BehaviorSubject, not API call
    this.dataService.currentTransactions.subscribe((data: any) => {

    });
  }

  onDetails(data: any) {
    this.detailsClickEvent.emit(data);
  }
}
