var GRID_SIZE = 32;

var mapValues = {
   wall: 0,
   cave: 1,
   metal: 2
};

// Tile sources (someday, these may be specified in the level format itself -- for now, use these values and just pass the map around)
// Some image sources, for reference:
// http://us.cdn3.123rf.com/168nwm/thesupe87/thesupe870808/thesupe87080800152/3451101-diamond-plate-metal-texture--a-very-nice-background-for-an-industrial-or-contruction-type-look-fully.jpg
// http://www.html5canvastutorials.com/cookbook/ch9/1369_09_07/metalFloor.jpg
// http://www.html5canvastutorials.com/cookbook/ch9/1369_09_07/crate.jpg
// http://www.minecrafttexturepacks.com/the-end-is-extremely-nigh/
// http://www.html5canvastutorials.com/cookbook/ch9/1369_09_07/metalWall.jpg
var tileSources = {};
var tiles = {};

function Level( width, height ) {
   this.width = width;
   this.height = height;

   this.map = new Array( this.width );
   for ( var x = 0; x < this.width; x ++ ) {
      this.map[ x ] = new Array( this.height );
      for ( var y = 0; y < this.height; y ++ ) {
         this.map[ x ][ y ] = mapValues.wall;
      }
   }

   // Special spots
   this.shooterSpawns = new Array();
   this.wormSpawns = new Array();
}

Level.prototype.loadFromJSON = function( json ) {
   var obj = JSON.parse( json );

    for ( var i in obj ) {
        if ( !obj.hasOwnProperty( i ) ) continue;
        this[ i ] = obj[ i ];
    }
}

Level.prototype.loadImages = function() {
   tileSources.empty = getImage( "images/empty.png" );
   tileSources.caveFloor = getImage( "images/cave-floor.png" );
   tileSources.caveInnerCorner = getImage( "images/cave-inner-corner.png" );
   tileSources.caveOuterCorner = getImage( "images/cave-outer-corner.png" );
   tileSources.caveWall = getImage( "images/cave-wall.png" );
}

Level.prototype.prepareTiles = function() {
   tiles.empty = splitImageIntoTiles( tileSources.empty, GRID_SIZE );
   tiles.caveFloor = splitImageIntoTiles( tileSources.caveFloor, GRID_SIZE );

   tiles.inner_NW = splitImageIntoTiles( tileSources.caveInnerCorner, GRID_SIZE );
   tiles.inner_NE = getRotatedTiles( tiles.inner_NW, Math.PI * ( 1 / 2) );
   tiles.inner_SE = getRotatedTiles( tiles.inner_NW, Math.PI * ( 2 / 2) );
   tiles.inner_SW = getRotatedTiles( tiles.inner_NW, Math.PI * ( 3 / 2) );

   tiles.outer_SE = splitImageIntoTiles( tileSources.caveOuterCorner, GRID_SIZE );
   tiles.outer_SW = getRotatedTiles( tiles.outer_SE, Math.PI * ( 1 / 2) );
   tiles.outer_NW = getRotatedTiles( tiles.outer_SE, Math.PI * ( 2 / 2) );
   tiles.outer_NE = getRotatedTiles( tiles.outer_SE, Math.PI * ( 3 / 2) );

   tiles.north = splitImageIntoTiles( tileSources.caveWall, GRID_SIZE );
   tiles.east  = getRotatedTiles( tiles.north, Math.PI * ( 1 / 2) );
   tiles.south = getRotatedTiles( tiles.north, Math.PI * ( 2 / 2) );
   tiles.west  = getRotatedTiles( tiles.north, Math.PI * ( 3 / 2) );
}

Level.prototype.setMap = function( map ) {
   this.map = map;
   this.width = map.length;
   this.height = map[0].length;
}

function varietyOfTile( tile ) {
   return tile[ Math.floor( Math.random() * tile.length ) ];
   //return tile[ 0 ];       // for now, so I don't get a seizure
}

Level.prototype.getTileMap = function() {
   var tileMap = new Array( this.width );
   for ( var x = 0; x < this.width; x ++ ) {
      tileMap[ x ] = new Array( this.height );
      for ( var y = 0; y < this.height; y ++ ) {
         tileMap[ x ][ y ] = null;     // null tiles will end up showing cave floor background
      }
   }

   do {
      needsRecalc = false;
      for ( var y = 0; y < this.height; y ++ ) {
         for ( var x = 0; x < this.width; x ++ ) {
            if ( this.map[ x ][ y ] == mapValues.cave ) {

               var hasN = 0 < y && this.map[ x ][ y - 1 ] !== mapValues.wall;
               var hasE = x < this.width - 1 && this.map[ x + 1 ][ y ] !== mapValues.wall;
               var hasS = y < this.height - 1 && this.map[ x ][ y + 1 ] !== mapValues.wall;
               var hasW =  0 < x && this.map[ x - 1 ][ y ] !== mapValues.wall;

               var hasNW = 0 < x && 0 < y && this.map[ x - 1 ][ y - 1 ] !== mapValues.wall;
               var hasNE = x < this.width - 1 && 0 < y && this.map[ x + 1 ][ y - 1 ] !== mapValues.wall;
               var hasSW = 0 < x && y < this.height - 1 && this.map[ x - 1 ][ y + 1 ] !== mapValues.wall;
               var hasSE = x < this.width - 1 && y < this.height - 1 && this.map[ x + 1 ][ y + 1 ] !== mapValues.wall;

               var corners = hasNW + hasNE + hasSW + hasSE;
               var edges = hasN + hasE + hasS + hasW;
               var diagonals = ( hasNW && hasSE ) + ( hasNE && hasSW );

               // Skip tiles that don't touch anything
               if ( corners + edges == 0 ) {
                  continue;
               }

               // List of cases we don't support (these should be changed to cave floor and schedule a recalc)
               if ( ( hasN && hasS ) || ( hasE && hasW ) ||
                    ( diagonals > 0 && corners != 3 ) ||
                    ( hasN && hasW && hasSE ) ||
                    ( hasN && hasE && hasSW ) ||
                    ( hasS && hasW && hasNE ) ||
                    ( hasS && hasE && hasNW ) ) {
                  this.map[ x ][ y ] = mapValues.cave;
                  tileMap[ x ][ y ] = null;
                  needsRecalc = true;
                  continue;
               }

               // walls
               if      ( hasS ) { tileMap[ x ][ y ] = varietyOfTile( tiles.north ); }
               else if ( hasW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.east );  }
               else if ( hasN ) { tileMap[ x ][ y ] = varietyOfTile( tiles.south ); }
               else if ( hasE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.west );  }

               // outer corners
               else if ( hasNW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.outer_NW ); }
               else if ( hasNE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.outer_NE ); }
               else if ( hasSW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.outer_SW ); }
               else if ( hasSE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.outer_SE ); }

               // inner corners (these are kind of weird, and largely based on trial and error)
               if      ( hasN && hasW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_NW ); }
               else if ( hasN && hasE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_NE ); }
               else if ( hasS && hasW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_SW ); }
               else if ( hasS && hasE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_SE ); }

               else if ( hasS && hasNW || hasW && hasSE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_SW ); }
               else if ( hasN && hasSE || hasE && hasNW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_NE ); }
               else if ( hasE && hasSW || hasS && hasNE ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_SE ); }
               else if ( hasW && hasNE || hasN && hasSW ) { tileMap[ x ][ y ] = varietyOfTile( tiles.inner_NW ); }
            }
            else {
               tileMap[ x ][ y ] = tiles.empty[0];
            }
         }
      }
   }
   while ( needsRecalc );

   return tileMap;
}

Level.prototype.eraseTile = function( col, row ) {
   this.map[ col ][ row ] = mapValues.wall;

   // A blank tile cannot exist in isolation, so we need to clear the surrounding tiles as well (these will become edge)
   if ( 0 < col && 0 < row )                             { this.map[ col - 1 ][ row - 1 ] = mapValues.wall; }
   if ( 0 < col )                                        { this.map[ col - 1 ][ row     ] = mapValues.wall; }
   if ( 0 < col && row < levelHeight - 1 )               { this.map[ col - 1 ][ row + 1 ] = mapValues.wall; }
   if ( 0 < row )                                        { this.map[ col     ][ row - 1 ] = mapValues.wall; }
   if ( row < levelHeight - 1 )                          { this.map[ col     ][ row + 1 ] = mapValues.wall; }
   if ( col < levelWidth - 1 && 0 < row )                { this.map[ col + 1 ][ row - 1 ] = mapValues.wall; }
   if ( col < levelWidth - 1 )                           { this.map[ col + 1 ][ row     ] = mapValues.wall; }
   if ( col < levelWidth - 1 && row < levelHeight - 1 )  { this.map[ col + 1 ][ row + 1 ] = mapValues.wall; }
}

Level.prototype.prepareNodes = function( ) {
   this.nodes = new Array( this.width );
   for ( var x = 0; x < this.width; x ++ ) {
      this.nodes[ x ] = new Array( this.height );
      for ( var y = 0; y < this.height; y ++ ) {
         if ( !this.isSolidAt( x, y ) ) {
            var node = new Node( x * GRID_SIZE + GRID_SIZE/2, 
                  y * GRID_SIZE + GRID_SIZE/2 );
            this.nodes[ x ][ y ] = node;

            if ( x > 0 && this.nodes[ x-1 ][ y ] )
               linkNodes( this.nodes[ x-1 ][ y ], node );
            if ( y > 0 && this.nodes[ x ][ y-1 ] )
               linkNodes( this.nodes[ x ][ y-1 ], node );

            // Diagonals - for now, only if tiles above/below are clear
            if ( x > 0 ) {
               if ( y > 0 && !this.isSolidAt( x-1, y-1 ) &&
                     !this.isSolidAt( x, y-1 ) && !this.isSolidAt( x-1, y ) )
                  linkNodes( this.nodes[ x-1 ][ y-1 ], node );
               if ( y < this.height-1 && !this.isSolidAt( x-1, y+1 ) &&
                     !this.isSolidAt( x, y+1 ) && !this.isSolidAt( x-1, y ) )
                  linkNodes( this.nodes[ x-1 ][ y+1 ], node );
            }
         }
      }
   }
}

Level.prototype.getImage = function( tileMap ) {
   var image = document.createElement( 'canvas' );
   image.width = this.width * GRID_SIZE;
   image.height = this.height * GRID_SIZE;
   
   var context = image.getContext( '2d' );
   for ( var x = 0; x < this.width; x ++ ) {
      for ( var y = 0; y < this.height; y ++ ) {
         context.save(); {
            context.translate( x * GRID_SIZE, y * GRID_SIZE );

            switch ( this.map[ x ][ y ] ) {
               case mapValues.wall:
                  context.fillStyle = "#000000";
                  context.fillRect( 0, 0, GRID_SIZE, GRID_SIZE );
                  break;

               case mapValues.cave:
                  var hasN = 0 < y && this.map[ x ][ y - 1 ] !== mapValues.wall;
                  var hasE = x < this.width - 1 && this.map[ x + 1 ][ y ] !== mapValues.wall;
                  var hasS = y < this.height - 1 && this.map[ x ][ y + 1 ] !== mapValues.wall;
                  var hasW =  0 < x && this.map[ x - 1 ][ y ] !== mapValues.wall;

                  var hasNW = 0 < x && 0 < y && this.map[ x - 1 ][ y - 1 ] !== mapValues.wall;
                  var hasNE = x < this.width - 1 && 0 < y && this.map[ x + 1 ][ y - 1 ] !== mapValues.wall;
                  var hasSW = 0 < x && y < this.height - 1 && this.map[ x - 1 ][ y + 1 ] !== mapValues.wall;
                  var hasSE = x < this.width - 1 && y < this.height - 1 && this.map[ x + 1 ][ y + 1 ] !== mapValues.wall;

                  var cornerSize = 2;
                  var near = cornerSize + 0.5;
                  var far = GRID_SIZE - 1 - cornerSize + 0.5;

                  context.beginPath(); {
                     // Simple walls
                     if ( !hasN ) {
                        context.moveTo( near, near );
                        context.lineTo(  far, near );
                     }
                     if ( !hasS ) {
                        context.moveTo( near,  far );
                        context.lineTo(  far,  far );
                     }
                     if ( !hasE ) {
                        context.moveTo(  far, near );
                        context.lineTo(  far,  far );
                     }
                     if ( !hasW ) {
                        context.moveTo( near, near );
                        context.lineTo( near,  far );
                     }
                     // Inner corners
                     if ( !hasNW && hasN && hasW ) {
                        context.moveTo( near, far - GRID_SIZE );
                        context.lineTo( far - GRID_SIZE, near );
                     }
                     if ( !hasNE && hasN && hasE ) {
                        context.moveTo( far, far - GRID_SIZE );
                        context.lineTo( GRID_SIZE + near, near );
                     }
                     if ( !hasSW && hasS && hasW ) {
                        context.moveTo( far - GRID_SIZE, far );
                        context.lineTo( near, GRID_SIZE + near );
                     }
                     if ( !hasSE && hasS && hasE ) {
                        context.moveTo( GRID_SIZE + near, far );
                        context.lineTo( far, GRID_SIZE + near );
                     }
                     context.strokeStyle = "#fff";
                     context.stroke();
                  }
                  context.closePath();

                  break;

               case mapValues.metal:
                  break;
            }
         }
         context.restore();
      }
   }

   return image;
}

Level.prototype.getBackgroundImage = function() {
   var image = document.createElement( 'canvas' );
   image.width = this.width * GRID_SIZE;
   image.height = this.height * GRID_SIZE;
   
   var context = image.getContext( '2d' );
   for ( var x = 0; x < this.width; x ++ ) {
      for ( var y = 0; y < this.height; y ++ ) {
         context.drawImage( varietyOfTile( tiles.caveFloor ), x * GRID_SIZE, y * GRID_SIZE );
      }
   }

   return image;
}

Level.prototype.isSolidAt = function( col, row ) {
   return this.map[ col ][ row ] == mapValues.wall;
}

// Check whether a line collides with the level
// Try a circle/line test against every grid space in the rectangle with line
// as a diagonal
// Test against a circle with a quarter of the grid size to allow actors to partially
// enter "solid" squares (since the tiles along the edge of cave are not strictly solid)
Level.prototype.lineHitsLevel = function( line, radius ) {
   var gridX1 = this.gridX( line.x1 );
   var gridY1 = this.gridY( line.y1 );
   var gridX2 = this.gridX( line.x2 );
   var gridY2 = this.gridY( line.y2 );

   var leftGrid   = Math.min( gridX1, gridX2 );
   var topGrid    = Math.min( gridY1, gridY2 );
   var rightGrid  = Math.max( gridX1, gridX2 );
   var bottomGrid = Math.max( gridY1, gridY2 );

   for ( var tileY = topGrid; tileY <= bottomGrid; tileY ++ ) {
      for ( var tileX = leftGrid; tileX <= rightGrid; tileX ++ ) {
         if ( this.isSolidAt( tileX, tileY ) ) {
            var circle = new Circle( this.fromGrid( tileX ), this.fromGrid( tileY ), GRID_SIZE / 4 );
            var hit = new CircleLineCollision( circle, line );

            if ( hit.distFromHit <= radius + GRID_SIZE / 4 ) {
               return true;
            }
         }
      }
   }

   return false;
}

Level.prototype.drawNodes = function( context ) {
   context.strokeStyle = "#044";

   for ( var x = 0; x < this.width; x ++ ) {
      for ( var y = 0; y < this.height; y ++ ) {
         var node = this.nodes[ x ][ y ];
         if ( node ) {
            // Circular node representation
            context.fillRect( node.x - 8, node.y - 8, 16, 16 );

            // Lines for links
            context.beginPath(); {
               for ( var other in node.links ) {
                  context.moveTo( 0.5 + node.x, 0.5 + node.y );
                  context.lineTo( 0.5 + node.links[ other ].x, 0.5 + node.links[ other ].y );
               }
               context.stroke();
            }
            context.closePath();
         }
      }
   }
}

Level.prototype.gridX = function( x ) {
   return Math.max( 0, Math.min( this.width - 1, Math.floor( x / GRID_SIZE ) ) );
}

Level.prototype.gridY = function( y ) {
   return Math.max( 0, Math.min( this.height - 1, Math.floor( y / GRID_SIZE ) ) );
}

Level.prototype.nodeFor = function( x, y ) {
   return this.nodes[ this.gridX( x ) ][ this.gridY( y ) ];
}

Level.prototype.fromGrid = function( i ) {
   return i * GRID_SIZE + GRID_SIZE / 2;
}
