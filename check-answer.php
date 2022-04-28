<link rel="stylesheet" type="text/css" href="answer.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<!-- Bootstrap JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
<style>
    #btndone {
        color: black;
        font-weight: bold;
        background-color: #fdba3b;
        border: solid 1px black;
        display: inline-block;
        padding: 6px 12px;
        margin-bottom: 0;
        font-size: 14px;
        line-height: 1.42857143;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        -ms-touch-action: manipulation;
        touch-action: manipulation;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        background-image: none;
        border-radius: 4px;
        align-items: flex-start
    }

    #wrong-btn{
        background: none;
        border: none;
        color: red;
        font-weight: bold;
        font-size: 18px;
        margin-top: 13px;
    }
    #correct-btn{
        background: none;
        border: none;
        color: green;
        font-weight: bold;
        font-size: 18px;
        margin-top: 13px;
        padding-right: 20px;
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
  else if ($_SESSION['user']['role_id'] == 3){
    header("location: notfound.php");
  }
if (isset($_POST['correctbtn'])) {
    $studentid = $_POST['studentid'];
    $hotspotid = $_POST['hotspotid'];
    $id = $_POST['id'];
    $correct = "Correct";
    $checked = "checked";
    $query = "INSERT INTO results SET user_id=?, hotspotID=?, result=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iis', $studentid, $hotspotid, $correct);
    $stmt->execute();

    $query = "UPDATE sq SET checking=? WHERE id=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('si', $checked, $id);
    $stmt->execute();
}

if (isset($_POST['wrongbtn'])) {
    $studentid = $_POST['studentid'];
    $hotspotid = $_POST['hotspotid'];
    $id = $_POST['id'];
    $correct = "Wrong";
    $checked = "checked";
    $query = "INSERT INTO results SET user_id=?, hotspotID=?, result=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iis', $studentid, $hotspotid, $correct);
    $stmt->execute();

    $query = "UPDATE sq SET checking=? WHERE id=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('si', $checked, $id);
    $stmt->execute();
}
$imagepath = $_POST['image'];
$stmt = $conn->prepare("select * from hotspots where imgPath=?");
$stmt->bind_param('s', $imagepath);
if ($stmt->execute()) {
  $result = $stmt->get_result();
}

$id = $_SESSION['user']['id'];
?>
<?php include('includes/layouts/admin_navbar.php'); ?></div>
<?php if ($result->num_rows > 0) { ?>


    <div class="gallery">
        <?php while ($row = $result->fetch_assoc()) { ?>
            
            <?php if ($row['qType']=="sq") { ?>
            <div id="container-table">
                <ul class="responsive-table">
                    <li class="table-header">
                        <div class="col col-3">Question: <?php echo $row['title']?></div>
                        <div class="col col-4">
                        </div>
                    </li>
                </ul>
            </div>
            <?php 
            $uncheck = "uncheck";
                $sql = "SELECT * FROM sq WHERE hotspotID= '" . $row['hotspotID'] . "' AND checking='" . $uncheck. "'";
                $answers = $conn->query($sql) or die($conn->error);
            while ($row2 = $answers->fetch_assoc()) { ?>
            <div id="container-table">
                <ul class="responsive-table">
                    <li class="table-header" id="answers">
                        <div class="col col-1" id="custom-col-1"><?php echo $row2['user_id'] ?></div>
                        <div class="col col-3"><?php echo $row2['answer'] ?></div>
                        <div class="col col-4"id="custom-col-4">
                            <form action="" method="post" enctype="multipart/form-data">
                                <input type="hidden" name="id" value="<?php echo $row2['id']?>">
                                <input type="hidden" name="studentid" value="<?php echo $row2['user_id']?>">
                                <input type="hidden" name="image" value="<?php echo $imagepath?>">
                                <input type="hidden" name="hotspotid" value="<?php echo $row['hotspotID']?>">
                                <input type="submit" name="correctbtn" id="correct-btn" value="Correct">
                                <input type="submit" name="wrongbtn" id="wrong-btn" value="Wrong">
                            </form>
                        </div>
                    </li>
                </ul>
            </div>
            <?php }?>
            
        <?php } ?>
    </div>
<?php }} ?>
