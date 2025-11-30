import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

// Register locale data for Argentina (es-AR) so DatePipe and Intl-based formatting work
registerLocaleData(localeEsAr, 'es-AR');

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
