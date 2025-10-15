import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  currentUser = computed(() => this.authService.getCurrentUser());

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Products',
      icon: 'inventory',
      route: '/products'
    },
    {
      label: 'Inventory',
      icon: 'store',
      route: '/inventory'
    },
    {
      label: 'Suppliers',
      icon: 'business',
      route: '/suppliers'
    },
    {
      label: 'Reports',
      icon: 'bar_chart',
      route: '/reports'
    },
    {
      label: 'User Management',
      icon: 'people',
      route: '/users',
      roles: [UserRole.Admin]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canShowItem(item: NavigationItem): boolean {
    if (!item.roles) return true;
    const user = this.currentUser();
    return user ? item.roles.includes(user.role) : false;
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
