<?php
require_once 'dbConfig.php';

$response = 0;

if (isset($_FILES['file'])) {
	$response = 1;
	$filename = $_FILES['file']['name'];
	$id = $_SESSION['user']['id'];

	// Location
	$location = 'upload/' . $filename;

	// file extension
	$file_extension = pathinfo($location, PATHINFO_EXTENSION);
	$file_extension = strtolower($file_extension);
	$name = $_FILES['file']['name'];
	$target_dir = "upload/";
	$target_file = $target_dir . basename($_FILES["file"]["name"]);
	// Valid image extensions
	$image_ext = array("jpg", "png", "jpeg", "gif");

	if (in_array($file_extension, $image_ext)) {

		$sql = "INSERT INTO images (name, image, uploaded_by) VALUES ('$name','$target_file', '$id')";
		mysqli_query($conn, $sql);

		if (move_uploaded_file($_FILES['file']['tmp_name'], $target_dir . $name)) {
			$response = $location;
		}
	}
}
else
	$response = 1;
echo $response;
