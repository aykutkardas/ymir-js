import { expect } from "chai";
import "mocha";

import Board from "../src/board";
import { RulesType } from "../src/item";
import Rules from "../src/rules";

const movement = {
  stepCount:1,
  linear:true,
  angular:false
}

//  Test edilecek caseler
// kare board, 1er adım, linear yönlendirme, taş sol üstte [X]
// kare board, 1er adım, linear yönlendirme, taş ortada [X]
// kare board, 1er adım, angular ve linear yönlendirme, taş ortada [X],
// kare board, 3er adım, angular ve linear yönlendirme, taş konumu farketmez[X]
// kare board, 2şer adım linear yönlendirme, taş konumu farketmez[X]

// dikdörtgen board, 1er adım, angular yönlendirme, taş konumu farketmez [X]
// dikdörtgen board, 1er adım, angular yönlendirme taş sağ altta [X]
// dikdörtgen board, 3er adım, angular ve linear yönlendirme, taş konumu farketmez[X]
// dikdörtgen board, 2şer adım angular yönlendirme, taş konumu farketmez[X]


const boardCreator =(type:string,startingPoint:string,movement:RulesType)=>{
  const boardTypes = {
    square:new Board({ x: 5, y: 5 }),
    rectangle: new Board({ x: 5, y: 7 })
  }
  const availableColumn = new Rules(boardTypes[type]).getAvaiblableColumn(startingPoint,movement);
  return availableColumn;
}

describe("Rules Tests", () => {
  it('getAvailableColumns for SQUARE board, LINEAR movement and 1 step rules.', () => {
    const testBoard = boardCreator('square','0|0', {movement});
    expect(testBoard).to.deep.equal(["0|1", "1|0"]);
  });

  it('getAvailableColumns for SQUARE board, LINEAR movement and 1 step rules.', () => {
    const testBoard = boardCreator('square','1|1',{movement});
    expect(testBoard).to.deep.equal(["0|1", "1|0", "1|2", "2|1"]);
  });

  // Array sıralamasının doğru olması önemli olmadığı için to.have.all.members kullanıyorum
  it('getAvailableColumns for SQUARE board, LINEAR movement and 2 step rules.', () => {
    const testBoard = boardCreator('square','3|2',{movement:{...movement,stepCount:2}});
    expect(testBoard).to.have.all.members(['1|2','2|2','3|0','3|1','3|3','3|4','4|2']);
  });

  it('getAvailableColumns for SQUARE board, ANGULAR and LINEAR movements and 1 step rules.', () => {
    const testBoard = boardCreator('square','2|2',{movement:{...movement,angular:true}});
    expect(testBoard).to.have.all.members(['1|1','1|2','1|3','2|1','2|3','3|1','3|2','3|3']);
  });

  it('getAvailableColumns for SQUARE board, ANGULAR and LINEAR movements and 3 step rules.', () => {
    const testBoard = boardCreator('square','3|1',{movement:{...movement,angular:true,stepCount:3}});
    expect(testBoard).to.have.all.members(['0|1','0|4','1|1','1|3','2|0','2|1','2|2','3|0','3|2','3|3','3|4','4|0','4|1','4|2']);
  });

  it('getAvailableColumns for RECTANGLE board, ANGULAR movement and 1 step rules.', () => {
    const testBoard = boardCreator('rectangle','3|3',{movement:{...movement,linear:false,angular:true}});
    expect(testBoard).to.have.all.members(['2|2','2|4','4|2','4|4']);
  });

  it('getAvailableColumns for RECTANGLE board, ANGULAR movement and 1 step rules.', () => {
    const testBoard = boardCreator('rectangle','4|6',{movement:{...movement,linear:false,angular:true}});
    expect(testBoard).to.have.all.members(['3|5']);
  });

  it('getAvailableColumns for RECTANGLE board, ANGULAR and LINEAR movement and 3 step rules.', () => {
    const testBoard = boardCreator('rectangle','3|5',{movement:{...movement,angular:true,stepCount:3}});
    expect(testBoard).to.have.all.members(['0|2','0|5','1|3','1|5','2|4','2|5','2|6','3|2','3|3','3|4','3|6','4|4','4|5','4|6']);
  });

  it('getAvailableColumns for RECTANGLE board, ANGULAR movement and 2 step rules.', () => {
    const testBoard = boardCreator('rectangle','0|6',{movement:{...movement,angular:true,linear:false,stepCount:2}});
    expect(testBoard).to.have.all.members(['1|5','2|4']);
  });
});
