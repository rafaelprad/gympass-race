import { isString } from 'util';

export class Validator {

  static isNullUndefined(value : any) : boolean {
    let result : boolean = false;
    if ( value === null || value === undefined) {
      result = true;
    }
    return result;
  }

  static isNullUndefinedEmpty(value : any) : boolean {
    let result : boolean = true;
    if ( !Validator.isNullUndefined(value) && ( isString(value) ) && ( value.trim().length > 0 ) ) {
      result = false;
    }
    return result;
  }

  static isArray(value : any) : boolean {
    let result : boolean = false;
    if ( !Validator.isNullUndefined(value) && ( value instanceof Array ) ) {
      result = true;
    }
    return result;
  }

  static isArrayWithItems(value : any, numGreaterThan : number = 0) : boolean {
    let result : boolean = false;
    if ( Validator.isArray(value) && (<Array<any>>value).length > numGreaterThan ) {
      result = true;
    }
    return result;
  }
}