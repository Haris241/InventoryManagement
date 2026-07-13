export interface ClientSettingGetDTO {
    id: string;
    name: string;
    imagePath: string;
}

export interface ClientSettingUpdateDTO {
    id: string;
    name: string;
    imageFile?: File;
    imagePath?: string;
}
