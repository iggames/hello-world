var images = {};
function getImage( path ) {
   if ( images[ path ] == null ) {
      images[ path ] = new Image();
      images[ path ].src = path;
   }

   return images[ path ];
}

function imagesLoaded() {
   for ( var i in images ) {
      if ( i.src != null && !i.isLoaded ) {
         return false;
      }
   }
   return true;
}

function getImageData( image ) {
   var canvas = document.createElement( 'canvas' );
   canvas.width = image.width;
   canvas.height = image.height;
   var context = canvas.getContext( '2d' );
   context.drawImage( image, 0, 0, image.width, image.height );
   return context.getImageData( 0, 0, image.width, image.height );
}

function splitImageIntoTiles( tileSrc, tileSize ) {
   if ( tileSrc == null ) {
      console.log( "ERROR: Tried to split null image into tiles" );
      return null;
   }

   var dest = new Array();

   for ( var y = 0; y < tileSrc.height; y += tileSize ) {
      for ( var x = 0; x < tileSrc.width; x += tileSize ) {
         var tile = document.createElement( "canvas" );
         tile.width = tile.height = tileSize;
         var tileContext = tile.getContext( "2d" );

         tileContext.drawImage( tileSrc, x, y, tileSize, tileSize, 0, 0, tileSize, tileSize );

         dest.push( tile );
      }
   }

   return dest;
}

// NOTE: Assumes tiles are square
function getRotatedTiles( tiles, ang ) {
   var dest = new Array();

   for ( var i = 0; i < tiles.length; i ++ ) {
      var srcTile = tiles[ i ];

      var tile = document.createElement( "canvas" );
      tile.width = tile.height = srcTile.width;       // assumes tiles are square
      var tileContext = tile.getContext( "2d" );

      tileContext.translate( tile.width / 2, tile.height / 2 );
      tileContext.rotate( ang );
      tileContext.drawImage( srcTile, -tile.width / 2, -tile.height / 2 );

      dest.push( tile );
   }

   return dest;
}
