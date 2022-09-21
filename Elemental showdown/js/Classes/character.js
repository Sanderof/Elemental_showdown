

class Character {
  constructor(startTile, charIdx) {
      this.x = 0;
      this.y = 0;
      this.dimensions = [64, 64]; // Width and height in pixels
      this.charIdx = charIdx; // Character index

      this.drawDimensions = [64, 96]; // Width and height of the drawing of the character
      this.animTime = Date.now(); // Animation time
      this.frameRate = 250; // Milliseconds per frame

      this.startTile = startTile;
      this.tileFrom  = [this.startTile[0], this.startTile[1]];
      this.tileTo    = [this.startTile[0], this.startTile[1]];
      this.moveDelay = 700; // Time in milliseconds it takes to move one tile
      this.attackDelay = 500;
      this.attackData = { tile: [null, null], dmgDealt: false };
      this.actionStart = null; // The time when the player starts moving
      this.actionType  = null; // Movement or attack or healing
      this.inQueue = false;

      this.pattern = {
          w: 7,
          h: 7,
          center: 3 // Center tile index og the movementPattern array,
      }

      this.hp  = 100;
      this.dmg =   0;
      this.deafeated = false;
  }

  _setStartValues() {
      this.hp  =  this.ohp;
      this.dmg = this.odmg;
  }

  _setPosition(map) {
      this.x = map.marginLeft+(this.tileFrom[0]*map.ts);
      this.y = map.marginTop +(this.tileFrom[1]*map.ts);
      map.map[map._coordsToIdx(this.tileTo[0], this.tileTo[1])].status = this.charIdx;
  }

  //--------------------------------------------------- Transformation functions

  _patternCoordsToIdx(x, y) {
      return (y*this.pattern.w)+x;
  }

  _patternIdxToCoords(idx) {
      const y = Math.floor(idx/this.pattern.w);
      return [idx-(y*this.pattern.w), y];
  }

  //--------------------------------------------------------- Possibility checks

  _movePossibility(map, selTile, baseTile) { // map, selected tile
      if (selTile[0] >= 0 && selTile[0] < map.w && selTile[1] >= 0 && selTile[1] < map.h) {
          let patternTile = [null, null];

          if (Math.abs(selTile[0]-baseTile[0]) <= this.pattern.center && Math.abs(selTile[1]-baseTile[1]) <= this.pattern.center) {
              patternTile[0] = (selTile[0] > baseTile[0]) ? this.pattern.center+(selTile[0]-baseTile[0]) : this.pattern.center-(baseTile[0]-selTile[0]);
              patternTile[1] = (selTile[1] > baseTile[1]) ? this.pattern.center+(selTile[1]-baseTile[1]) : this.pattern.center-(baseTile[1]-selTile[1]);
          }

          if (this.movementPattern[this._patternCoordsToIdx(patternTile[0], patternTile[1])] === 1 && !map._collision(selTile[0], selTile[1], baseTile, 'move', this.type)) { return true; }
          else { return false; }
      }
  }

  _attackPossibility(map, selTile, baseTile) {
      if (selTile[0] >= 0 && selTile[0] < map.w && selTile[1] >= 0 && selTile[1] < map.h) {
          const tileStatus = map.map[map._coordsToIdx(selTile[0], selTile[1])].status;
          let patternTile = [null, null];

          if (Math.abs(selTile[0]-baseTile[0]) <= this.pattern.center && Math.abs(selTile[1]-baseTile[1]) <= this.pattern.center) {
              patternTile[0] = (selTile[0] > baseTile[0]) ? this.pattern.center+(selTile[0]-baseTile[0]) : this.pattern.center-(baseTile[0]-selTile[0]);
              patternTile[1] = (selTile[1] > baseTile[1]) ? this.pattern.center+(selTile[1]-baseTile[1]) : this.pattern.center-(baseTile[1]-selTile[1]);
          }

          if (this.attackPattern[this._patternCoordsToIdx(patternTile[0], patternTile[1])] === 1 && !map._collision(selTile[0], selTile[1], baseTile, 'attack', this.type) &&
              ((this.type === 'ally' && tileStatus >= 15 && tileStatus < 30) || (this.type === 'enem' && tileStatus >= 1 && tileStatus < 15))) { return true;
          } else { return false; }
      }
  }

  //------------------------------------------------------------------- Movement

  _processMovement(map, time, actionQueue) {
      if (time-this.chargeClock >= this.chargeTime && actionQueue[0] === this.charIdx && this.actionType === 'move') {
          if (this.actionStart === null) {
              if (this.tileFrom[0] === this.tileTo[0] && this.tileFrom[1] === this.tileTo[1]) { this._setPosition(map); }
              else if (this.tileFrom[0] !== this.tileTo[0] || this.tileFrom[1] !== this.tileTo[1]) {
                  this.actionStart = Date.now();
                  if (this.tileTo[0] > this.tileFrom[0]) { this.dir = 'right'; } else if (this.tileTo[0] < this.tileFrom[0]) { this.dir = 'left'; }
              }
          } else {
              let tilesToGo = [0, 0, 0]; // x-direction, y-direction, longest route
              if (this.tileFrom[0] !== this.tileTo[0] || this.tileFrom[1] !== this.tileTo[1]) {
                  tilesToGo[0] = (this.tileFrom[0] < this.tileTo[0]) ? this.tileTo[0]-this.tileFrom[0] : this.tileFrom[0]-this.tileTo[0];
                  tilesToGo[1] = (this.tileFrom[1] < this.tileTo[1]) ? this.tileTo[1]-this.tileFrom[1] : this.tileFrom[1]-this.tileTo[1];
                  tilesToGo[2] = (tilesToGo[0] > tilesToGo[1]) ? tilesToGo[0] : tilesToGo[1];

                  let tileFromPos = [map.marginLeft+(this.tileFrom[0]*map.ts), map.marginTop+(this.tileFrom[1]*map.ts)]; // Start position
                  let scale       = (time-this.actionStart)/(this.moveDelay*tilesToGo[2]);        // Percentage of the way traveled
                  let currentDist = [(map.ts*tilesToGo[0])*scale, (map.ts*tilesToGo[1])*scale]; // Currentley traveled distance in pixels
                  this.x = (this.tileFrom[0] < this.tileTo[0]) ? tileFromPos[0]+currentDist[0] : tileFromPos[0]-currentDist[0];
                  this.y = (this.tileFrom[1] < this.tileTo[1]) ? tileFromPos[1]+currentDist[1] : tileFromPos[1]-currentDist[1];
              }

              if (time-this.actionStart > this.moveDelay*tilesToGo[2]) {
                  map.map[map._coordsToIdx(this.tileFrom[0], this.tileFrom[1])].status = 0;
                  this.tileFrom[0] = this.tileTo[0]; this.tileFrom[1] = this.tileTo[1];
                  this.chargeClock = Date.now(); actionQueue.shift(); this.inQueue = false;
                  this._setPosition(map); this.actionStart = null; this.actionType = null;
              }
          }
      }
  }

  _setMoveData(map, selectedTile, actionQueue) {
      this.tileTo[0] = selectedTile[0]; this.tileTo[1] = selectedTile[1]; this.actionType = 'move';
      actionQueue.push(this.charIdx); this.inQueue = true; // Adds the movement to the queue
      map.map[map._coordsToIdx(this.tileTo[0], this.tileTo[1])].status = 'blocked';
  }

  //--------------------------------------------------------------------- Attack

  _processAttack(map, time, actionQueue, opponents) {
      if (time-this.chargeClock >= this.chargeTime && actionQueue[0] === this.charIdx && this.actionType === 'attack') {
          if (this.actionStart === null) {
              this.actionStart = Date.now();
              if (this.attackData.tile[0] > this.tileFrom[0]) { this.dir = 'right'; } else if (this.attackData.tile[0] < this.tileFrom[0]) { this.dir = 'left'; }
          } else {

              // Add attack animation code here

              if (time-this.actionStart > this.attackDelay) {
                  this.chargeClock = Date.now(); actionQueue.shift(); this.inQueue = false;
                  this.actionStart = null; this.attackData.dmgDealt = false; this.actionType = null;
                  this._arrangeDefeat(map, opponents);
              } else if (!this.attackData.dmgDealt && time-this.actionStart > this.attackDelay/2) {
                  opponents.some((opponent, idx) => {
                      if (opponent.tileFrom[0] === this.attackData.tile[0] && opponent.tileFrom[1] === this.attackData.tile[1]) {
                          if (opponent.hp - this.dmg > 0) { opponent.hp -= this.dmg; } else { opponent.hp = 0; opponent.defeated = true; }
                          this.attackData.dmgDealt = true; return true;
                      }
                  });
              }
          }
      }
  }

  _setAttackData(map, selectedTile, actionQueue) {
      actionQueue.push(this.charIdx); this.inQueue = true; // Adds the attack to the queue
      this.attackData.tile = selectedTile; this.actionType = 'attack';
  }

  //--------------------------------------------------------------------- Defeat

  _arrangeDefeat(map, opponents) {
    opponents.some((opponent, idx) => { if (opponent.defeated) {
        opponents.splice(idx, 1);
        map.map[map._coordsToIdx(opponent.tileFrom[0], opponent.tileFrom[1])].status = 0; return true;
    } });
  }

  //-------------------------------------------------------------------- Drawing

  _draw(ts, ctx, img, imgHealth, time) {
      let cutData;

      switch(this.dir) {
        case 'left': cutData =  this.idleLeft; break;
        default:     cutData = this.idleRight; break;
      }

      for (let i = 0; i < cutData.sy.length; i++) {
          if (time-this.animTime >= this.frameRate*i && time-this.animTime < this.frameRate*(i+1)) {
              drawImg(ctx, img, cutData.sx, cutData.sy[i], cutData.sw, cutData.sh, this.x, this.y+ts-this.drawDimensions[1], this.drawDimensions[0], this.drawDimensions[1]);
          }
      }

      if (time-this.animTime >= this.frameRate*(cutData.sy.length)) {
          drawImg(ctx, img, cutData.sx, cutData.sy[0], cutData.sw, cutData.sh, this.x, this.y+ts-this.drawDimensions[1], this.drawDimensions[0], this.drawDimensions[1]);
          this.animTime = Date.now();
      }

      // Health bar
      let lengthFactor = this.hp/this.ohp;
      if (lengthFactor < 1) { // The health bar is only shown if the character has taken damage
          drawImg(ctx, imgHealth,  0, 0,              64, 64, this.x, this.y+ts-this.drawDimensions[1]-40,              ts, ts);
          drawImg(ctx, imgHealth, 64, 0, 64*lengthFactor, 64, this.x, this.y+ts-this.drawDimensions[1]-40, ts*lengthFactor, ts);
      }

  }

  //------------------------------------------------------------------------- AI

  _makeMove(time, map, actionQueue) {
      if (time-this.chargeClock >= this.chargeTime && this.moveMoved !== null && !this.inQueue) {

          //--------------------------------------------------- Isolate opponent
          let opponentDistances   = [];
          let opponentPositions   = [];

          let searchRange = [];
          if      (this.type === 'enem') { searchRange = [1, 10]; }
          else if (this.type === 'ally') { searchRange = [15,29]; }

          map.map.forEach((tile, idx) => {
              if (tile.status >= searchRange[0] && tile.status <= searchRange[1]) { // Detects an opponent and its position
                  opponentPositions.push(map._idxToCoords(idx)); // Saves the tile-coordinates of the detected opponent
              }
          });

          opponentPositions.forEach(tile => {
              let x = tile[0]-this.tileFrom[0];
              let y = tile[1]-this.tileFrom[1];
              opponentDistances.push({xy: tile, dist: Math.abs(x)+Math.abs(y)}); // Coordinates and absolute distance
          });

          opponentDistances.sort((a, b) => a.dist-b.dist); // Sorts from closest to farthest away
          const opponent = opponentDistances[0]; // Isolates the closest opponent


          // Checks if it can attack or not
          if (opponent) {
            if (this._attackPossibility(map, opponent.xy, this.tileFrom)) { this._setAttackData(map, opponent.xy, actionQueue); }
            else {

                //------------------ Isolate the tiles to which the character can move

                let freeTiles = []; let canAttack = false;

                this.movementPattern.forEach((value, idx) => {
                    let tile    = this._patternIdxToCoords(idx);
                    let mapTile = [this.tileFrom[0]-this.pattern.center+tile[0], this.tileFrom[1]-this.pattern.center+tile[1]];

                    if (this._movePossibility(map, mapTile, this.tileFrom)) {
                        let data = { xy: mapTile, dist: Math.abs(opponent.xy[0]-mapTile[0])+Math.abs(opponent.xy[1]-mapTile[1]) };
                        freeTiles.push({ mainTile: data, tileArray: [data] });
                    }
                });

                //---- Analyse further movement possibilties to find the optimal route

                for (let i = 0; i < 5; i++) { // Analysis of 5 further moves
                    freeTiles.some(array => {
                        let protoArray = []; let addIdx = 0; let lastIdx = array.tileArray.length-1;
                        if (array.tileArray[lastIdx]) {
                            this.movementPattern.some((value, idx) => {
                                let tile    = this._patternIdxToCoords(idx);
                                let mapTile = [array.tileArray[lastIdx].xy[0]-this.pattern.center+tile[0], array.tileArray[lastIdx].xy[1]-this.pattern.center+tile[1]];

                                if (this._movePossibility(map, mapTile, array.tileArray[lastIdx].xy)) {
                                    protoArray.push({ xy: mapTile, dist: Math.abs(opponent.xy[0]-mapTile[0])+Math.abs(opponent.xy[1]-mapTile[1]) });
                                }
                            });

                            protoArray.sort((a, b) => a.dist-b.dist); // Sorts from closest to farthest away
                            if (protoArray.length > 0 && array.tileArray[lastIdx-1] && protoArray[addIdx].xy[0] === array.tileArray[lastIdx-1].xy[0] &&
                                protoArray[0].xy[1] === array.tileArray[lastIdx-1].xy[1]) { addIdx = 1; } // Avoids repeating movements

                            // It is already as close as can be. The movement analysis stops
                            if (!this._attackPossibility(map, opponent.xy, array.tileArray[lastIdx].xy)) { array.tileArray.push(protoArray[addIdx]); } // Adds the shortest distance to the freeTiles array
                            else { canAttack = true; } // Enemy can attack a friendly
                        }
                    });
                }

                if (canAttack) {
                    freeTiles.forEach((array, idx) => {
                        if (array.tileArray[array.tileArray.length-1] &&
                            !this._attackPossibility(map, opponent.xy, array.tileArray[array.tileArray.length-1].xy)) { freeTiles.splice(idx, 1); }
                    });
                    freeTiles.sort((a, b) => { return a.tileArray.length-b.tileArray.length; });
                } else {
                    freeTiles.sort((a, b) => { if (a.tileArray[a.tileArray.length-1] && b.tileArray[b.tileArray.length-1]) {
                        return a.tileArray[a.tileArray.length-1].dist-b.tileArray[b.tileArray.length-1].dist;
                    } }); // Sorts from closest to farthest away
                }

                // As long as it cannot attack, it will move
                if (freeTiles.length > 0 && !this._attackPossibility(map, opponent.xy, this.tileFrom)) {
                    this._setMoveData(map, freeTiles[0].mainTile.xy, actionQueue);
                }
            }
        }

      }
  }

  //----------------------------------------------------------------------------
}

//----------------------------------------------------------------------- Allies

class Ally extends Character {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.type = 'ally';
      this.dir = 'right'; // Direction facing

  }

  _colorMoveTiles(ctx, map, time) {
      if (!this.inQueue && time-this.chargeClock >= this.chargeTime) {

          //----------------------------------------------------------- Movement

          this.movementPattern.forEach((value, idx) => {
              let tile = this._patternIdxToCoords(idx);
              let mapTile = [this.tileFrom[0]-this.pattern.center+tile[0], this.tileFrom[1]-this.pattern.center+tile[1]];
              if (this._movePossibility(map, mapTile, this.tileFrom)) {
                  drawRect(ctx, (mapTile[0]*map.ts)+map.marginLeft, (mapTile[1]*map.ts)+map.marginTop, map.ts, map.ts, 'rgba(255, 255, 255, 1)', 'rgba(10, 100, 255, .6)');
              }
          });

          //------------------------------------------------------------- Attack

          this.attackPattern.forEach((value, idx) => {
              let tile = this._patternIdxToCoords(idx);
              let mapTile = [this.tileFrom[0]-this.pattern.center+tile[0], this.tileFrom[1]-this.pattern.center+tile[1]];
              if (this._attackPossibility(map, mapTile, this.tileFrom)) {
                  drawRect(ctx, (mapTile[0]*map.ts)+map.marginLeft, (mapTile[1]*map.ts)+map.marginTop, map.ts, map.ts, 'rgba(255, 255, 255, 1)', 'rgba(255, 100, 100, .6)');
              }
          });

      }
  }
}

//------------------------------------------------------------------------- Fire

class Fire extends Ally {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.charIdx = 1;
      this.chargeTime = 7000; // Time between each move
      this.chargeClock = Date.now()-this.chargeTime;

      this.movementPattern = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 1, 0, 1, 0, 1, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 1, 0, 1, 0, 1, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 0, 0, 0, 0, 0, 0
      ];

      this.attackPattern   = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 0, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0];

      // Drawing
      this.idleRight = {
          sx: 32,
          sy: [0, 48, 0, 96],
          sw: 32,
          sh: 48
      }

      this.idleLeft = {
          sx: 32,
          sy: [144, 192, 144, 240],
          sw: 32,
          sh: 48
      }

      this.ohp = 60; // Original health points
      this.odmg = 32;
  }
}

//------------------------------------------------------------------------ Water

class Water extends Ally {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.charIdx = 2;
      this.chargeTime = 12000; // Time between each move
      this.chargeClock = Date.now()-this.chargeTime;

      this.movementPattern = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 0, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0
      ];

      this.attackPattern   = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 0, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0];

      this.ohp = 120; // Original health points
      this.odmg = 40;
  }
}

//------------------------------------------------------------------------ Grass

class Grass extends Ally {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.chargeTime = 3000; // Time between each move
      this.chargeClock = Date.now()-this.chargeTime;

      this.movementPattern = [0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 1, 1, 1, 0,
                              1, 1, 1, 0, 1, 1, 1,
                              0, 1, 1, 1, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0];

      this.attackPattern   = [0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 1, 1, 1, 0,
                              1, 1, 1, 0, 1, 1, 1,
                              0, 1, 1, 1, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0];

      // Drawing
      this.idleRight = {
          sx: 0,
          sy: [0, 48, 96, 48],
          sw: 32,
          sh: 48
      }

      this.idleLeft = {
          sx: 0,
          sy: [144, 192, 240, 192],
          sw: 32,
          sh: 48
      }

      this.ohp = 50; // Original health points
      this.odmg = 25;
  }
}

//---------------------------------------------------------------------- Enemies

class Enemy extends Character {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.type = 'enem';
      this.dir = 'left'; // Direction facing
  }

}

//---------------------------------------------------------------------- Warrior

class Warrior extends Enemy {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.charIdx = 16; // Character index
      this.chargeTime = 4500; // Time between each move
      this.chargeClock = Date.now();

      this.movementPattern = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 1, 0, 1, 0, 1, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 1, 0, 1, 0, 1, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 0, 0, 0, 0, 0, 0];

      this.attackPattern   = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 0, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0];

      // Drawing
      this.idleRight = {
          sx: 32,
          sy: [0, 48, 0, 96],
          sw: 32,
          sh: 48
      }

      this.idleLeft = {
          sx: 32,
          sy: [144, 192, 144, 240],
          sw: 32,
          sh: 48
      }

      this.ohp = 60; // Original health points
      this.odmg = 32;
  }
}

//------------------------------------------------------------------------- Tank

class Tank extends Enemy {
  constructor(startTile, charIdx) {
      super(startTile, charIdx);
      this.chargeTime = 6000; // Time between each move
      this.chargeClock = Date.now();

      this.movementPattern = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 1, 1, 0, 1, 1, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 1, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0];

      this.attackPattern   = [0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 1, 0, 1, 0, 0,
                              0, 0, 1, 1, 1, 0, 0,
                              0, 0, 0, 0, 0, 0, 0,
                              0, 0, 0, 0, 0, 0, 0];

      // Drawing
      this.idleRight = {
          sx: 32,
          sy: [0, 48, 0, 96],
          sw: 32,
          sh: 48
      }

      this.idleLeft = {
          sx: 32,
          sy: [144, 192, 144, 240],
          sw: 32,
          sh: 48
      }

      this.ohp = 100; // Original health points
      this.odmg = 40
  }
}
