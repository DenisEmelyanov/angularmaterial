import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
    name: 'customType'
})
export class CustomTypePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return ''; // Handle cases where value is undefined or null
    }

    switch (value) {
        case 'call':
            return 'Call';
        case 'put':
            return 'Put';
      default:
        return value.toString(); // Fallback to string
    }
  }
}