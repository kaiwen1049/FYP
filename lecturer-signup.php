<?php include('dbConfig.php'); ?>
<?php include('includes/logic/userSignup.php'); ?>
<?php $roles = getAllRoles(); if (!isset($_SESSION['user'])) {
  header("location: login.php");
}
else if ($_SESSION['user']['role_id'] == 3){
  header("location: notfound.php");
}?>
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>FYP</title>
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
    <!-- Custom styles -->
    <link rel="stylesheet" href="lecturer-signup.css">
</head>

<body>   
<?php include('includes/layouts/admin_navbar.php'); ?></div>
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4">
                <form class="form" action="" method="post" enctype="multipart/form-data">
                    <h2 class="text-center">Sign up Lecturer</h2>
                    <hr>
                    <div class="form-group <?php echo isset($errors['username']) ? 'has-error' : '' ?>">
                        <label class="control-label">Username</label>
                        <input type="text" name="username" value="<?php echo $username; ?>" class="form-control">
                        <?php if (isset($errors['username'])) : ?>
                            <span class="help-block"><?php echo $errors['username'] ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="form-group <?php echo isset($errors['email']) ? 'has-error' : '' ?>">
                        <label class="control-label">Email Address</label>
                        <input type="email" name="email" value="<?php echo $email; ?>" class="form-control">
                        <?php if (isset($errors['email'])) : ?>
                            <span class="help-block"><?php echo $errors['email'] ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="form-group <?php echo isset($errors['password']) ? 'has-error' : '' ?>">
                        <label class="control-label">Password</label>
                        <input type="password" name="password" class="form-control">
                        <?php if (isset($errors['password'])) : ?>
                            <span class="help-block"><?php echo $errors['password'] ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="form-group <?php echo isset($errors['passwordConf']) ? 'has-error' : '' ?>">
                        <label class="control-label">Password confirmation</label>
                        <input type="password" name="passwordConf" class="form-control">
                        <?php if (isset($errors['passwordConf'])) : ?>
                            <span class="help-block"><?php echo $errors['passwordConf'] ?></span>
                        <?php endif; ?>
                    </div>
                    <input type="hidden" name="role_id" value="2">
                    <div class="form-group">
                        <button type="submit" name="signup_admin" class="btn btn-success btn-block">Sign up</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <?php include(INCLUDE_PATH . "/layouts/footer.php") ?>