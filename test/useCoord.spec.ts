import { expect } from "chai";
import "mocha";

import useCoord from "../src/utils/useCoord";

describe("useCoord Test",()=>{
  it('Should return array of numbers', () => {
    const coordinates = useCoord('1|9');
    expect(coordinates).to.deep.equal([1,9]);
  });
})