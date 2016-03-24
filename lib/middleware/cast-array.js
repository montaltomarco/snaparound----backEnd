"use strict";

export default function createMiddleware(castedParams = [], splitSymbol = ",") {
  return function*(next) {
    castedParams.forEach((param) => {
      if(this.request.body
        && this.request.body.fields
        && this.request.body.fields[param]) {
        this.request.body.fields[param] =
          this.request.body.fields[param].split(splitSymbol);
      }
    });
    if(next) {
      yield next;
    }
  };
}
