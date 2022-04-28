<link rel="stylesheet" type="text/css" href="select-result.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<!-- Bootstrap JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
<style>
    #submit-btn {
        height: 40px;
        width: 240px;
        background-color: #fdba3b;
        border-radius: 5px;
        border: solid 1px black;
        font-weight: bold;
    }
    #title {
        color: white;
        font-size: 40px;
        font-weight: bold;
        margin-top: 30px;
        margin-bottom: 20px;
    }
</style>
<head>
    <meta charset="utf-8">
    <title>FYP</title>
  </head>
<?php
// Include the database configuration file  
require_once 'dbConfig.php';
if (!isset($_SESSION['user'])) {
    header("location: login.php");
  }

$sql = "SELECT * FROM users WHERE role_id=3";
$students = $conn->query($sql) or die($conn->error);
$count = 0;
$id = $_SESSION['user']['id'];
?>
<?php if ($students->num_rows > 0) { ?>
    <?php include('includes/layouts/admin_navbar.php'); ?></div>
    <div class="gallery"><center><div id="title"><label>List of All Students with Results</label></div></center>
        <?php while ($row = $students->fetch_assoc()) {
            $result = $conn->query("SELECT * FROM results WHERE user_id='". $row['id']."'");
            if ($result->num_rows > 0) { ?>
            <div id="container-table"><center>
                <form action="select-result2.php" method="post" enctype="multipart/form-data">
                    <input name="studentid" type="hidden" value="<?php echo $row['id'] ?>">
                    <input type="submit" name="submit" id="submit-btn" value="<?php echo $row['username'] ?>">
                </form></center>
            </div>
            <?php } ?>
        <?php } ?>
    </div>
<?php } ?>