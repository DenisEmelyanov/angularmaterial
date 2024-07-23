import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { PopupComponent } from '../popup/popup.component';

@Component({
  selector: 'app-file-select-dialog',
  templateUrl: './file-select-dialog.component.html',
  styleUrls: ['./file-select-dialog.component.css']
})
export class FileSelectDialogComponent {

  selectedFile: File | null = null;

  constructor(private ref: MatDialogRef<PopupComponent>) {
    
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onNoClick() {
    this.ref.close(null);
  }
  onSubmit() {
    this.ref.close(this.selectedFile );
    }    
}