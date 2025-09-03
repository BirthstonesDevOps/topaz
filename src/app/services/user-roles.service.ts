import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserRolesService {
  private _userRoles: WritableSignal<number[]> = signal(this._loadUserRoles());

  constructor() {
    this._loadUserRoles();
  }

  // Load user roles from localStorage
  private _loadUserRoles(): number[] {
    const stored = localStorage.getItem('userRoles');
    return stored ? JSON.parse(stored) : [0, 1, 2, 3];
  }

  // Expose the signal for components to consume
  get userRoles() {
    return this._userRoles;
  }

  // Update user roles and sync with localStorage
  setUserRoles(roles: number[]): void {
    this._userRoles.update(() => roles);
    localStorage.setItem('userRoles', JSON.stringify(roles));
  }
}
