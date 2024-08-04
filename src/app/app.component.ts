import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShipEditorComponent } from "./components/ship-editor/ship-editor.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShipEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ship-interior-editor-app';
}
