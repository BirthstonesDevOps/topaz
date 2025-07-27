import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';
import { ApiModule as ItemsServiceModule, Configuration as ItemsServiceConfiguration, ConfigurationParameters as ItemsServiceConfigurationParameters } from '@birthstonesdevops/topaz.backend.itemsservice';
import { ApiModule as OrganizationsServiceModule, Configuration as OrganizationsServiceConfiguration, ConfigurationParameters as OrganizationsServiceConfigurationParameters} from '@birthstonesdevops/topaz.backend.organizationservice';
import { ApiModule as OrdersServiceModule, Configuration as OrdersServiceConfiguration, ConfigurationParameters as OrdersServiceConfigurationParameters } from '@birthstonesdevops/topaz.backend.ordersservice';


export function OrganizationServiceFactory(): OrganizationsServiceConfiguration {
  const params: OrganizationsServiceConfigurationParameters = {
    basePath: environment.apiUrl,
  };
  return new OrganizationsServiceConfiguration(params);
}

export function ItemsServiceFactory(): ItemsServiceConfiguration {
  const params: ItemsServiceConfigurationParameters = {
    basePath: environment.apiUrl,
  };
  return new ItemsServiceConfiguration(params);
}

export function OrdersServiceFactory(): OrdersServiceConfiguration {
  const params: OrdersServiceConfigurationParameters = {
    basePath: environment.apiUrl,
  };
  return new OrdersServiceConfiguration(params);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      OrganizationsServiceModule.forRoot(OrganizationServiceFactory),
      ItemsServiceModule.forRoot(ItemsServiceFactory),
      OrdersServiceModule.forRoot(OrdersServiceFactory)
    )
  ]
};
