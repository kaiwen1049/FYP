<link rel="stylesheet" href="navbar.css">

<div class="container"><br>
  <nav class="navbar">
    <div class="navbar-content-holder">
      <div class="navbar-header">
        <a class="navbar-a" href="<?php echo 'homepage.php' ?>">Home Page</a>
        <a class="navbar-a" href="<?php echo 'viewer-list.php' ?>">360° Viewer</a>
        <a class="navbar-a" href="<?php echo 'editor.php' ?>">Photo Editor</a>
        <a class="navbar-a" href="<?php echo 'hotspot-list.php' ?>">Hotspot</a>
        <?php if($_SESSION['user']['role_id']==2){?>
          <a class="navbar-a" href="<?php echo 'select-answer.php' ?>">Check Answers</a>
          <a class="navbar-a" href="<?php echo 'select-result.php' ?>">Check Results</a>
        <?php }?>
        <?php if($_SESSION['user']['role_id']==3){?>
          <a class="navbar-a" href="<?php echo 'student-result.php' ?>">Check Your Results</a>
        <?php }?>
      </div>
      <ul class="nav navbar-nav navbar-right">
        <?php if (isset($_SESSION['user'])): ?>
          <li class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
              <?php echo $_SESSION['user']['username'] . ' (' . $_SESSION['user']['role'] . ')'; ?> <span class="caret"></span></a>
            <ul class="dropdown-menu">
              <li><a style="color: #fdba3b !important; font-weight: bold;" href="<?php echo 'editProfile.php' ?>">Profile</a></li>
              <?php 
              if($_SESSION['user']['role_id']==2){ ?>
              <li><a style="color: #fdba3b !important; font-weight: bold;" href="<?php echo 'lecturer-signup.php' ?>">Create Lecturer Account</a></li>
              <li><a style="color: #fdba3b !important; font-weight: bold;" href="<?php echo 'lecturer-list.php' ?>">View all Lecturer Account</a></li>
              <?php } ?>
              
              <li role="separator" class="divider"></li>
              <li><a href="<?php echo BASE_URL . 'logout.php' ?>" style="color: red;font-weight: bold;">Logout</a></li>
            </ul>
          </li>
        <?php endif; ?>
      </ul>
    </div>
  </nav>
                   