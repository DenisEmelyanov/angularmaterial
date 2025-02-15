import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customCurrency'
})
export class CustomCurrencyPipe implements PipeTransform {

    transform(value: string | null, args?: any): any {
      if (value === null) {
        return value;
      }
      else {
        return value.charAt(0) === '-' ?
           '(' + value.substring(1, value.length) + ')' :
           value;
      }
    }
}