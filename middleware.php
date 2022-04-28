<?php

  // if user is NOT logged in, redirect them to login page
  if (!isset($_SESSION['user'])) {
    header("location: login.php");
  }

  else if ($_SESSION['user'] == 3) {
    header("location: notfound.php");
  }

 ?>