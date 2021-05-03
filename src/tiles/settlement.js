import { Improvement } from "./improvement.js";

export class Settlement extends Improvement{
  static MAX_DENSITY = 2500
}

export class Camp extends Settlement{
  static COMBUSTIBILITY = 2;
  
}