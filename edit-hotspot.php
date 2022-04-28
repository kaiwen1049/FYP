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
$imagepath = $_POST['image'];
$total = $_POST['count'];
$stmt = $conn->prepare("select * from hotspots where imgPath=?");
$stmt->bind_param('s', $imagepath);
if ($stmt->execute()) {
    $result = $stmt->get_result();
}
$count = 0;
$ida = array();
$title1 = "";
$details1 = "";
$title2 = "";
$details2 = "";
$title3 = "";
$details3 = "";
$title4 = "";
$details4 = "";
$ida1 = "";
$ida2 = "";
$ida3 = "";
$ida4 = "";
$qtype1="";
$qtype2="";
$qtype3="";
$qtype4="";
$delete1="";
$delete2="";
$delete3="";
$delete4="";


if (isset($_POST['confirm'])) {
    $ida = array();
    $delete = array();
    if (isset($_POST['title1']))
        $title1 = $_POST['title1'];
    if (isset($_POST['title2']))
        $title2 = $_POST['title2'];
    if (isset($_POST['title3']))
        $title3 = $_POST['title3'];
    if (isset($_POST['title4']))
        $title4 = $_POST['title4'];

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

    if (isset($_POST['delete1']))
        $delete1 = $_POST['delete1'];
    if (isset($_POST['delete2']))
        $delete2 = $_POST['delete2'];
    if (isset($_POST['delete3']))
        $delete3 = $_POST['delete3'];
    if (isset($_POST['delete4']))
        $delete4 = $_POST['delete4'];

    array_push($ida, strval($ida1));
    array_push($ida, strval($ida2));
    array_push($ida, strval($ida3));
    array_push($ida, strval($ida4));
    array_push($delete, strval($delete1));
    array_push($delete, strval($delete2));
    array_push($delete, strval($delete3));
    array_push($delete, strval($delete4));
    $details = array($details1, $details2, $details3, $details4);
    $titles = array($title1, $title2, $title3, $title4);
    $qtypes = array($qtype1, $qtype2, $qtype3, $qtype4);
    $imagep = $_POST['image'];
    $id = $_SESSION['user']['id'];
    for ($x = 0; $x < 4; $x++) {
        if($delete[$x]!="n"){
            $query = "DELETE from hotspots WHERE hotspotID=?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $ida[$x]);
            $stmt->execute();
            $query = "DELETE from sq WHERE hotspotID=?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $ida[$x]);
            $stmt->execute();
            $query = "DELETE from results WHERE hotspotID=?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $ida[$x]);
            $stmt->execute();
        }
        else if ($titles[$x] != "") {
            $query = "UPDATE hotspots SET imgPath=?, title=?, details=?, qType=?, created_by=? WHERE hotspotID=?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ssssii', $imagep, $titles[$x], $details[$x], $qtypes[$x], $id, $ida[$x]);
            $stmt->execute();
        }
    }
    $stmt->close();
    header("location: homepage.php");
}
?>

<head>
    <meta charset="UTF-8">
    <title>FYP</title>
    <meta name="viewport" content="width=device-width, shrink-to-fit=0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <title>360-image-viewer</title>
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
    .deletebtn{
        background-color: #ed585d;
        border: 1px solid black;
        border-radius: 2px;
        height: 26px;
    }
    .deletebtn:hover{
        background-color: #fc3d43;
    }
    .cancelbtn{
        background-color: #21bf75;
        border: 1px solid black;
        border-radius: 2px;
        height: 26px;
    }
    .cancelbtn:hover{
        background-color: #13ed87;
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
            <?php if ($result->num_rows > 0) { ?>
                <form class="hotspot-form" action="" method="post" enctype="multipart/form-data">
                <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                    <?php while ($row = $result->fetch_assoc()) {
                        $totalhotspots = $result->num_rows;
                        if ($row['qType'] == "n") { ?>
                            <div class="content" style="display: none" id="<?php echo $count = $count + 1;
                                                                            array_push($ida, strval($row['hotspotID'])); ?>">
                                <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                                <h1>Hotspot <?php echo $count; ?></h1>
                                <select id="questionselect<?php echo $count ?>" onchange="questiontype(<?php echo $count; ?>, <?php echo $total; ?>)">
                                    <option value="n">Normal Hotspot</option>
                                    <option value="sq">Structured Question Hotspot</option>
                                </select><br>
                                <label>Hotspot Title: </label><br>
                                <input name="title<?php echo $count ?>" type="text" value="<?php echo $row['title'] ?>" required><br>
                                <label>Hotspot Description: </label><br>
                                <input name="details<?php echo $count ?>" type="text" value="<?php echo $row['details'] ?>"><br><br>
                                <?php if ($count == 1) { ?>
                                    <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)" disabled>Previous</button>
                                <?php } else { ?>
                                    <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)">Previous</button>
                                <?php } ?>
                                <?php if ($totalhotspots == $count) { ?>
                                    <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)" disabled>Next</button>
                                <?php } else { ?>
                                    <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)">Next</button>
                                <?php } ?>
                                <button type="button" id="markdelete<?php echo $count ?>" class="deletebtn" style="display:block; float:right;" onclick="markdelete(<?php echo $count ?>)">Mark for Delete</button>
                                <button type="button" id="canceldelete<?php echo $count ?>" class="cancelbtn" style="display:none; float:right;" onclick="canceldelete(<?php echo $count ?>)">Cancel Delete</button><br>
                                <input type="submit" name="confirm" value="Submit">
                                <input type="hidden" name="qtype<?php echo $count ?>" value="n">
                                <input type="hidden" id="delete<?php echo $count ?>" name="delete<?php echo $count ?>" value="n">
                            </div>
                        <?php ;
                        } else if ($row['qType'] == "sq") { ?>
                            <div class="content" style="display: none" id="<?php echo $count = $count + 1;
                                                                            array_push($ida, strval($row['hotspotID'])); ?>">
                                <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                                <h1>Hotspot <?php echo $count; ?></h1>
                                <select id="questionselect<?php echo $count ?>" onchange="questiontype(<?php echo $count; ?>, <?php echo $total; ?>)">
                                    <option value="sq">Structured Question</option>
                                    <option value="n">Normal Hotspot</option>
                                </select><br>
                                <label>Question: </label><br>
                                <input name="title<?php echo $count ?>" type="text" value="<?php echo $row['title'] ?>" required><br>
                                <label>Answer: </label><br>
                                <input name="details<?php echo $count ?>" type="text" value="<?php echo $row['details'] ?>"><br><br>
                                <?php if ($count == 1) { ?>
                                    <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)" disabled>Previous</button>
                                <?php } else { ?>
                                    <button type="button" id="previous<?php echo $count ?>" style="visibility: visible;" onclick="previousone(<?php echo $count ?>)">Previous</button>
                                <?php } ?>
                                <?php if ($totalhotspots == $count) { ?>
                                    <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)" disabled>Next</button>
                                <?php } else { ?>
                                    <button type="button" id="next<?php echo $count ?>" style="visibility: visible;" onclick="nextone(<?php echo $count ?>)">Next</button>
                                <?php } ?>
                                <button type="button" id="markdelete<?php echo $count ?>" class="deletebtn" style="display:block; float:right;" onclick="markdelete(<?php echo $count ?>)">Mark for Delete</button>
                                <button type="button" id="canceldelete<?php echo $count ?>" class="cancelbtn" style="display:none; float:right;" onclick="canceldelete(<?php echo $count ?>)">Cancel Delete</button><br>
                                <input type="submit" name="confirm" value="Submit">
                                <input type="hidden" name="qtype<?php echo $count ?>" value="sq">
                                <input type="hidden" id="delete<?php echo $count ?>" name="delete<?php echo $count ?>" value="n">
                            </div>
                    <?php }
                    } ?>
                    <?php if (isset($ida[0])) { ?><input type="hidden" name="ida" value="<?php echo $ida[0] ?>"><?php }; 
                    if (isset($ida[1])) { ?><input type="hidden" name="ida1" value="<?php echo $ida[1] ?>"><?php };
                    if (isset($ida[2])) { ?><input type="hidden" name="ida2" value="<?php echo $ida[2] ?>"><?php };                                    
                    if (isset($ida[3])) { ?><input type="hidden" name="ida3" value="<?php echo $ida[3] ?>"> <?php } ?>
                </form>
            <?php ;
            } ?>
        </div>
    </div>
    <script src="combine.js"></script>
    <script src="combine-2.js"></script>
</body>
<script>
    window.onload = function hidestuff() {
        document.getElementById("1").style.display = "block";
    }

    function markdelete(y){
        document.getElementById("delete"+y.toString()).value = y;
        document.getElementById("markdelete"+y.toString()).style.display = "none";
        document.getElementById("canceldelete"+y.toString()).style.display = "block";
    }

    function canceldelete(y){
        document.getElementById("delete"+y.toString()).value = "";
        document.getElementById("markdelete"+y.toString()).style.display = "block";
        document.getElementById("canceldelete"+y.toString()).style.display = "none";
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
        var x = document.getElementById(y);
        var z = document.getElementById(a);
        x.style.display = "none";
        z.style.display = "block";
    }

    function questiontype(y,l) {
        var x = document.getElementById("questionselect" + y.toString()).value;
        if (x == "n") {
            var hotspotheader = document.createElement("h1");
            hotspotheader.innerHTML = "Hotspot " + y.toString();

            var titlelabel = document.createElement("label");
            titlelabel.innerHTML = "Hotspot Title:";

            var titleinput = document.createElement("input");
            titleinput.setAttribute("name", "title" + y.toString());
            titleinput.setAttribute("type", "text");
            titleinput.setAttribute("required", "");

            var array = ["n", "sq", "mcq"];
            var optionnames = ["Normal Hotspot", "Structured Question Hotspot"];
            var selectList = document.createElement("select");
            selectList.id = "questionselect" + y.toString();
            selectList.setAttribute("disabled", "");
            if (y == 1)
                selectList.setAttribute("onchange", "questiontype(1,"+l.toString() + ")");
            else if (y == 2)
                selectList.setAttribute("onchange", "questiontype(2,"+l.toString() + ")");
            else if (y == 3)
                selectList.setAttribute("onchange", "questiontype(3,"+l.toString() + ")");
            else
                selectList.setAttribute("onchange", "questiontype(4,"+l.toString() + ")");
            for (var i = 0; i < array.length; i++) {
                var option = document.createElement("option");
                option.value = array[i];
                option.text = optionnames[i];
                selectList.appendChild(option);
            }

            var detailslabel = document.createElement("label");
            detailslabel.innerHTML = "Hotspot Description:";

            var detailsinput = document.createElement("input");
            detailsinput.setAttribute("name", "details" + y.toString());
            detailsinput.setAttribute("type", "text");

            var prebtn = document.createElement("button");
            prebtn.setAttribute("id", "previous"+y.toString());
            prebtn.setAttribute("type", "button");
            prebtn.textContent= 'Previous';
            if (y == 1)
            prebtn.setAttribute("onclick", "previousone(1)");
            else if (y == 2)
            prebtn.setAttribute("onclick", "previousone(2)");
            else if (y == 3)
            prebtn.setAttribute("onclick", "previousone(3)");
            else
            prebtn.setAttribute("onclick", "previousone(4)");
            if(y==(l+1))
            prebtn.style.visibility = 'hidden';
            else
            prebtn.style.visibility = 'visible';

            var nextbtn = document.createElement("button");
            nextbtn.setAttribute("id", "next"+y.toString());
            nextbtn.setAttribute("type", "button");
            nextbtn.textContent= 'Next';
            if (y == 1)
            nextbtn.setAttribute("onclick", "nextone(1)");
            else if (y == 2)
            nextbtn.setAttribute("onclick", "nextone(2)");
            else if (y == 3)
            nextbtn.setAttribute("onclick", "nextone(3)");
            else
            nextbtn.setAttribute("onclick", "nextone(4)");
            if(y==(l+1))
            nextbtn.style.visibility = 'hidden';
            else if (y!=l){
            nextbtn.style.visibility = 'visible';
            document.getElementById("next"+y.toString()).disabled = false;
            }else{
            nextbtn.style.visibility = 'visible';
            nextbtn.setAttribute("disabled", "");
            }

            var deletebtn = document.createElement("button");
            deletebtn.setAttribute("id", "delete"+y.toString());
            deletebtn.setAttribute("type", "button");
            deletebtn.className = "deletebtn";
            deletebtn.style.float = "right";
            deletebtn.style.display = "block";
            deletebtn.textContent= 'Mark for Delete';
            deletebtn.setAttribute("onclick", "markdelete("+y.toString()+")");

            var cancelbtn = document.createElement("button");
            cancelbtn.setAttribute("id", "delete"+y.toString());
            cancelbtn.setAttribute("type", "button");
            cancelbtn.style.float = "right";
            cancelbtn.style.display = "none";
            cancelbtn.className = "cancelbtn";
            cancelbtn.textContent= 'Cancel Delete';
            cancelbtn.setAttribute("onclick", "canceldelete("+y.toString()+")");

            var submit = document.createElement("input");
            submit.setAttribute("type", "submit");
            submit.setAttribute("name", "confirm");
            

            var hiddent = document.createElement("input");
            hiddent.setAttribute("type", "hidden");
            hiddent.setAttribute("name", "qtype"+y.toString());
            hiddent.setAttribute("value", "n");

            var deleteinput = document.createElement("input");
            deleteinput.setAttribute("type", "hidden");
            deleteinput.setAttribute("name", "delete"+y.toString());
            deleteinput.setAttribute("value", "n");

            linebreak = document.createElement('br');
            linebreak2 = document.createElement('br');
            linebreak3 = document.createElement('br');
            var newdiv = document.createElement("div");
            newdiv.append(hotspotheader);
            newdiv.append(selectList);
            newdiv.append(titlelabel);
            newdiv.append(titleinput);
            newdiv.append(detailslabel);
            newdiv.append(detailsinput);
            newdiv.append(linebreak);
            newdiv.append(linebreak3);
            newdiv.append(prebtn);
            newdiv.append(nextbtn);
            newdiv.append(deletebtn);
            newdiv.append(cancelbtn);
            newdiv.append(linebreak2);
            newdiv.append(submit);
            newdiv.append(hiddent);
            newdiv.append(deleteinput);
            document.getElementById(y).innerHTML = '';
            document.getElementById(y).appendChild(newdiv);
        } else if (x == "sq") {
            var hotspotheader = document.createElement("h1");
            hotspotheader.innerHTML = "Hotspot " + y.toString();

            var titlelabel = document.createElement("label");
            titlelabel.innerHTML = "Structured Question Title:";

            var titleinput = document.createElement("input");
            titleinput.setAttribute("name", "title" + y.toString());
            titleinput.setAttribute("type", "text");
            titleinput.setAttribute("required", "");

            var array = ["sq", "n", "mcq"];
            var optionnames = ["Structured Question Hotspot", "Normal Hotspot"];
            var selectList = document.createElement("select");
            selectList.id = "questionselect" + y.toString();
            selectList.setAttribute("disabled", "");
            if (y == 1)
                selectList.setAttribute("onchange", "questiontype(1,"+l.toString() + ")");
            else if (y == 2)
                selectList.setAttribute("onchange", "questiontype(2,"+l.toString() + ")");
            else if (y == 3)
                selectList.setAttribute("onchange", "questiontype(3,"+l.toString() + ")");
            else
                selectList.setAttribute("onchange", "questiontype(4,"+l.toString() + ")");
            for (var i = 0; i < array.length; i++) {
                var option = document.createElement("option");
                option.value = array[i];
                option.text = optionnames[i];
                selectList.appendChild(option);
            }

            var detailslabel = document.createElement("label");
            detailslabel.innerHTML = "Structured Question Answer:";

            var detailsinput = document.createElement("input");
            detailsinput.setAttribute("name", "details" + y.toString());
            detailsinput.setAttribute("type", "text");

            var prebtn = document.createElement("button");
            prebtn.setAttribute("id", "previous"+y.toString());
            prebtn.setAttribute("type", "button");
            prebtn.textContent= 'Previous';
            if (y == 1)
            prebtn.setAttribute("onclick", "previousone(1)");
            else if (y == 2)
            prebtn.setAttribute("onclick", "previousone(2)");
            else if (y == 3)
            prebtn.setAttribute("onclick", "previousone(3)");
            else
            prebtn.setAttribute("onclick", "previousone(4)");
            if(y==(l+1)||y==1){
            prebtn.style.visibility = 'visible';
            prebtn.setAttribute("disabled", "");}

            var nextbtn = document.createElement("button");
            nextbtn.setAttribute("id", "next"+y.toString());
            nextbtn.setAttribute("type", "button");
            nextbtn.textContent= 'Next';
            if (y == 1)
            nextbtn.setAttribute("onclick", "nextone(1)");
            else if (y == 2)
            nextbtn.setAttribute("onclick", "nextone(2)");
            else if (y == 3)
            nextbtn.setAttribute("onclick", "nextone(3)");
            else
            nextbtn.setAttribute("onclick", "nextone(4)");
            if(y==(l+1))
            nextbtn.style.visibility = 'hidden';
            else if (y!=l){
            nextbtn.style.visibility = 'visible';
            }else{
            nextbtn.style.visibility = 'visible';
            nextbtn.setAttribute("disabled", "");
            }

            var deletebtn = document.createElement("button");
            deletebtn.setAttribute("id", "delete"+y.toString());
            deletebtn.setAttribute("type", "button");
            deletebtn.style.float = "right";
            deletebtn.style.display = "block";
            deletebtn.className = "deletebtn";
            deletebtn.textContent= 'Mark for Delete';
            deletebtn.setAttribute("onclick", "markdelete("+y.toString()+")");

            var cancelbtn = document.createElement("button");
            cancelbtn.setAttribute("id", "delete"+y.toString());
            cancelbtn.setAttribute("type", "button");
            cancelbtn.style.float = "right";
            cancelbtn.style.display = "none";
            cancelbtn.className = "cancelbtn";
            cancelbtn.textContent= 'Cancel Delete';
            cancelbtn.setAttribute("onclick", "canceldelete("+y.toString()+")");
            
            var submit = document.createElement("input");
            submit.setAttribute("type", "submit");
            submit.setAttribute("name", "confirm");

            var hiddent = document.createElement("input");
            hiddent.setAttribute("type", "hidden");
            hiddent.setAttribute("name", "qtype" + y.toString());
            hiddent.setAttribute("value", "sq");

            var deleteinput = document.createElement("input");
            deleteinput.setAttribute("type", "hidden");
            deleteinput.setAttribute("name", "delete"+y.toString());
            deleteinput.setAttribute("value", "n");


            linebreak = document.createElement('br');
            linebreak2 = document.createElement('br');
            linebreak3 = document.createElement('br');
            var newdiv = document.createElement("div");
            newdiv.append(hotspotheader);
            newdiv.append(selectList);
            newdiv.append(titlelabel);
            newdiv.append(titleinput);
            newdiv.append(detailslabel);
            newdiv.append(detailsinput);
            newdiv.append(linebreak);
            newdiv.append(linebreak3);
            newdiv.append(prebtn);
            newdiv.append(nextbtn);
            newdiv.append(deletebtn);
            newdiv.append(cancelbtn);
            newdiv.append(linebreak2);
            newdiv.append(submit);
            newdiv.append(hiddent);
            newdiv.append(deleteinput);
            document.getElementById(y).innerHTML = '';
            document.getElementById(y).appendChild(newdiv);

        }
        return x;
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