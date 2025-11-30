import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'utc3',
  standalone: true,
  pure: true
})
export class Utc3Pipe implements PipeTransform {
  /**
   * Transform a date-like value into Argentina timezone (UTC-3) formatted string.
   * @param value Date | number | string
   * @param format Angular date format string (default 'dd/MM/yyyy HH:mm')
   * @param locale locale to use (default 'es-AR')
   */
  transform(
    value: Date | string | number | null | undefined,
    format = 'dd/MM/yyyy HH:mm',
    locale = 'es-AR'
  ): string | null {
    if (value == null) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;

    // Use Angular DatePipe with IANA timezone for Argentina (UTC-3)
    const datePipe = new DatePipe(locale);
    const dateUtc3 = new Date(d.getTime() - (3 * 60 * 60 * 1000)); // Adjust to UTC-3
    return datePipe.transform(dateUtc3, format, 'America/Argentina/Buenos_Aires');
  }
}
