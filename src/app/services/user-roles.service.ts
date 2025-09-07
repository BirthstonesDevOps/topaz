import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { PermissionService } from '@birthstonesdevops/topaz.backend.organizationservice';

@Injectable({
  providedIn: 'root'
})
export class UserRolesService {
  private _userRoles: WritableSignal<number[]> = signal([0]);

  allCookies = document.cookie; // Returns a string of all accessible cookies
// To get a specific cookie value:
  myCookie = this.getCookie('_oauth2_proxy');
  constructor(private permissionSv: PermissionService) {
    this._userRoles.set(this._loadUserRoles());
  }

  // Load user roles from localStorage
  private _loadUserRoles(): number[] {
    // Since the API call is asynchronous, return a default value synchronously
    // and update the signal when the response arrives.
    this.permissionSv?.permissionGetPermissionsByEmail().subscribe(
      (response: string[]) => {
        console.log('permissions: ', response);
        // Parse strings to numbers and filter out NaN
        const roles = response.map(r => Number(r)).filter(n => !isNaN(n));
        this._userRoles.set(roles);
      },
      error => {
        console.error('Error fetching permissions:', error);
        this._userRoles.set([0]);
      }
    );
    // Return a default value synchronously
    return [-1];
  }

  // Expose the signal for components to consume
  get userRoles() {
    return this._userRoles;
  }

  // Update user roles and sync with localStorage
  setUserRoles(roles: number[]): void {
    this._userRoles.set(roles);
    localStorage.setItem('userRoles', JSON.stringify(roles));
  }

  public getCookie(name: string): string | null {
    console.log('cookies: ', document.cookie);
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
}
