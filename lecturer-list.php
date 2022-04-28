<link rel="stylesheet" type="text/css" href="lecturer-list.css">
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

    #close-btn{
        background: none;
        border: none;
        color: red;
        font-weight: bold;
        font-size: 18px;
        margin-top: 13px;
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
if (isset($_POST['deletebtn'])) {
    $delete=$_POST['delete'];
    $query = "DELETE from users WHERE id=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $delete);
    $stmt->execute();
}
// Get image data from database 
$result = $conn->query("SELECT * FROM users WHERE role_id=2 ORDER BY id DESC");
$id = $_SESSION['user']['id'];
?>

<?php if ($result->num_rows > 0) { ?>
    <?php include('includes/layouts/admin_navbar.php'); ?></div>
    <div class="gallery">
        <div id="container-table">
                <ul class="responsive-table">
                    <li class="table-header">
                        <div class="col col-1">Username</div>
                        <div class="col col-2"></div>
                        <div class="col col-3">Email</div>
                        <div class="col col-4">
                            Action
                        </div>
                    </li>
                </ul>
            </div>
        <?php while ($row = $result->fetch_assoc()) { ?>
            <div id="container-table">
                <ul class="responsive-table">
                    <li class="table-header">
                        <div class="col col-1"><?php echo $row['username'] ?></div>
                        <div class="col col-2"></div>
                        <div class="col col-3"><?php echo $row['email'] ?></div>
                        <div class="col col-4">
                            <form action="" method="post" enctype="multipart/form-data">
                                <input name="delete" type="hidden" value="<?php echo $row['id'] ?>">
                                <input type="submit" name="deletebtn" id="close-btn" value="Delete">
                            </form>
                        </div>
                    </li>
                </ul>
            </div>
        <?php } ?>
    </div>
<?php } ?>
