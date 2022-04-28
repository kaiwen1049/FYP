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

$imagepath = $_POST['image'];
$count =  $_POST['count'];
$type = "";
$title1 = "";
$details1 = "";
$title2 = "";
$details2 = "";
$title3 = "";
$details3 = "";
$title4 = "";
$details4 = "";
$qtype1 = "";
$qtype2 = "";
$qtype3 = "";
$qtype4 = "";

if (isset($_POST['confirm'])) {
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

    if (isset($_POST['qtype1']))
        $qtype1 = $_POST['qtype1'];
    if (isset($_POST['qtype2']))
        $qtype2 = $_POST['qtype2'];
    if (isset($_POST['qtype3']))
        $qtype3 = $_POST['qtype3'];
    if (isset($_POST['qtype4']))
        $qtype4 = $_POST['qtype4'];

    $details = array($details1, $details2, $details3, $details4);
    $qtypes = array($qtype1, $qtype2, $qtype3, $qtype4);
    $titles = array($title1, $title2, $title3, $title4);
    $id = $_SESSION['user']['id'];
    $imagepath = $_POST['image'];
    for ($x = 0; $x < 4; $x++) {
        if ($titles[$x] != "") {
            $query = "INSERT INTO hotspots SET imgPath=?, title=?, details=?, qType=?, created_by=?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ssssi', $imagepath, $titles[$x], $details[$x], $qtypes[$x], $id);
            $stmt->execute();
        }
    }
    $stmt->close();
    header('location:student-view.php');
}

?>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, shrink-to-fit=0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <title>Adding Hotspot</title>
    <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet">
    <style>
        body {
            margin: 0;
            font-family: 'Source Sans Pro', Helvetica, sans-serif;
            overflow: hidden;
            align-items: center;
            background-color: #282828;
        }

        .leftdiv {
            float: left;
            width: 40%;
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

        .content {
            position: relative;
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
            padding-left: 35px;
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
    <div id="hotspot2"class="rightdiv">
        <div class="form-holder">
            <form class="hotspot-form" action="" method="post" enctype="multipart/form-data">
                <?php if ($count == 0) { ?>
                    <div class="content" style="display: block" id="1">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype1" value="n">
                        <h1>Hotspot 1</h1>
                        <select id="questionselect1" onchange="questiontype(1,0)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title1" type="text" required><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details1" type="text"><br>
                        <button type="button" id="add1" onclick="another(1)">Add</button><br>
                        <button type="button" style="visibility:hidden" id="previous1" onclick="previousone()" disabled>Previous</button>
                        <button type="button" style="visibility:hidden" id="next1" onclick="nextone(1)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                    <div class="content" id="2" style="display: none">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype2" value="n">
                        <h1>Hotspot 2</h1>
                        <select id="questionselect2" onchange="questiontype(2,0)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title2" id="title2" type="text"><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details2" type="text"><br>
                        <button type="button" id="add2" onclick="another(2)">Add</button><br>
                        <button type="button" style="visibility:hidden" id="previous2" onclick="previousone(2)">Previous</button>
                        <button type="button" style="visibility:hidden" id="next2" onclick="nextone(2)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                    <div class="content" id="3" style="display: none">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype3" value="n">
                        <h1>Hotspot 3</h1>
                        <select id="questionselect3" onchange="questiontype(3,0)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title3" id="title3" type="text"><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details3" type="text"><br>
                        <button type="button" id="add3" onclick="another(3)">Add</button><br>
                        <button type="button" style="visibility:hidden" id="previous3" onclick="previousone(3)">Previous</button>
                        <button type="button" style="visibility:hidden" id="next3" onclick="nextone(3)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                    <div class="content" id="4" style="display: none">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype4" value="n">
                        <h1>Hotspot 4</h1>
                        <select id="questionselect4" onchange="questiontype(4,0)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title4" id="title4" type="text"><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details4" type="text"><br>
                        <button type="button" id="add4" onclick="another(4)" style="visibility: hidden;">Add</button><br>
                        <button type="button" id="previous4" onclick="previousone(4)">Previous</button>
                        <button type="button" id="next4" onclick="nextone()" disabled>Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                <?php } ?>
                <?php if ($count == 1) { ?>
                    <div class="content" style="display: block" id="2">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype2" value="n">
                        <h1>Hotspot 2</h1>
                        <select id="questionselect2" onchange="questiontype(2, 1)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title2" type="text" required><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details2" type="text"><br>
                        <button type="button" id="add2" onclick="another(2)">Add</button><br>
                        <button type="button" style="visibility:hidden" id="previous2" onclick="previousone()" disabled>Previous</button>
                        <button type="button" style="visibility:hidden" id="next2" onclick="nextone(2)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                    <div class="content" id="3" style="display: none">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype3" value="n">
                        <h1>Hotspot 3</h1>
                        <select id="questionselect3" onchange="questiontype(3, 1)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title3" id="title3" type="text"><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details3" type="text"><br>
                        <button type="button" id="add3" onclick="another(3)">Add</button><br>
                        <button type="button" style="visibility:hidden" id="previous3" onclick="previousone(3)">Previous</button>
                        <button type="button" style="visibility:hidden" id="next3" onclick="nextone(3)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                    <div class="content" id="4" style="display: none">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype4" value="n">
                        <h1>Hotspot 4</h1>
                        <select id="questionselect4" onchange="questiontype(4, 1)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title4" id="title4" type="text"><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details4" type="text"><br>
                        <button type="button" id="add4" onclick="another(4)" style="visibility: hidden;">Add</button><br>
                        <button type="button" id="previous4" onclick="previousone(4)">Previous</button>
                        <button type="button" id="next4" onclick="nextone()" disabled>Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                <?php } ?>
                <?php if ($count == 2) { ?>
                    <div class="content" style="display: block" id="3">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype3" value="n">
                        <h1>Hotspot 3</h1>
                        <select id="questionselect3" onchange="questiontype(3,2)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title3" type="text" required><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details3" type="text"><br>
                        <button type="button" id="add3" onclick="another(3)">Add</button><br>
                        <button type="button" style="visibility:hidden" id="previous3" onclick="previousone()" disabled>Previous</button>
                        <button type="button" style="visibility:hidden" id="next3" onclick="nextone(3)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>
                    <div class="content" id="4" style="display: none">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype4" value="n">
                        <h1>Hotspot 4</h1>
                        <select id="questionselect4" onchange="questiontype(4,2)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title4" id="title4" type="text"><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details4" type="text"><br><br>
                        <button type="button" id="previous4" onclick="previousone(4)">Previous</button>
                        <button type="button" id="next4" onclick="nextone()" disabled>Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>

                <?php } ?>
                <?php if ($count == 3) { ?>
                    <div class="content" style="display: block" id="4">
                        <input type="hidden" name="image" value="<?php echo $imagepath ?>">
                        <input type="hidden" name="qtype4" value="n">
                        <h1>Hotspot 4</h1>
                        <select id="questionselect4" onchange="questiontype(4,3)">
                            <option value="n">Normal Hotspot</option>
                            <option value="sq">Structured Question Hotspot</option>
                        </select><br>
                        <label>Hotspot Title: </label><br>
                        <input name="title4" type="text" required><br>
                        <label>Hotspot Description: </label><br>
                        <input name="details4" type="text"><br>
                        <button type="button" style="visibility:hidden" id="previous4" onclick="previousone()" disabled>Previous</button>
                        <button type="button" style="visibility:hidden" id="next4" onclick="nextone(4)">Next</button><br><br>
                        <input type="submit" name="confirm" value="Submit">
                    </div>

                <?php } ?>
            </form>
        </div>
    </div>
    <script src="combine.js"></script>
    <script src="combine-2.js"></script>
</body>
<script>
    function previousone(y) {
        var a = y - 1;
        var x = document.getElementById(y);
        var z = document.getElementById(a)
        x.style.display = "none";
        z.style.display = "block";
        if (y == 2) {
            document.getElementById("previous" + (y - 1).toString()).setAttribute("disabled", "");
        }
    }

    function nextone(y) {
        var a = y + 1;
        var x = document.getElementById(y);
        var z = document.getElementById(a)
        x.style.display = "none";
        z.style.display = "block";
    }

    function another(y) {
        var a = y + 1;
        var x = document.getElementById(y);
        var z = document.getElementById(a)
        var q = 'previous' + y.toString();
        var w = 'next' + y.toString();
        var e = 'add' + y.toString();
        var r = 'previous' + a.toString();
        var t = 'next' + a.toString();
        var u = 'title' + a.toString();
        document.getElementById(q).style.visibility = 'visible';
        document.getElementById(w).style.visibility = 'visible';
        document.getElementById(t).style.visibility = 'visible';
        document.getElementById(r).style.visibility = 'visible';
        document.getElementById(w).disabled = false;
        document.getElementById(t).setAttribute("disabled", "");
        document.getElementById(e).style.visibility = 'hidden';
        document.getElementById(u).setAttribute("required", "");
        x.style.display = "none";
        z.style.display = "block";

    }

    function questiontype(y, l) {
        var x = document.getElementById("questionselect" + y.toString()).value;

        if (x == "sq") {
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
                selectList.setAttribute("onchange", "questiontype(1)");
            else if (y == 2)
                selectList.setAttribute("onchange", "questiontype(2)");
            else if (y == 3)
                selectList.setAttribute("onchange", "questiontype(3)");
            else
                selectList.setAttribute("onchange", "questiontype(4)");
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

            var addbtn = document.createElement("button");
            addbtn.setAttribute("id", "add" + y.toString());
            addbtn.setAttribute("type", "button");
            addbtn.textContent = 'Add';
            if (y == 1)
                addbtn.setAttribute("onclick", "another(1)");
            else if (y == 2)
                addbtn.setAttribute("onclick", "another(2)");
            else if (y == 3)
                addbtn.setAttribute("onclick", "another(3)");
            else
                addbtn.setAttribute("onclick", "another(4)");
            if (y == 4)
                addbtn.style.visibility = 'hidden';
            else
                addbtn.style.visibility = 'visible';

            var prebtn = document.createElement("button");
            prebtn.setAttribute("id", "previous" + y.toString());
            prebtn.setAttribute("type", "button");
            prebtn.textContent = 'Previous';
            if (y == 1)
                prebtn.setAttribute("onclick", "previousone(1)");
            else if (y == 2)
                prebtn.setAttribute("onclick", "previousone(2)");
            else if (y == 3)
                prebtn.setAttribute("onclick", "previousone(3)");
            else
                prebtn.setAttribute("onclick", "previousone(4)");
            if (y == (l + 1))
                prebtn.style.visibility = 'hidden';
            else
                prebtn.style.visibility = 'visible';

            var nextbtn = document.createElement("button");
            nextbtn.setAttribute("id", "next" + y.toString());
            nextbtn.setAttribute("type", "button");
            nextbtn.textContent = 'Next';
            if (y == 1)
                nextbtn.setAttribute("onclick", "nextone(1)");
            else if (y == 2)
                nextbtn.setAttribute("onclick", "nextone(2)");
            else if (y == 3)
                nextbtn.setAttribute("onclick", "nextone(3)");
            else
                nextbtn.setAttribute("onclick", "nextone(4)");
            if (y == (l + 1))
                nextbtn.style.visibility = 'hidden';
            else
                nextbtn.style.visibility = 'visible';
            nextbtn.setAttribute("disabled", "");

            var submit = document.createElement("input");
            submit.setAttribute("type", "submit");
            submit.setAttribute("name", "confirm");

            var hiddent = document.createElement("input");
            hiddent.setAttribute("type", "hidden");
            hiddent.setAttribute("name", "qtype" + y.toString());
            hiddent.setAttribute("value", "sq");

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
            newdiv.append(addbtn);
            newdiv.append(linebreak);
            newdiv.append(prebtn);
            newdiv.append(nextbtn);
            newdiv.append(linebreak2);
            newdiv.append(linebreak3);
            newdiv.append(submit);
            newdiv.append(hiddent);
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