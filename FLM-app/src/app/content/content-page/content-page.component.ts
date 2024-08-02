import { Component } from '@angular/core';
import { QueryServiceService } from '../../query-service.service';

import {MatDialog} from '@angular/material/dialog';
import {ChangeDetectionStrategy, inject} from '@angular/core';


@Component({
  selector: 'app-content-page',
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.scss'
})

export class ContentPageComponent {
  isExpanded = false;
  readonly dialog = inject(MatDialog);

  public queryService: QueryServiceService;
  constructor(queryService:QueryServiceService){
    this.queryService = queryService;
  }
  
  toggleWidth() {
    this.isExpanded = !this.isExpanded;
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogContentExampleDialog, {
      maxWidth: '60vw',
      maxHeight: '80vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

}

@Component({
  selector: 'dialog-content-example-dialog',
  templateUrl: './dialog-content-example-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogContentExampleDialog {}