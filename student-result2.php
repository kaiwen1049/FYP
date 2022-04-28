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

    #remark-btn {
        background: none;
        border: none;
        color: darkorange;
        font-weight: bold;
        font-size: 18px;
        margin-top: 13px;
        padding-right: 20px;
    }

    #title {
        padding-top: 35px;
        font-size: 35px;
        color: #fdba3b;
    }

    #description {
        font-size: 20px;
        color: orange;
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
$studentid = $_POST['studentid'];
$imagepath = $_POST['image'];
$qType = "sq";
$stmt = $conn->prepare("select * from results where user_id=?");
$stmt->bind_param('s', $studentid);
if ($stmt->execute()) {
    $result = $stmt->get_result();
}
include('includes/layouts/admin_navbar.php');
if ($result->num_rows > 0) {
    $stmt = $conn->prepare("select * from hotspots where imgPath=? AND qType=?");
    $stmt->bind_param('ss', $imagepath, $qType);
    if ($stmt->execute()) {
        $result = $stmt->get_result();
    }

?>
    <?php if ($result->num_rows > 0) { ?>

        <div class="gallery">
            <?php while ($row = $result->fetch_assoc()) { ?>
                </div><div id="container-table">
                    <ul class="responsive-table">
                        <li class="table-header">
                            <div class="col col-3">Question: <?php echo $row['title'] ?></div>
                            <div class="col col-4">
                            </div>
                        </li>
                    </ul>
                </div>
                <?php
                $studentid = $_POST['studentid'];
                $checked = "checked";
                $sql = "SELECT * FROM sq WHERE user_id= '" . $studentid . "' AND hotspotID= '" . $row['hotspotID'] . "' AND checking='" . $checked . "'";
                $answers = $conn->query($sql) or die($conn->error);
                if ($answers->num_rows > 0) {
                    while ($row2 = $answers->fetch_assoc()) {
                        $sql = "SELECT * FROM results WHERE user_id= '" . $studentid . "' AND hotspotID= '" . $row2['hotspotID'] . "'";
                        $temp = $conn->query($sql) or die($conn->error);
                        while ($row3 = $temp->fetch_assoc()) {
                ?>
                            <div id="container-table">
                                <ul class="responsive-table">
                                    <li class="table-header" id="answers">
                                        <div class="col col-1" id="custom-col-1"><?php echo $row2['user_id'] ?></div>
                                        <div class="col col-1"><?php echo $row3['result'] ?></div>
                                        <div class="col col-3"><?php echo $row2['answer'] ?></div>
                                        <div class="col col-4" id="custom-col-4">
                                        </div>
                                    </li>
                                </ul>
                            </div>
                    <?php }
                    }
                } else { ?>
                    <center>
                        <p id="title">No results found!</p>
                        <p id="description"></p><br>
                    </center>
                    <?php } ?>?>

        </div>
<?php }
        }
    } else { ?>
<center>
    <p id="title">No results found!</p>
    <p id="description"></p><br>
</center>
<?php  } ?>