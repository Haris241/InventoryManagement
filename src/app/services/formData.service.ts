import { Injectable } from "@angular/core";
import { filter } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class FormDataService {
    buildFormData(formvalue: any,image?:File):FormData{
        const formdata = new FormData();
        Object.keys(formvalue).forEach(Key=>{
            const value= formvalue[Key];
            if(value===null || value===undefined){
                return;
            }
            if(typeof value ==='object' && !(value instanceof File)){
                formdata.append(Key,JSON.stringify(value));
            }else if(value instanceof File){
                formdata.append(Key,value);
            }else{
                formdata.append(Key,value.toString());
            }
        });
        if(image)
        {
            formdata.append('image',image);
        }
        return formdata;
    }
}