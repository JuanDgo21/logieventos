import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'frontend';
}
