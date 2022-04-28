<link rel="stylesheet" type="text/css" href="table.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<!-- Bootstrap JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
<style>
    #submit-btn {
        height: 40px;
        width: 120px;
        margin-right: 15px;
        background-color: #fdba3b;
        border-radius: 5px;
        box-shadow: 0 16px 16px 0 rgba(0, 0, 0, 0.24), 0 17px 50px 0 rgba(0, 0, 0, 0.19);
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

$result = $conn->query("SELECT * FROM images ORDER BY id DESC");
$count = 0;
$studentid = $_POST['studentid'];

?>
<?php if ($result->num_rows > 0) { ?>
    <?php include('includes/layouts/admin_navbar.php'); ?></div>
    <div class="gallery">
        <?php while ($row = $result->fetch_assoc()) {
            $sql = "SELECT * FROM hotspots WHERE imgPath= '" . $row['image'] . "'";
            $hotspot = $conn->query($sql) or die($conn->error);
            $count = 0;
            while ($row2 = $hotspot->fetch_assoc()) {
                $count += 1;
            } if($count>0){?>
            <div id="container-table">
                <ul class="responsive-table">
                    <li class="table-header">
                        <div class="col col-1"><?php echo $row['id'] ?></div>
                        <div class="col col-2"><img style="max-width: 250px; max-height: 125px;" src="<?php echo ($row['image']); ?>" /></div>
                        <div class="col col-3"></div>
                        <div class="col col-4">
                            <form action="check-result.php" method="post" enctype="multipart/form-data">
                                <input name="count" type="hidden" value="<?php echo $count ?>">
                                <input name="image" type="hidden" value="<?php echo $row['image'] ?>">
                                <input name="studentid" type="hidden" value="<?php echo $studentid ?>">
                                <input type="submit" name="submit" id="submit-btn" value="View Result">
                            </form>
                        </div>
                    </li>
                </ul>
            </div>
        <?php }
    else{ ?>

    <?php }} ?>
    </div>
<?php } else { ?>
    <p class="status error">Image(s) not found...</p>
<?php } ?>