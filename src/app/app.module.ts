import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';
import { MainComponent } from './main.component';

@NgModule({
  declarations: [
    MainComponent,
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),    
    AngularFireAuthModule
  ],
  providers: [AngularFireDatabase],
  bootstrap: [MainComponent]
})
export class AppModule {}
