import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent implements OnInit {
  loading = signal(false);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    // Initialize reports data
  }

  generateReport(type: string) {
    this.loading.set(true);
    this.dashboardService.generateInventoryReport(type).subscribe({
      next: (report) => {
        console.log('Generated report:', report);
        this.loading.set(false);
        // Handle report display/download
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.loading.set(false);
      }
    });
  }
}