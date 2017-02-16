var levelWidth = 40
var levelHeight = 30;

var currentMapValue = mapValues.cave;
var mouseDown = false;

var level = new Level( levelWidth, levelHeight );

var gridColor = "rgba( 0, 64, 64, 0.4 )";
var showGrid = true;

function drawGrid( context, color, width, height ) {
   context.beginPath(); {
      context.strokeStyle = color;
      for ( var y = 0; y < height; y ++ ) {
         for ( var x = 0; x < width; x ++ ) {
            context.moveTo( 0.5 + x * GRID_SIZE, 0.5 );
            context.lineTo( 0.5 + x * GRID_SIZE, 0.5 + height * GRID_SIZE );
            context.moveTo( 0.5, 0.5 + y * GRID_SIZE );
            context.lineTo( 0.5 + width * GRID_SIZE, 0.5 + y * GRID_SIZE );
         }
      }
      context.stroke();
   }
   context.closePath();
}

function editMap( e ) {
   var col = Math.floor( e.offsetX / GRID_SIZE );
   var row = Math.floor( e.offsetY / GRID_SIZE );

   if ( currentMapValue === mapValues.empty ) {
      level.eraseTile( col, row );
   }
   else {
      level.map[ col ][ row ] = currentMapValue;
   }
   
   draw();
}

function draw() {
   context.drawImage( levelBG, 0, 0 );
   context.drawImage( level.getImage( level.getTileMap()), 0, 0 );

   if ( showGrid ) {
      drawGrid( context, gridColor, levelWidth, levelHeight );
   }
}

function preparePalette() {
   palette = document.getElementById( "palette" );

   // Add a blank tile to palette -- this will erase tiles
   tiles.empty[ 0 ].onclick = function( e ) {
      currentMapValue = mapValues.empty;
   }
   palette.appendChild( tiles.empty[ 0 ] );

   // Add a cave-floor icon to the palette -- this will add cave floor
   tiles.caveFloor[ 0 ].onclick = function( e ) {
      currentMapValue = mapValues.cave;
   }
   palette.appendChild( tiles.caveFloor[ 0 ] );

   // Add a Edit JSON button
   var button = document.createElement( 'input' );
   button.setAttribute( "type", "Button");
   button.setAttribute( "value", "Edit JSON");
   button.onclick = function() {
      alert("edit json");
   }
   palette.appendChild( button );
}

function prepareEditor() {
   editor = document.getElementById( "editor" );

   mapCanvas = document.createElement( "canvas" );
   mapCanvas.width = levelWidth * GRID_SIZE;
   mapCanvas.height = levelHeight * GRID_SIZE;
   context = mapCanvas.getContext( "2d" );

   mapCanvas.onmousedown = function( e ) {
      mouseDown = true;
      editMap( e );
   }
   mapCanvas.onmousemove = function( e ) {
      if ( mouseDown ) { 
         editMap( e );
      }
   }
   mapCanvas.onmouseup = function( e ) {
      mouseDown = false;
   }
   document.onkeyup = function( e ) {
      if ( e.keyCode == 71 /* g */ ) {
         showGrid = !showGrid;
         draw();
      }
   }

   editor.appendChild( mapCanvas );

   draw();
}


window.onload = function() {
   level.loadImages();

   var wait = setInterval( function() {
      if ( imagesLoaded() ) {
         level.prepareTiles();
         levelBG = level.getBackgroundImage();

         preparePalette();
         prepareEditor();

         clearInterval( wait );
      }
   }, 100 );
}
