<?php
require_once 'dbConfig.php'; 
$msg="1";

error_reporting(0);

if(isset($_POST['but_upload'])){
  $id = $_SESSION['user']['id'];
  $name = $_FILES['file']['name'];
  $target_dir = "upload/";
  $target_file = $target_dir . basename($_FILES["file"]["name"]);

  // Select file type
  $imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

  // Valid file extensions
  $extensions_arr = array("jpg","jpeg","png");

  // Check extension
  if( in_array($imageFileType,$extensions_arr) ){
     // Upload file

     $sql = "INSERT INTO images (name, image, uploaded_by) VALUES ('$name','$target_file','$id')";
     mysqli_query($conn, $sql);

     if(move_uploaded_file($_FILES['file']['tmp_name'],$target_dir.$name)){
      $msg = "Image uploaded successfully";
     }else{
     $msg = "Failed to upload image";
     }
  }
}

?>

<div><?php echo $msg ?></div>
<form method="post" action="" enctype='multipart/form-data'>
  <input type='file' name='file' />
  <input type='submit' value='Upload Photo' name='but_upload'>
</form>