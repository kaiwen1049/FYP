<!DOCTYPE html>
<html lang="en">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<!-- Bootstrap JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
<?php
require_once 'dbConfig.php';
if (!isset($_SESSION['user'])) {
  header("location: login.php");
}
$msg = "";
$count = 0;
$ida = array();
$imagepath = $_POST['image'];
$stmt = $conn->prepare("select * from hotspots where imgPath=?");
$stmt->bind_param('s', $imagepath);
if ($stmt->execute()) {
  $result = $stmt->get_result();
}


$details1 = "";
$details2 = "";
$details3 = "";
$details4 = "";
$ida1 = "";
$ida2 = "";
$ida3 = "";
$ida4 = "";
$qtype1 = "";
$qtype2 = "";
$qtype3 = "";
$qtype4 = "";


if (isset($_POST['confirm'])) {
  $ida = array();

  if (isset($_POST['details1']))
    $details1 = $_POST['details1'];
  if (isset($_POST['details2']))
    $details2 = $_POST['details2'];
  if (isset($_POST['details3']))
    $details3 = $_POST['details3'];
  if (isset($_POST['details4']))
    $details4 = $_POST['details4'];

  if (isset($_POST['ida']))
    $ida1 = $_POST['ida'];
  if (isset($_POST['ida1']))
    $ida2 = $_POST['ida1'];
  if (isset($_POST['ida2']))
    $ida3 = $_POST['ida2'];
  if (isset($_POST['ida3']))
    $ida4 = $_POST['ida3'];

  if (isset($_POST['qtype1']))
    $qtype1 = $_POST['qtype1'];
  if (isset($_POST['qtype2']))
    $qtype2 = $_POST['qtype2'];
  if (isset($_POST['qtype3']))
    $qtype3 = $_POST['qtype3'];
  if (isset($_POST['qtype4']))
    $qtype4 = $_POST['qtype4'];

  array_push($ida, strval($ida1));
  array_push($ida, strval($ida2));
  array_push($ida, strval($ida3));
  array_push($ida, strval($ida4));
  $details = array($details1, $details2, $details3, $details4);
  $qtypes = array($qtype1, $qtype2, $qtype3, $qtype4);
  $uncheck = "uncheck";
  $id = $_SESSION['user']['id'];
  for ($x = 0; $x < 4; $x++) {
    if ($qtypes[$x] == "sq") {
      $query = "INSERT INTO sq SET user_id=$id, hotspotID=?, answer=?, checking=?";
      $stmt = $conn->prepare($query);
      $stmt->bind_param('iss', $ida[$x], $details[$x], $uncheck);
      $stmt->execute();
    }
  }
  $stmt->close();
  header("location: homepage.php");
}
?>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, shrink-to-fit=0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <title>FYP</title>
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Source Sans Pro', Helvetica, sans-serif;
      overflow: hidden;
      align-items: center;
      background-color: #282828;
    }

    * {
      -webkit-touch-callout: none;
      -webkit-text-size-adjust: none;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      -webkit-user-select: none;
    }

    .info {
      bottom: 0;
      left: 0;
      margin: 20px;
      pointer-events: none;
    }

    .hr {
      width: 20px;
      height: 1px;
      margin: 0;
      padding: 0;
      margin-bottom: 10px;
      display: block;
      background: white;
    }

    p {
      display: block;
      margin: 0;
      padding: 0;
      color: #fdba3b;
      font-size: 25px;
    }

    canvas,
    .grab {
      cursor: -webkit-grab;
      cursor: -moz-grab;
    }

    canvas:active,
    .grabbing {
      cursor: -webkit-grabbing;
      cursor: -moz-grabbing;
    }

    #canvas-container {
      align-items: center;
      padding-top: 35px;
    }

    .leftdiv {
      float: left;
      width: 40%;
      padding-left: 25px;
    }

    .rightdiv {
      float: right;
      width: 50%;
      padding-top: 35px;
      padding-right: 15px;
    }

    .form-holder {
      border-radius: 5px;
      background-color: #f2f2f2;
      padding: 20px;
      vertical-align: middle;
    }

    input[type=text],
    select {
      width: 100%;
      padding: 12px 20px;
      margin: 8px 0;
      display: inline-block;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }

    input[type=submit] {
      width: 100%;
      background-color: #4CAF50;
      color: white;
      padding: 14px 20px;
      margin: 8px 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    input[type=submit]:hover {
      background-color: #45a049;
    }

    .hotspot-form {
      padding: 25px;
    }

    #showandhide {
      height: 40px;
      width: 150px;
      background-color: #fdba3b;
      border-radius: 5px;
      box-shadow: 0 16px 16px 0 rgba(0, 0, 0, 0.24), 0 17px 50px 0 rgba(0, 0, 0, 0.19);
    }
  </style>

</head>

<body>
  <?php include('includes/layouts/admin_navbar.php'); ?><button id="showandhide" onclick="toogle_hotspot()">Hide Hotspot Details</button></div>
  <div id="fullscreen-canvas" style="display: none; padding-left: 45px; padding-right: 25px; padding-top: 35px">
    <input id="imagename" type="hidden" value="<?php echo $imagepath ?>">
    <canvas id="canvas2"></canvas>
  </div>
  <div id="hotspot" class="leftdiv">
    <div id="canvas-container">
      <input id="imagename" type="hidden" value="<?php echo $imagepath ?>">
      <canvas id="canvas"></canvas>
    </div>
  </div>
  <div id="hotspot2" class="rightdiv">
    <div class="form-holder">
      <?php if ($result->num_rows > 0) {
        $totalhotspots = $result->num_rows; ?>
        <form class="hotspot-form" action="" method="post" enctype="multipart/form-data">
          <?php while ($row = $result->fetch_assoc()) {
            $totalhotspots = $result->num_rows;
            if ($row['qType'] == "n") { ?>
              <div class="content" style="display: none" id="<?php echo $count = $count + 1;
                                                              array_push($ida, strval($row['hotspotID'])); ?>">
                <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                <h1>Hotspot <?php echo $count; ?></h1>
                <select id="questionselect<?php echo $count ?>" onchange="questiontype(<?php echo $count; ?>)" disabled>
                  <option value="n">Normal Hotspot</option>
                  <option value="sq">Structured Question Hotspot</option>
                  <option value="mcq">Multiple Choice Question Hotspot</option>
                </select><br>
                <label>Hotspot Title: </label><br>
                <input name="title<?php echo $count ?>" type="text" value="<?php echo $row['title'] ?>" readonly><br>
                <label>Hotspot Description: </label><br>
                <input name="details<?php echo $count ?>" type="text" value="<?php echo $row['details'] ?>" readonly><br>
                <?php if ($count == 1) { ?>
                  <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)" disabled>Previous</button>
                <?php } else { ?>
                  <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)">Previous</button>
                <?php } ?>
                <?php if ($totalhotspots == $count) { ?>
                  <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)" disabled>Next</button><br><br>
                <?php } else { ?>
                  <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)">Next</button><br><br>
                  <input type="hidden" name="qtype<?php echo $count ?>" value="n">
                <?php } ?>
              </div>
            <?php ;
            } else if ($row['qType'] == "sq") { ?>
              <div class="content" style="display: none" id="<?php echo $count = $count + 1;
                                                              array_push($ida, strval($row['hotspotID'])); ?>">
                <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                <h1>Hotspot <?php echo $count; ?></h1>
                <select id="questionselect<?php echo $count ?>" onchange="questiontype(<?php echo $count; ?>)" disabled>
                  <option value="sq">Structured Question</option>
                  <option value="n">Normal Hotspot</option>
                  <option value="mcq">Multiple Choice Question Hotspot</option>
                </select><br>
                <label>Question: </label><br>
                <input name="title<?php echo $count ?>" type="text" value="<?php echo $row['title'] ?>" readonly><br>
                <label>Answer: </label><br>
                <input name="details<?php echo $count ?>" type="text" value="<?php echo $row['details'] ?>"><br>
                <?php if ($count == 1) { ?>
                  <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)" disabled>Previous</button>
                <?php } else { ?>
                  <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)">Previous</button>
                <?php } ?>
                <?php if ($totalhotspots == $count) { ?>
                  <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)" disabled>Next</button><br><br>
                <?php } else { ?>
                  <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)">Next</button><br><br>
                <?php } if($_SESSION['user']['role_id']==3){?>
                <input type="submit" name="confirm" value="Submit"><?php }?>
                <input type="hidden" name="qtype<?php echo $count ?>" value="sq">
              </div>
          <?php }
          } ?>
          <?php if (isset($ida[0])) { ?><input type="hidden" name="ida" value="<?php echo $ida[0] ?>"><?php };
          if (isset($ida[1])) { ?><input type="hidden" name="ida1" value="<?php echo $ida[1] ?>"><?php };                                                                                                                                                                                                
          if (isset($ida[2])) { ?><input type="hidden" name="ida2" value="<?php echo $ida[2] ?>"><?php };
          if (isset($ida[3])) { ?><input type="hidden" name="ida3" value="<?php echo $ida[3] ?>"> <?php } ?>
        </form>
      <?php ;
      } else
        echo "<p>There is no hotspots for this image.</p>"; ?>
    </div>
  </div>
  <script src="combine.js"></script>
  <script src="combine-2.js"></script>
</body>
<script>
  window.onload = function hidestuff() {
    document.getElementById("1").style.display = "block";
  }

  function previousone(y) {
    var a = y - 1;
    var x = document.getElementById(y);
    var z = document.getElementById(a)
    x.style.display = "none";
    z.style.display = "block";
  }

  function nextone(y) {
    var a = y + 1;
    var c = "previous" + a.toString();
    var d = "next" + a.toString();
    var x = document.getElementById(y);
    var z = document.getElementById(a);
    if (c != "previous1")
      document.getElementById(c).disabled = false;
    if (d == "next4")
      document.getElementById(d).setAttribute("disabled", "");
    x.style.display = "none";
    z.style.display = "block";
  }

  function toogle_hotspot() {
    var x = document.getElementById("hotspot");
    var y = document.getElementById("hotspot2");
    var z = document.getElementById("fullscreen-canvas");
    var a = document.getElementById("canvas2");
    var b = document.getElementById("canvas");
    if (x.style.display === "none") {
      x.style.display = "block";
      z.style.display = "none";
      b.id = "canvas2";
      a.id = "canvas";
    } else {
      x.style.display = "none";
      z.style.display = "block";
      b.id = "canvas2";
      a.id = "canvas";
    }
    if (y.style.display === "none") {
      y.style.display = "block";
    } else {
      y.style.display = "none";
    }
  }
</script>

</html>