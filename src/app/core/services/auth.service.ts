import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserRole, LoginRequest, LoginResponse, AuthState } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  public currentUser$ = this.currentUserSubject.asObservable();
  public authState$ = this.authStateSubject.asObservable();

  // Mock users for demonstration
  private mockUsers: (User & { password: string })[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      email: 'admin@inventory.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.Admin,
      isActive: true,
      createdDate: new Date('2024-01-01'),
      updatedDate: new Date(),
      department: 'IT',
      permissions: ['read', 'write', 'delete', 'admin']
    },
    {
      id: '2',
      username: 'manager',
      password: 'manager123',
      email: 'manager@inventory.com',
      firstName: 'Manager',
      lastName: 'User',
      role: UserRole.Manager,
      isActive: true,
      createdDate: new Date('2024-01-01'),
      updatedDate: new Date(),
      department: 'Operations',
      permissions: ['read', 'write']
    },
    {
      id: '3',
      username: 'staff',
      password: 'staff123',
      email: 'staff@inventory.com',
      firstName: 'Staff',
      lastName: 'User',
      role: UserRole.Staff,
      isActive: true,
      createdDate: new Date('2024-01-01'),
      updatedDate: new Date(),
      department: 'Warehouse',
      permissions: ['read']
    }
  ];

  constructor() {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      this.updateAuthState({ isAuthenticated: true, user, token, loading: false, error: null });
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.updateAuthState({ ...this.authStateSubject.value, loading: true, error: null });

    return of(null).pipe(
      delay(1000), // Simulate API call
      map(() => {
        const user = this.mockUsers.find(u => 
          u.username === credentials.username && u.password === credentials.password
        );

        if (user) {
          const { password, ...userWithoutPassword } = user;
          const token = this.generateToken();
          const response: LoginResponse = {
            token,
            refreshToken: this.generateToken(),
            user: userWithoutPassword,
            expiresIn: 3600
          };

          // Store in localStorage
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(userWithoutPassword));

          this.currentUserSubject.next(userWithoutPassword);
          this.updateAuthState({
            isAuthenticated: true,
            user: userWithoutPassword,
            token,
            loading: false,
            error: null
          });

          return response;
        } else {
          this.updateAuthState({
            ...this.authStateSubject.value,
            loading: false,
            error: 'Invalid username or password'
          });
          throw new Error('Invalid username or password');
        }
      })
    );
  }

  logout(): Observable<boolean> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    this.currentUserSubject.next(null);
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    });

    return of(true);
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  canAccess(requiredRoles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }

  refreshToken(): Observable<string> {
    const newToken = this.generateToken();
    localStorage.setItem('auth_token', newToken);
    this.updateAuthState({
      ...this.authStateSubject.value,
      token: newToken
    });
    return of(newToken);
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates, updatedDate: new Date() };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
      this.updateAuthState({
        ...this.authStateSubject.value,
        user: updatedUser
      });
      return of(updatedUser);
    }
    return throwError(() => new Error('No user logged in'));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    // In a real app, this would call an API
    return of(true).pipe(delay(500));
  }

  private generateToken(): string {
    return btoa(Date.now().toString() + Math.random().toString()).substr(0, 20);
  }

  private updateAuthState(state: AuthState): void {
    this.authStateSubject.next(state);
  }

  // Get all users (admin only)
  getAllUsers(): Observable<User[]> {
    if (this.hasRole(UserRole.Admin)) {
      const users = this.mockUsers.map(({ password, ...user }) => user);
      return of(users);
    }
    return throwError(() => new Error('Unauthorized'));
  }

  // Create user (admin only)
  createUser(userData: Omit<User, 'id' | 'createdDate' | 'updatedDate'> & { password: string }): Observable<User> {
    if (this.hasRole(UserRole.Admin)) {
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        createdDate: new Date(),
        updatedDate: new Date()
      };
      this.mockUsers.push(newUser);
      const { password, ...userWithoutPassword } = newUser;
      return of(userWithoutPassword);
    }
    return throwError(() => new Error('Unauthorized'));
  }
}