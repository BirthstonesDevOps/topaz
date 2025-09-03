import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserRolesService {
  private _userRoles: WritableSignal<number[]> = signal(this._loadUserRoles());

  constructor() {
  }

  // Load user roles from localStorage
  private _loadUserRoles(): number[] {
    const stored = localStorage.getItem('userRoles');
    if(stored){
      return JSON.parse(stored);
    } else{
      localStorage.setItem('userRoles', JSON.stringify([4]));
      return [4];
    }
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
