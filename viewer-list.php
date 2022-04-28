<link rel="stylesheet" type="text/css" href="table.css">
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

    #upload-btn {
        margin-bottom: 16px;
        width: 200px;
        background-color: #fdba3b;
        color: black;
        font-size: 20px;
        font-weight: bold;
        border: solid 1px black;
        box-shadow: 0 16px 16px 0 rgba(0, 0, 0, 0.24), 0 17px 50px 0 rgba(0, 0, 0, 0.19);
    }

    #view-btn {
        height: 40px;
        width: 150px;
        background-color: #fdba3b;
        border-radius: 5px;
        box-shadow: 0 16px 16px 0 rgba(0, 0, 0, 0.24), 0 17px 50px 0 rgba(0, 0, 0, 0.19);
    }

    #modal-header {
        font-weight: bold;
        color: black;
    }

    #btn_upload {
        background-color: #fdba3b;
        color: black;
        font-weight: bold;
        border-color: #fdba3b;
        border: solid 1px black;
    }
    #close-btn{
        background: none;
        border: none;
        color: red;
        font-weight: bold;
        font-size: 18px;
    }
    #title{
      padding-top: 35px;
      font-size: 35px;
      color: #fdba3b;
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
if (isset($_POST['deletebtn'])) {
    $imageid=$_POST['delete'];

    $sql = "SELECT * FROM images WHERE id= '" . $imageid . "'";
    $imgPath = $conn->query($sql) or die($conn->error);
    
    $query = "DELETE from images WHERE id=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $imageid);
    $stmt->execute();
    $result = $conn->query("SELECT * FROM hotspots");
    while($row = $result->fetch_assoc()){
    if($row['imgPath'] == $imgPath)
    {
    $query = "DELETE from hotspots WHERE imgPath=?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $imgPath);
    $stmt->execute();
    }}
}
// Get image data from database 
$result = $conn->query("SELECT * FROM images ORDER BY id DESC");
$id = $_SESSION['user']['id'];
?>

<?php if ($result->num_rows > 0) { ?>
    <?php include('includes/layouts/admin_navbar.php'); ?></div>
    <center><button type="button" class="btn btn-info" id="upload-btn" data-toggle="modal" data-target="#uploadModal">Upload file</button></center>
    <div class="gallery">
        <?php while ($row = $result->fetch_assoc()) { ?>
            <div id="container-table">
                <ul class="responsive-table">
                    <li class="table-header">
                        <div class="col col-1"><?php if($row['uploaded_by'] == $id){?>
                            <form action="" method="post" enctype="multipart/form-data">
                                <input name="delete" type="hidden" value="<?php echo $row['id'] ?>">
                                <input type="submit" name="deletebtn" id="close-btn" value="Delete">
                            </form><?php }?>
                        </div>
                        <div class="col col-2"><img style="max-width: 250px; max-height: 125px;" src="<?php echo ($row['image']); ?>" /></div>
                        <div class="col col-3"></div>
                        <div class="col col-4">
                            <form action="viewer.php" method="post" enctype="multipart/form-data">
                                <input name="image" type="hidden" value="<?php echo $row['image'] ?>">
                                <input type="submit" name="submit" id="view-btn" value="View 360° Photo">
                            </form>
                        </div>
                    </li>
                </ul>
            </div>
        <?php } ?>
    </div>
<?php } else { ?>
    <?php include('includes/layouts/admin_navbar.php'); ?></div>
    <center><button type="button" class="btn btn-info" id="upload-btn" data-toggle="modal" data-target="#uploadModal">Upload file</button></center>
    <div class="gallery">
    <center><p id="title">No 360-Degree Images was Found!</p></center>
    </div>
<?php }
$fileuploaded = 0; ?>

<div id="uploadModal" class="modal fade" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title" id="modal-header">File upload form</h4>
            </div>
            <div class="modal-body">
                <form method='post' action='' enctype="multipart/form-data">
                    Select file : <input type='file' name='file' id='file' class='form-control'><br>
                    <input type='button' class='btn btn-info' value='Upload' id='btn_upload'>
                    <a href="viewer-list.php" id="btndone">Done</a>
                </form>

                <div id='preview'></div>
            </div>

        </div>

    </div>
</div>
<script type='text/javascript'>
    $(document).ready(function() {
        $('#btn_upload').click(function() {

            var fd = new FormData();
            var files = $('#file')[0].files[0];
            fd.append('file', files);

            // AJAX request
            $.ajax({
                url: 'ajaxfile.php',
                type: 'post',
                data: fd,
                contentType: false,
                processData: false,
                success: function(response) {
                    if (response == 1) {
                        document.getElementById('preview').innerHTML = "";
                        document.getElementById('preview').innerHTML = "<p>Error! Failed to upload file.</p>";
                    } else if (response != 0) {
                        document.getElementById('preview').innerHTML = "";
                        document.getElementById('preview').innerHTML = "<img src='" + response + "' width='100' height='100' style='display: inline-block;'>";
                    } else {
                        alert('File not uploaded');
                    }
                }
            });
        });
    });
</script>