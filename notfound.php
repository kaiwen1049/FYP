<!DOCTYPE html>
<html>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
<?php include('dbConfig.php');
if (!isset($_SESSION['user'])) {
  header("location: login.php");
} ?>

<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FYP</title>
  <style>
    body,
    html {
      height: 100%;
      max-width: max-content;
      margin: auto;
      align-content: center;
      background-color: #282828;

    }

    .button {
      display: inline-block;
      border-radius: 10px;
      background-color: #fdba3b;
      border: solid 1px black;
      color: #FFFFFF;
      text-align: center;
      font-size: 25px;
      font-family: Arial Black;
      padding: 20px;
      height: calc(100% - 100px);
      width: 400px;
      transition: all 0.5s;
      cursor: pointer;
      margin: 5px;
      margin-left: 50px;
      margin-top: 15px;
      box-shadow: 0 16px 16px 0 rgba(0, 0, 0, 0.24), 0 17px 50px 0 rgba(0, 0, 0, 0.19);
    }

    .button span {
      cursor: pointer;
      display: inline-block;
      position: relative;
      transition: 0.5s;
    }

    .button span:after {
      content: '\00bb';
      position: absolute;
      opacity: 0;
      top: 0;
      right: -20px;
      transition: 0.5s;

    }

    .button:hover span {
      padding-right: 25px;
    }

    .button:hover span:after {
      opacity: 1;
      right: 0;
    }

    .button-container {
      float: left;
      padding-top: 20px;
      vertical-align: middle;
    }

    .small-text {
      font-size: 15px;
    }

    .container {
      padding-right: 15px;
      padding-left: 15px;
      margin-right: auto;
      margin-left: auto;
    }
    #title{
      padding-top: 35px;
      font-size: 35px;
      color: #fdba3b;
    }
    #description{
      font-size: 20px;
      color: orange;
    }
  </style>
</head>
<body>
  <?php include('includes/layouts/admin_navbar.php'); ?></div>
  <div class="container">
    <br>
    <center>
        <p id="title">Page was Not Found!</p>
        <p id="description"> Are you sure you have the permission to enter this page?</p><br>
        <button onclick="location.href='homepage.php'" class="button" style="vertical-align:middle"><span>Return To HomePage</span>
      </button>
    </center>
  </div>
</body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<!-- Bootstrap JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>

</html>