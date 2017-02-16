<!DOCTYPE HTML>
<html>
   <head>
	   <title>Tower Def: Editor</title>
      <style type="text/css">
         * { margin: 0px; padding: 0px; overflow: auto }
         div { position: absolute }
         div#palette { top: 0px; left: 0px; right: 0px; height: 32px; }
         div#editor  { top: 32px; left: 0px; right: 0px; bottom: 0px; }
      </style>
      <script>
         /*var tilePaths = [
            <?php
            if ($handle = opendir('./tiles/')) {
               while (false !== ($file = readdir($handle))) {
                  if ($file[0] != ".") {
                     echo "\"./tiles/$file\", ";
                  }
               }
               closedir($handle);
            }
            ?>
         ];*/
      </script>
	</head>
   <body bgcolor="black" text="white">
		<script type="text/javascript" src="js/resources.js"></script>
      <script type="text/javascript" src="js/level.js"></script>
      <script type="text/javascript" src="js/editor.js"></script>
      <div id="palette"></div>
      <div id="editor"></div>
	</body>
</html>
