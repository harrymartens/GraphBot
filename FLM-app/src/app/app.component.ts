import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContentModule } from './content/content.module';
import { ContentPageComponent } from './content/content-page/content-page.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';




@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ContentModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'FLM-app';
  constructor(private http: HttpClient) { }

}
