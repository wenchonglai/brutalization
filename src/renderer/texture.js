export default class Texture{
  static STARTING_YS = {
    'farm1': 0,
    'farm2': 1,
    'camp': 2,
    'city': 5
  }
  constructor(image){
    this._image = image;
  }
  get image(){ return this._image; }
  get farm1(){ return [this.image, 0, 0, 128, 128] }
  get farm2(){ return [this.image, 0, 128, 128, 128] }
  get camp(){ return [this.image, 0, 256, 128, 128] }
  get city(){ return [this.image, 0, 640, 128, 128] }

  getTextureArgs(type){
    return [
      this.image, 0, 
      Texture.STARTING_YS[type] * 128, 
      128, 
      128
    ]
  }
}