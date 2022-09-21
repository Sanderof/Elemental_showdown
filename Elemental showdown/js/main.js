
let controllIdx = 0; // Move in to the wrapperfunction later

// Wrapping the whole code in a function to avoid players accessing global variables and functions
(function wrapperfunction() {

//------------------------------------------------------------- Global variables

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
let images;

// Constantly updated time in milliseconds
let time;

// Contains the IDs of the character in the order they will do an action
let actionQueue = [];

// The idx of the ally that can be controlled by the player


//---------------------------------------------------------------------- Objects

// The tile that the cursor hovers over
const hoverTile = [null, null];

// new MapInstance(width, height, tileSize, tileBorderColor, possibleTileColor, theme)
let map = new MapInstance(9, 5, 64, '#ddd', '#02d', 'plains');

// Ally array; One of them can be controlled by the player
let allies = [
    new Grass([0, 3], 1),
    new Fire([0, 1], 2)
];

// Enemy array
let enemies = [
    new Warrior([8, 1], 16),
    new Tank([8,3], 17)
];

//---------------------------------------------------------------- loading files

loadImages(['GUIsheet.png', 'playerSheet.png', 'backgroundImages.jpg', 'obstacleSheet.png', 'battleGUISheet.png']).then(loads => {
    images = loads;
    WebFont.load({
      google: { families: ['VT323'] },
      active: function() { setValues(); } // Calls the main function when loaded
    });
});

//--------------------------------------------------------------- eventListeners

document.addEventListener('click', clickEvents);
document.addEventListener('mousemove', moveEvents);

function clickEvents(evt) {
    let mouseX = (evt.clientX-canvas.getBoundingClientRect().left)*(canvas.width/canvas.getBoundingClientRect().width);
    let mouseY = (evt.clientY-canvas.getBoundingClientRect().top) *(canvas.height/canvas.getBoundingClientRect().height);

    let selectedTile = [];
    selectedTile[0] = Math.floor((mouseX-map.marginLeft)/map.ts);
    selectedTile[1] = Math.floor((mouseY-map.marginTop )/map.ts);

    // Movement
    if (selectedTile[0] < map.w && selectedTile[0] >= 0 && selectedTile[1] < map.h && selectedTile[1] >= 0) {
        if (!allies[controllIdx].inQueue && allies[controllIdx].actionStart === null && time-allies[controllIdx].chargeClock >= allies[controllIdx].chargeTime) {
            if (allies[controllIdx]._attackPossibility(map, selectedTile, allies[controllIdx].tileFrom)) {
                allies[controllIdx]._setAttackData(map, selectedTile, actionQueue);
            } else if (allies[controllIdx]._movePossibility(map, selectedTile, allies[controllIdx].tileFrom)) {
                allies[controllIdx]._setMoveData(map, selectedTile, actionQueue);
            }
        }

    }
}

function moveEvents(evt) {
    let mouseX = (evt.clientX-canvas.getBoundingClientRect().left)*(canvas.width/canvas.getBoundingClientRect().width);
    let mouseY = (evt.clientY-canvas.getBoundingClientRect().top) *(canvas.height/canvas.getBoundingClientRect().height);

    let selectedTile = [];
    selectedTile[0] = Math.floor((mouseX-map.marginLeft)/map.ts);
    selectedTile[1] = Math.floor((mouseY-map.marginTop )/map.ts);

    if (selectedTile[0] < map.w && selectedTile[0] >= 0 && selectedTile[1] < map.h && selectedTile[1] >= 0) {
        hoverTile[0] = selectedTile[0]; hoverTile[1] = selectedTile[1];
    } else { hoverTile[0] = null; hoverTile[1] = null; }

}

//-------------------------------------------------------------------- functions

// Runs once to set necessary values | Preparation before the game starts
function setValues() {

    // Set start positions
    allies.forEach(ally   => {  ally._setPosition(map);  ally._setStartValues(); });
    enemies.forEach(enemy => { enemy._setPosition(map); enemy._setStartValues(); });

    looperWrapper();
}

// The function is looping during the game
function looperWrapper() {
    time = Date.now(); // Constantly updated time in milliseconds
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (enemies.length > 0) { enemies.forEach(enemy      => { if (!enemy.defeated) { enemy._makeMove(time, map, actionQueue); enemy._processMovement(map, time, actionQueue); enemy._processAttack(map, time, actionQueue,  allies); } }); }
    if (allies.length  > 0) { allies.forEach((ally, idx) => { if (!ally.defeated)  { if (idx !== controllIdx) { ally._makeMove(time, map, actionQueue); } ally._processMovement(map, time, actionQueue); ally._processAttack(map, time, actionQueue, enemies); } }); }

    map._draw(ctx, canvas, images[2], images[3]);
    if (allies.length > 0 && allies[controllIdx].actionStart === null) { allies[controllIdx]._colorMoveTiles(ctx, map, time); }
    if (hoverTile[0] !== null) { drawBoxBorders(ctx, map.marginLeft+(hoverTile[0]*map.ts), map.marginTop+(hoverTile[1]*map.ts), map.ts, map.ts, 'rgb(20, 120, 250)'); }

    map._drawObjects(ctx, images[3], images[1], images[4], allies, enemies, time);

    requestAnimationFrame(looperWrapper);
}

//-------------------------------------------------------------
//-------------------------------------------------------------
//-------------------------------------------------------------

}()); // Self invoking the function
