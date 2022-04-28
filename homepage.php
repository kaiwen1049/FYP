<?php include('dbConfig.php');
if (!isset($_SESSION['user'])) {
    header("location: login.php");
  }
$role_id = $_SESSION['user']['role_id'];
if($role_id==2)
    header("location: lecturer-view.php");
else if($role_id==3)
    header("location: student-view.php");
else if($role_id==4)
    header("location: lecturer_view.php");