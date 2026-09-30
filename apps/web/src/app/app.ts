import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';

@Component({
  imports: [RouterOutlet, HlmToasterImports],
  selector: 'flipvote-root',
  templateUrl: './app.html',
})
export class App {}
