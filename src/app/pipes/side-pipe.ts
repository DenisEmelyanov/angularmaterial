import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customSide'
})
export class CustomSidePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return ''; // Handle cases where value is undefined or null
    }

    switch (value) {
      case 'sell-to-open':
        return 'Sell Open';
      case 'sell-to-close':
        return 'Sell Close';
      case 'buy-to-open':
        return 'Buy Open';
      case 'buy-to-close':
        return 'Buy Close';
      case 'buy':
        return 'Buy';
      case 'sell':
        return 'Sell';
      default:
        return value.toString(); // Fallback to string
    }
  }
}