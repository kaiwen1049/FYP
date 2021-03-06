<?php include('dbConfig.php'); ?>
<?php include(INCLUDE_PATH . '/logic/userSignup.php');
if (isset($_SESSION['user'])) {
    header("location: homepage.php");
  } ?>
<!DOCTYPE html>
<html>
<link rel="stylesheet" href="login.css">
<head>
    <meta charset="utf-8">
    <title>FYP</title>
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css" />
</head>

<body>
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4">
                <form class="form" action="login.php" method="post">
                    <h2 class="text-center">Login</h2>
                    <hr>
                    <!-- display form error messages  -->
                    <?php include(INCLUDE_PATH . "/layouts/messages.php") ?>
                    <div class="form-group <?php echo isset($errors['username']) ? 'has-error' : '' ?>">
                        <label class="control-label">Username or Email</label>
                        <input type="text" name="username" id="username" value="<?php echo $username; ?>" class="form-control">
                        <?php if (isset($errors['username'])) : ?>
                            <span class="help-block"><?php echo $errors['username'] ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="form-group <?php echo isset($errors['password']) ? 'has-error' : '' ?>">
                        <label class="control-label">Password</label>
                        <input type="password" name="password" id="password" class="form-control"><br>
                        <?php if (isset($errors['password'])) : ?>
                            <span class="help-block"><?php echo $errors['password'] ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="form-group">
                        <button type="submit" name="login_btn" class="btn btn-success">Login</button>
                    </div>
                    <p>Don't have an account? <a href="signup.php">Sign up</a></p>
                </form>
            </div>
        </div>
    </div>
    <?php include(INCLUDE_PATH . "/layouts/footer.php") ?>