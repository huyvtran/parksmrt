import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ImagePickerService } from '../service/image-picker.service';

@Component({
  selector: 'app-rentspace',
  templateUrl: './rentspace.page.html',
  styleUrls: ['./rentspace.page.scss'],
})
export class RentspacePage implements OnInit {

  images = [];
  countryList;
  firstFormGroup: FormGroup;
  currentNumber = 1;

  constructor(private httpClient: HttpClient,
    private formBuilder: FormBuilder,
    private imagePickerService: ImagePickerService,
  ) { }


  ngOnInit() {
    this.httpClient.get('https://restcountries.eu/rest/v2/all')
      .subscribe((data) => {
        this.countryList = data;
      });

    this.firstFormGroup = this.formBuilder.group({
      address: ['', Validators.required]
    });
  }

  increment() {
    this.currentNumber++;
  }

  decrement() {
    this.currentNumber--;
  }

  selectImage() {
    this.imagePickerService.selectImage();
  }

  imgLoaded() {
    if (this.images != null) {
      return true;
    } else {
      return false;
    }
  }

}


