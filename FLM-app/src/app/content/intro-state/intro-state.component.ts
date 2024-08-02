import { Component, Output, EventEmitter } from '@angular/core';
import {FormControl} from '@angular/forms';
import { ContentPageComponent } from '../content-page/content-page.component';
import { QueryServiceService } from '../../query-service.service';

@Component({
  selector: 'app-intro-state',
  templateUrl: './intro-state.component.html',
  styleUrl: './intro-state.component.scss'
})
export class IntroStateComponent {
  uploadedFile: boolean = false;
  inputQuery = new FormControl('');
  constructor(private queryService:QueryServiceService){
  }

  onFileSelected(event:any) {
    const file: File = event.target.files[0];
    if (file) {
      this.queryService.addFileEvent(event)
      this.uploadedFile = true;
    }
  }

  sendQuery(){
    if( this.inputQuery.value != null && this.inputQuery.value != ""){
      this.queryService.addQuery(this.inputQuery.value)
    } else{
      ///Show Error please input query
    }
  }
}
