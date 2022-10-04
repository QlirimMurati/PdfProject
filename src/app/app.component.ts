import { Component, ElementRef, OnInit } from '@angular/core';
import { PDFDocumentProxy } from 'ng2-pdf-viewer';
import { pdfFile } from './pdfFile'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public pdfSrc = this.base64ToArrayBuffer(pdfFile);
  public zoomValue = 1.1;
  public disableZoom = false;
  public pdf: PDFDocumentProxy;
  public inputFields;
  public zoom = false;
  public loadInputs = false;
  public showLoadingSpinner = true;

  constructor(private elRef: ElementRef) {}

  public onFileSelected() {
    let $img: any = document.querySelector('#file');
    if (typeof (FileReader) !== 'undefined') {
      let reader = new FileReader();
      reader.onload = (e: any) => {
        this.pdfSrc = e.target.result;
      };
      reader.readAsArrayBuffer($img.files[0]);
    }
  }

  private addInput(currentPage: any, annotation: PDFAnnotationData, i: number) {
    var div = this.elRef.nativeElement.querySelector("pdf-viewer.pdf-viewer div[data-page-number='" + i + "']");
    if (div) {
      var scaleX = this.calculateScale(div.offsetWidth, currentPage._pageInfo.view[2]);
      var scaleY = this.calculateScale(div.offsetHeight, currentPage._pageInfo.view[3]);

      let inputFieldContainer = document.createElement("div");
      inputFieldContainer.setAttribute("style", "width:" + ((annotation.rect[2] - annotation.rect[0]) * scaleX) + "px; bottom:" +
        annotation.rect[1] * scaleX + "px; left:" + annotation.rect[0] * scaleX + "px; right:" + annotation.rect[2] * scaleX + "px; height:" + ((annotation.rect[3] - annotation.rect[1]) * scaleY) + "px;");
      inputFieldContainer.classList.add('inputFieldContainer');

      let inputField = document.createElement("input");
      inputField.innerHTML = "InputField";
      inputField.setAttribute("id", annotation.id);
      inputField.setAttribute("name", annotation.fieldName);
      inputField.classList.add('inputField');

      if (annotation.fieldType === 'Tx') {
        inputField.setAttribute("type", "text");
        inputField.addEventListener('click', (e) => {
        });
      }

      if ((annotation.fieldType === 'Btn' && !annotation.checkBox) || annotation.checkBox) {
        if (annotation.checkBox)
          inputField.setAttribute("type", "checkbox");
        else
          inputField.setAttribute("type", "radio");

        inputField.addEventListener('click', (e) => {
        });
      }

      if (annotation.fieldType === 'Sig') {
        inputField.setAttribute("type", "signature");
      }

      inputFieldContainer.appendChild(inputField);
      div.appendChild(inputFieldContainer);
    }
  }

  public zoomIn() {
    this.showLoadingSpinner = true;
    this.zoomValue += 0.1;
    this.afterLoadComplete(this.pdf);
  }

  public zoomOut() {
    this.showLoadingSpinner = true;
    this.zoomValue -= 0.1;
    this.afterLoadComplete(this.pdf);
  }

  public afterLoadComplete(pdf: PDFDocumentProxy): void {
    this.pdf = pdf;
    this.showLoadingSpinner = false;
    this.inputFields = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      let currentPage = null;
      pdf.getPage(i).then(p => {
        currentPage = p;
        return p.getAnnotations();
      }).then(ann => {
        const annotations = (<any>ann) as PDFAnnotationData[];
        annotations.filter(annotation => annotation.subtype === 'Widget')
          .forEach(annotation => {
            this.inputFields.push(annotation);
            setTimeout(() => {
              this.addInput(currentPage, annotation, i);
            }, 250);
          });
      });
    }
  }

  public calculateScale(w1, w2) {
    let s1 = w1 / w2;
    return s1
  }

  public base64ToArrayBuffer(base64): Uint8Array {
    let binary_string = window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }

  public waitForUpdate(conditionFunction) {
    const poll = resolve => {
      if (conditionFunction()) resolve();
      else setTimeout(_ => poll(resolve), 100);
    }
    return new Promise(poll);
  }
}
