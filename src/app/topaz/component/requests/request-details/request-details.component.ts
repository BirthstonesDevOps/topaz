import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-details.component.html',
  styleUrl: './request-details.component.css'
})
export class RequestDetailsComponent implements OnInit {
  requestId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get the ID from the route parameters
    this.route.params.subscribe(params => {
      this.requestId = params['id'] ? +params['id'] : null;
      if (this.requestId) {
        this.loadRequestDetails();
      }
    });
  }

  loadRequestDetails() {
    if (!this.requestId) return;
    
    console.log('Loading request details for ID:', this.requestId);
    // TODO: Implement request details loading logic
  }

  goBack() {
    this.router.navigate(['/requests']);
  }
}
