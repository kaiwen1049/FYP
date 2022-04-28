
<!DOCTYPE html>
<html lang="en">
<?php include('dbConfig.php'); 
if (!isset($_SESSION['user'])) {
  header("location: login.php");
}?>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
  <head>
    <meta charset="UTF-8" />
    <title>FYP</title>
    <link
      type="text/css"
      href="https://uicdn.toast.com/tui-color-picker/v2.2.6/tui-color-picker.css"
      rel="stylesheet"
    />
    <link type="text/css" href="tui-image-editor.css" rel="stylesheet" />
    <style>
      @import url(http://fonts.googleapis.com/css?family=Noto+Sans);
      html,
      body {
        height: 100%;
        margin: 0;
      }
    </style>
  </head>
  <body>
  <?php include('includes/layouts/admin_navbar.php'); ?></div>
    <div id="tui-image-editor-container"></div>
    <script
      type="text/javascript"
      src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.4.0/fabric.js"
    ></script>
    <script
      type="text/javascript"
      src="https://uicdn.toast.com/tui.code-snippet/v1.5.0/tui-code-snippet.min.js"
    ></script>
    <script
      type="text/javascript"
      src="https://uicdn.toast.com/tui-color-picker/v2.2.6/tui-color-picker.js"
    ></script>
    <script
      type="text/javascript"
      src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js"
    ></script>
    <script type="text/javascript" src="tui-image-editor.js"></script>
    <script type="text/javascript" src="js/theme/white-theme.js"></script>
    <script type="text/javascript" src="js/theme/black-theme.js"></script>
    <script>
      // Image editor
      var imageEditor = new tui.ImageEditor('#tui-image-editor-container', {
        includeUI: {
          loadImage: {
            path: 'pano_1.jpg',
            name: 'SampleImage',
          },
          theme: blackTheme, // or whiteTheme
          initMenu: 'filter',
          menuBarPosition: 'bottom',
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false,
      });
      window.onresize = function () {
        imageEditor.ui.resizeEditor();
      };
    </script>
  </body>
</html>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <!-- Bootstrap JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>