<?php include('dbConfig.php'); 
if (!isset($_SESSION['user'])) {
  header("location: login.php");
}?>
<?php include('includes/logic/common_functions.php'); ?>
<?php include('admin/users/userLogic.php'); ?>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
<?php
  $sql = "SELECT id, username, email FROM users WHERE id=?";
  $user = getSingleRecord($sql, 'i', [$_SESSION['user']['id']]);
  $roles = getMultipleRecords("SELECT * FROM roles");

  $user_id = $user['id'];
  $username = $user['username'];
  $email = $user['email'];
?>
<!DOCTYPE html>
<style>
  #input-label{
    font-size: 18px;
    font-weight: bold;
    color: orange;
    
  }
  #edit-title{
    font-weight: bolder;
    color: orange;
  }
  #input-container{
    max-width: 450px;
    align-items: center;
    align-content: center;
    margin: auto;
  }

  #contain-all{
    padding-top: 20px;
  }
  #contain-form{
    border: solid rgba(255, 166, 0, 0.377);
    border-radius: 5px;
    padding: 0px;
  }
</style>
<html>
  <head>
    <meta charset="utf-8">
    <title>FYP</title>
  </head>
  <body>
  <?php include('includes/layouts/admin_navbar.php'); ?>

    <div class="container" id="contain-all">
      <div class="row" >

        <form action="editProfile.php"method="post" enctype="multipart/form-data">
          <input type="hidden" name="user_id" value="<?php echo $user_id ?>">
          <div class="col-md-8 col-md-offset-2" id="contain-form">
            <h2 class="text-center" id="edit-title">Edit Your Profile Info</h2><br>
              <div id="input-container"  >
                <div class="form-group <?php echo isset($errors['username']) ? 'has-error' : '' ?>">
                  <label class="control-label" id="input-label">Username</label>
                  <input type="text" name="username" value="<?php echo $username; ?>" class="form-control">
                  <?php if (isset($errors['username'])): ?>
                    <span class="help-block"><?php echo $errors['username'] ?></span>
                  <?php endif; ?>
                </div>
                <div class="form-group <?php echo isset($errors['email']) ? 'has-error' : '' ?>">
                  <label class="control-label"id="input-label">Email Address</label>
                  <input type="email" name="email" value="<?php echo $email; ?>" class="form-control">
                  <?php if (isset($errors['email'])): ?>
                    <span class="help-block"><?php echo $errors['email'] ?></span>
                  <?php endif; ?>
                </div>
                <div class="form-group <?php echo isset($errors['passwordOld']) ? 'has-error' : '' ?>">
                  <label class="control-label"id="input-label">Old Password</label>
                  <input type="password" name="passwordOld" class="form-control">
                  <?php if (isset($errors['passwordOld'])): ?>
                    <span class="help-block"><?php echo $errors['passwordOld'] ?></span>
                  <?php endif; ?>
                </div>
                <div class="form-group <?php echo isset($errors['password']) ? 'has-error' : '' ?>">
                  <label class="control-label"id="input-label">Password</label>
                  <input type="password" name="password" class="form-control">
                  <?php if (isset($errors['password'])): ?>
                    <span class="help-block"><?php echo $errors['password'] ?></span>
                  <?php endif; ?>
                </div>
                <div class="form-group <?php echo isset($errors['passwordConf']) ? 'has-error' : '' ?>">
                  <label class="control-label"id="input-label">Password confirmation</label>
                  <input type="password" name="passwordConf" class="form-control">
                  <input type="hidden" name="role_id" value="<?php echo $_SESSION['user']['role_id']?>">
                  <?php if (isset($errors['passwordConf'])): ?>
                    <span class="help-block"><?php echo $errors['passwordConf'] ?></span>
                  <?php endif; ?>
                </div><br>
                <div class="form-group">
                  <button type="submit" name="update_profile" class="btn btn-success">Update Profile</button>
                </div><br>
              </div>
          </div>
      </form>

      </div>
    </div>