
class MapInstance {
  constructor(width, height, tileSize, tileBorderColor, possibleTileColor, theme) {
      this.w     =     width;
      this.h     =    height;
      this.ts    =  tileSize;
      this.tbc   =  tileBorderColor;
      this.ptc   =  possibleTileColor;
      this.theme =    theme; // Appearence of the tiles
      this.marginLeft   = this.ts;
      this.marginRight  = this.marginLeft+(this.ts*(this.w-1));
      this.marginTop    = this.ts;
      this.marginBottom = this.marginTop +(this.ts*(this.h-1));

      this.map = [{status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0},
                  {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 30}, {status: 0}, {status: 0}, {status: 0}, {status: 0},
                  {status: 0}, {status: 0}, {status: 30}, {status: 30}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status:30},
                  {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 30}, {status: 0}, {status: 0},
                  {status: 0}, {status: 0}, {status: 0}, {status: 30}, {status: 0}, {status: 0}, {status: 0}, {status: 0}, {status: 0}
      ];
  }

  // Finds the map index according to the x- and y-value of the given tile
  _coordsToIdx(x, y) {
      return (y*this.w)+x;
  }

  _idxToCoords(idx) {
      const y = Math.floor(idx/this.w);
      return [idx-(y*this.w), y];
  }

  // Collision : Enemy or obstacle
  _collision(selTileX, selTileY, playerTile, condition, type) { // Selected tile
      let selIdx    = this._coordsToIdx(selTileX, selTileY);
      let playerIdx = this._coordsToIdx(playerTile[0], playerTile[1]);

      if (selIdx >= 0 && selIdx <= this.map.length-1) {

          let check = mapIdx => {
              if (this.map[mapIdx]) {
                  const status = this.map[mapIdx].status;
                  if (status !== 0) {
                      if (condition === 'move') { return true; }
                      if (condition === 'attack' && ((type === 'ally' && (status < 15 || status >= 30)) || (type === 'enem' && (status < 1 || status >= 15)))) { return true; }
                  }
              }
          }

          if (check(selIdx))                                                              { return true; }
          for (let i = 0; i < 2; i++) {
              if (selTileX >= playerTile[0]+2) {
                  if (selTileY === playerTile[1]-1 && check((playerIdx-(this.w*i))+1))    { return true; }
                  if (selTileY === playerTile[1]+1 && check((playerIdx+(this.w*i))+1))    { return true; }
                  if (selTileY === playerTile[1]   && check(playerIdx+1+i))               { return true; }
              } else if (selTileX <= playerTile[0]-2) {
                  if (selTileY === playerTile[1]-1 && check((playerIdx-(this.w*i))-1))    { return true; }
                  if (selTileY === playerTile[1]+1 && check((playerIdx+(this.w*i))-1))    { return true; }
                  if (selTileY === playerTile[1]   && check(playerIdx-1-i))               { return true; }
              }
              if (selTileY >= playerTile[1]+2) {
                  if (selTileX === playerTile[0]-1 && check((playerIdx-i)+this.w))        { return true; }
                  if (selTileX === playerTile[0]+1 && check((playerIdx+i)+this.w))        { return true; }
                  if (selTileX === playerTile[0]   && check(playerIdx+this.w+(this.w*i))) { return true; }
              } else if (selTileY <= playerTile[1]-2) {
                  if (selTileX === playerTile[0]-1 && check((playerIdx-i)-this.w))        { return true; }
                  if (selTileX === playerTile[0]+1 && check((playerIdx+i)-this.w))        { return true; }
                  if (selTileX === playerTile[0]   && check(playerIdx-this.w-(this.w*i))) { return true; }
              }
          }

      }
  }

  _draw(ctx, canvas, imgBG) {
      // Background image
      drawImgPlain(ctx, imgBG, 0, 0, canvas.width, canvas.height);

      let x = 0; let y = 0;
      this.map.forEach((tile, idx) => {
          drawBoxBorders(ctx, (x*this.ts)+this.marginLeft, (y*this.ts)+this.marginTop, this.ts, this.ts, this.tbc);
          if (x === this.w-1) { y++; x = 0;} else { x++; }
      });
  }



  _drawObjects(ctx, imgObst, imgPlayer, imgGUI, allies, enemies, time) {
      let x = 0; let y = 0; let type; let enemyCount = 0; let allyCount = 0; let objects = []; let playerDrawn = false;
      this.map.forEach((tile, idx) => {
          const mapTile = this._idxToCoords(idx);
          if      (tile.status >= 30 && tile.status < 50) { objects.push({type: 'obst', x: mapTile[0], y: mapTile[1], mIdx: idx }); }
          else if (tile.status >= 15 && tile.status < 30) { objects.push({type: 'enem', x: mapTile[0], y: mapTile[1], mIdx: idx, aIdx: enemyCount }); enemyCount++; }
          else if (tile.status >= 1  && tile.status < 15) { objects.push({type: 'ally', x: mapTile[0], y: mapTile[1], mIdx: idx, aIdx:  allyCount });  allyCount++; }
      });

      let drawObject = (object) => {
        if        (object.type === 'obst') {
            drawImg(ctx, imgObst, 16, 0, 16, 32, (object.x*this.ts)+this.marginLeft, (object.y*this.ts)+this.marginTop-this.ts, this.ts, this.ts*2);
        } else if (object.type === 'enem') {
            enemies[object.aIdx]._draw(this.ts, ctx, imgPlayer, imgGUI, time);
        } else if (object.type === 'ally') {
            allies[object.aIdx]._draw(this.ts, ctx, imgPlayer, imgGUI, time);
        }
      }

      // Sort first, then draw in a new loop?

      objects.some((object, idx) => { drawObject(object); });


  }





}
