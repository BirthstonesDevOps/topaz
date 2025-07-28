import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { environment } from './app/environments/environment';
import { ApiModule as ItemsServiceModule, Configuration as ItemsServiceConfiguration, ConfigurationParameters as ItemsServiceConfigurationParameters } from '@birthstonesdevops/topaz.backend.itemsservice';
import { ApiModule as OrganizationsServiceModule, Configuration as OrganizationsServiceConfiguration, ConfigurationParameters as OrganizationsServiceConfigurationParameters} from '@birthstonesdevops/topaz.backend.organizationservice';
import { ApiModule as OrdersServiceModule, Configuration as OrdersServiceConfiguration, ConfigurationParameters as OrdersServiceConfigurationParameters } from '@birthstonesdevops/topaz.backend.ordersservice';

export function OrganizationServiceFactory(): OrganizationsServiceConfiguration {
    const params: OrganizationsServiceConfigurationParameters = {
      basePath: environment.apiUrl + '/Organization',
    };
    return new OrganizationsServiceConfiguration(params);
  }

  export function ItemsServiceFactory(): ItemsServiceConfiguration {
    const params: ItemsServiceConfigurationParameters = {
      basePath: environment.apiUrl + '/Items',
    };
    return new ItemsServiceConfiguration(params);
  }

  export function OrdersServiceFactory(): OrdersServiceConfiguration {
    const params: OrdersServiceConfigurationParameters = {
      basePath: environment.apiUrl + '/Orders',
    };
    return new OrdersServiceConfiguration(params);
  }

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        importProvidersFrom(
            OrganizationsServiceModule.forRoot(OrganizationServiceFactory),
            ItemsServiceModule.forRoot(ItemsServiceFactory),
            OrdersServiceModule.forRoot(OrdersServiceFactory)
          ),
    ]
};
