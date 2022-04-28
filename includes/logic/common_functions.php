<?php
  // Accept a user ID and returns true if user is admin and false if otherwise
  function isAdmin($user_id) {
    global $conn;
    $sql = "SELECT * FROM users WHERE id=? AND role_id IS NOT NULL LIMIT 1";
    $user = getSingleRecord($sql, 'i', [$user_id]); // get single user from database
    if ($user==1) {
      return "lecturer";
    } else if ($user==2)
    {
      return "student";
    }
  }
  function loginById($user_id) {
    global $conn;
    $sql = "SELECT u.id, u.role_id, u.username, r.name as role FROM users u LEFT JOIN roles r ON u.role_id=r.id WHERE u.id=? LIMIT 1";
    $user = getSingleRecord($sql, 'i', [$user_id]);

    if (!empty($user)) {
      $_SESSION['user'] = $user;
      $_SESSION['success_msg'] = "You are now logged in";
      if ($_SESSION['user']['role_id'] == 2) {
        header('location: ' . BASE_URL . 'lecturer-view.php');
      } else if ($_SESSION['user']['role_id'] == 3){
        header('location: ' . BASE_URL . 'student-view.php');
      }
      exit(0);
    }
  }

// Accept a user object, validates user and return an array with the error messages
  function validateUser($user, $ignoreFields) {
  		global $conn;
      $errors = [];
      // password confirmation
      if (isset($user['passwordConf']) && ($user['password'] !== $user['passwordConf'])) {
        $errors['passwordConf'] = "The two passwords do not match";
      }
      // if passwordOld was sent, then verify old password
      if (isset($user['passwordOld']) && isset($user['user_id'])) {
        $sql = "SELECT * FROM users WHERE id=? LIMIT 1";
        $oldUser = getSingleRecord($sql, 'i', [$user['user_id']]);
        $prevPasswordHash = $oldUser['password'];
        if (!password_verify($user['passwordOld'], $prevPasswordHash)) {
          $errors['passwordOld'] = "The old password does not match";
        }
      }
      // the email should be unique for each user for cases where we are saving admin user or signing up new user
      if (in_array('save_user', $ignoreFields) || in_array('signup_btn', $ignoreFields)) {
        $sql = "SELECT * FROM users WHERE email=? OR username=? LIMIT 1";
        $oldUser = getSingleRecord($sql, 'ss', [$user['email'], $user['username']]);
        if (!empty($oldUser['email']) && $oldUser['email'] === $user['email']) { // if user exists
          $errors['email'] = "Email already exists";
        }
        if (!empty($oldUser['username']) && $oldUser['username'] === $user['username']) { // if user exists
          $errors['username'] = "Username already exists";
        }
      }

      // required validation
  	  foreach ($user as $key => $value) {
        if (in_array($key, $ignoreFields)) {
          continue;
        }
  			if (empty($user[$key])) {
  				$errors[$key] = "This field is required";
  			}
  	  }
  		return $errors;
  }
  // upload's user profile profile picture and returns the name of the file

  function validateRole($role, $ignoreFields) {
    global $conn;
    $errors = [];
    foreach ($role as $key => $value) {
      if (in_array($key, $ignoreFields)) {
          continue;
      }
      if (empty($role[$key])) {
        $errors[$key] = "This field is required";
      }
    }
    return $errors;
}
function getAllRoles(){
  global $conn;
  $sql = "SELECT id, name FROM roles";
  $stmt = $conn->prepare($sql);
  $stmt->execute();
  $result = $stmt->get_result();
  $roles = $result->fetch_all(MYSQLI_ASSOC);
  return $roles;
}