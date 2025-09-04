import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { PermissionService } from '@birthstonesdevops/topaz.backend.organizationservice';

@Injectable({
  providedIn: 'root'
})
export class UserRolesService {
  private _userRoles: WritableSignal<number[]> = signal([0]);
  constructor(private permissionSv: PermissionService) {
    this._userRoles.set(this._loadUserRoles());
  }

  // Load user roles from localStorage
  private _loadUserRoles(): number[] {
    // Since the API call is asynchronous, return a default value synchronously
    // and update the signal when the response arrives.
    this.permissionSv.permissionGetPermissionsByEmail().subscribe(
      response => {
        console.log('permissions: ',response);
        // Update the signal with the actual roles when received
        this._userRoles.set([0]); // Replace [0] with actual roles from response if available
      },
      error => {
        console.error('Error fetching permissions:', error);
        this._userRoles.set([0]);
      }
    );
    // Return a default value synchronously
    return [0];
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
}
