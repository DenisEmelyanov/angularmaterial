import { Component, Input } from '@angular/core';
import { TickerData } from 'src/app/model/ticker-data';

@Component({
  selector: 'app-summary-grid',
  templateUrl: './summary-grid.component.html',
  styleUrls: ['./summary-grid.component.css']
})
export class SummaryGridComponent {
  @Input()
  tickersData!: TickerData[];
}
