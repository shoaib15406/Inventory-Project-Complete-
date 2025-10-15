import { Component, signal, computed, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

interface SearchSuggestion {
  text: string;
  category: string;
  icon: string;
  route?: string;
  data?: any;
}

interface RecentSearch {
  query: string;
  timestamp: Date;
  results?: number;
}

interface QuickFilter {
  label: string;
  icon: string;
  category: string;
  status?: string;
}

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // User and notifications
  currentUser = computed(() => this.authService.getCurrentUser());
  notifications = signal<any[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  // Search state
  searchQuery = '';
  searchFocused = false;
  showSearchDropdown = false;
  highlightedIndex = -1;
  isSearching = false;

  // Search results and suggestions
  searchResults = signal<any[]>([]);
  searchSuggestions = signal<SearchSuggestion[]>([]);
  recentSearches = signal<RecentSearch[]>([]);

  // Voice search
  isVoiceSearchSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  isRecording = false;
  private recognition: any;

  // Filters
  showFilters = false;
  selectedCategory = '';
  selectedDateRange = '';
  selectedStatus = '';

  // Quick filters
  quickFilters: QuickFilter[] = [
    { label: 'Low Stock', icon: 'warning', category: 'products', status: 'low-stock' },
    { label: 'New Orders', icon: 'receipt', category: 'orders', status: 'new' },
    { label: 'Active Suppliers', icon: 'business', category: 'suppliers', status: 'active' },
    { label: 'This Month', icon: 'calendar_month', category: 'reports', status: 'current-month' },
  ];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private router: Router
  ) {
    this.initializeVoiceSearch();
    this.setupSearchDebounce();
    this.loadRecentSearches();
  }

  ngOnInit() {
    // Load notifications
    this.dashboardService.getNotifications().subscribe(notifications => {
      this.notifications.set(notifications);
    });

    // Setup click outside listener
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  private setupSearchDebounce() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.performSearch(query);
      });
  }

  private initializeVoiceSearch() {
    if (this.isVoiceSearchSupported) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.searchQuery = transcript;
        this.isRecording = false;
        this.performSearch(transcript);
      };

      this.recognition.onerror = () => {
        this.isRecording = false;
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };
    }
  }

  private loadRecentSearches() {
    const stored = localStorage.getItem('recent-searches');
    if (stored) {
      const searches = JSON.parse(stored).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      }));
      this.recentSearches.set(searches);
    }
  }

  private saveRecentSearch(query: string, results: number = 0) {
    const recent = this.recentSearches();
    const existing = recent.findIndex(s => s.query.toLowerCase() === query.toLowerCase());
    
    if (existing !== -1) {
      recent.splice(existing, 1);
    }
    
    recent.unshift({
      query,
      timestamp: new Date(),
      results
    });

    // Keep only last 10 searches
    const limited = recent.slice(0, 10);
    this.recentSearches.set(limited);
    localStorage.setItem('recent-searches', JSON.stringify(limited));
  }

  private onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-container');
    
    if (!searchContainer) {
      this.showSearchDropdown = false;
      this.showFilters = false;
      this.highlightedIndex = -1;
    }
  }

  // Search Methods
  onSearchFocus() {
    this.searchFocused = true;
    this.showSearchDropdown = true;
    this.generateSearchSuggestions();
  }

  onSearchBlur() {
    // Delay hiding to allow for clicks on dropdown items
    setTimeout(() => {
      this.searchFocused = false;
    }, 150);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.searchQuery = value;
    
    if (value.trim()) {
      this.searchSubject.next(value.trim());
      this.generateSearchSuggestions();
    } else {
      this.searchResults.set([]);
      this.searchSuggestions.set([]);
      this.isSearching = false;
    }
    
    this.showSearchDropdown = true;
    this.highlightedIndex = -1;
  }

  onSearchKeydown(event: KeyboardEvent) {
    const suggestions = this.searchSuggestions();
    const recent = this.recentSearches();
    const totalItems = suggestions.length + (this.searchQuery ? 0 : recent.length);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, totalItems - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        this.handleEnterKey();
        break;
      case 'Escape':
        this.showSearchDropdown = false;
        this.highlightedIndex = -1;
        this.searchInputRef?.nativeElement.blur();
        break;
    }
  }

  private handleEnterKey() {
    const suggestions = this.searchSuggestions();
    const recent = this.recentSearches();
    
    if (this.highlightedIndex >= 0) {
      if (this.highlightedIndex < suggestions.length) {
        this.selectSuggestion(suggestions[this.highlightedIndex]);
      } else if (!this.searchQuery) {
        const recentIndex = this.highlightedIndex - suggestions.length;
        this.selectRecentSearch(recent[recentIndex]);
      }
    } else if (this.searchQuery.trim()) {
      this.executeSearch(this.searchQuery.trim());
    }
  }

  private performSearch(query: string) {
    if (!query.trim()) return;
    
    this.isSearching = true;
    
    // Simulate API calls - replace with actual service calls
    Promise.all([
      this.searchProducts(query),
      this.searchSuppliers(query),
      this.searchOrders(query)
    ]).then(([products, suppliers, orders]) => {
      const results = [...products, ...suppliers, ...orders];
      this.searchResults.set(results);
      this.isSearching = false;
      
      if (results.length > 0) {
        this.saveRecentSearch(query, results.length);
      }
    }).catch(() => {
      this.isSearching = false;
    });
  }

  private async searchProducts(query: string): Promise<any[]> {
    // Replace with actual product service call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { type: 'product', name: 'Sample Product 1', category: 'Electronics' },
          { type: 'product', name: 'Sample Product 2', category: 'Furniture' }
        ]);
      }, 100);
    });
  }

  private async searchSuppliers(query: string): Promise<any[]> {
    // Replace with actual supplier service call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { type: 'supplier', name: 'Sample Supplier 1', contact: 'contact1@example.com' },
          { type: 'supplier', name: 'Sample Supplier 2', contact: 'contact2@example.com' }
        ]);
      }, 100);
    });
  }

  private async searchOrders(query: string): Promise<any[]> {
    // Replace with actual order service call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { type: 'order', id: 'ORD-001', status: 'pending' },
          { type: 'order', id: 'ORD-002', status: 'completed' }
        ]);
      }, 100);
    });
  }

  private generateSearchSuggestions() {
    // Generate smart suggestions based on query and context
    const suggestions: SearchSuggestion[] = [];
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      
      // Add contextual suggestions
      suggestions.push(
        { text: `Search products for "${this.searchQuery}"`, category: 'Products', icon: 'inventory_2', route: '/products' },
        { text: `Search suppliers for "${this.searchQuery}"`, category: 'Suppliers', icon: 'business', route: '/suppliers' },
        { text: `Search orders for "${this.searchQuery}"`, category: 'Orders', icon: 'receipt', route: '/orders' }
      );
    }
    
    this.searchSuggestions.set(suggestions);
  }

  selectSuggestion(suggestion: SearchSuggestion) {
    this.searchQuery = suggestion.text;
    this.showSearchDropdown = false;
    this.executeSearch(suggestion.text);
  }

  selectRecentSearch(recent: RecentSearch) {
    this.searchQuery = recent.query;
    this.showSearchDropdown = false;
    this.executeSearch(recent.query);
  }

  private executeSearch(query: string) {
    this.performSearch(query);
    // Navigate to search results page if needed
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
    this.searchSuggestions.set([]);
    this.showSearchDropdown = false;
    this.searchInputRef?.nativeElement.focus();
  }

  clearRecentSearches() {
    this.recentSearches.set([]);
    localStorage.removeItem('recent-searches');
  }

  removeRecentSearch(recent: RecentSearch, event: Event) {
    event.stopPropagation();
    const searches = this.recentSearches().filter(s => s !== recent);
    this.recentSearches.set(searches);
    localStorage.setItem('recent-searches', JSON.stringify(searches));
  }

  // Voice Search
  startVoiceSearch() {
    if (!this.recognition || this.isRecording) return;
    
    this.isRecording = true;
    this.recognition.start();
  }

  // Filter Methods
  toggleFilters() {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      this.showSearchDropdown = true;
    }
  }

  applyQuickFilter(filter: QuickFilter) {
    this.selectedCategory = filter.category;
    if (filter.status) {
      this.selectedStatus = filter.status;
    }
    this.searchQuery = filter.label;
    this.showSearchDropdown = false;
    this.executeSearch(filter.label);
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedDateRange = '';
    this.selectedStatus = '';
  }

  applyFilters() {
    let query = this.searchQuery;
    
    if (this.selectedCategory) {
      query += ` category:${this.selectedCategory}`;
    }
    
    if (this.selectedStatus) {
      query += ` status:${this.selectedStatus}`;
    }
    
    if (this.selectedDateRange) {
      query += ` date:${this.selectedDateRange}`;
    }
    
    this.showFilters = false;
    this.executeSearch(query.trim());
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  viewProfile() {
    this.router.navigate(['/profile']);
  }

  markAllNotificationsRead() {
    this.dashboardService.markAllNotificationsAsRead().subscribe(() => {
      // Refresh notifications
      this.dashboardService.getNotifications().subscribe(notifications => {
        this.notifications.set(notifications);
      });
    });
  }

  viewNotification(notification: any) {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    if (!notification.isRead) {
      this.dashboardService.markNotificationAsRead(notification.id).subscribe();
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'error': return 'warn';
      case 'warning': return 'accent';
      case 'success': return 'primary';
      default: return '';
    }
  }
}
