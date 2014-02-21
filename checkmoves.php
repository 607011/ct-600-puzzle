<!DOCTYPE html>
<html>
<head>
<title>c't Cover Switch</title>
  <meta charset="utf-8" />
  <link href="img/favicon_ct.ico" rel="shortcut icon" />
</head>
<body>
<?php
require_once 'ajax/global.php';

if (isset($_REQUEST['game']) && isset($_REQUEST['difficulty']) && isset($_REQUEST['moves'])) {
    $game = intval($_REQUEST['game']);
    $difficulty = intval($_REQUEST['difficulty']);
    $moves = json_decode($_REQUEST['moves'], true);
    $ok = verifyPuzzle($game, $difficulty, $moves);
    if ($ok) {
        echo "Juhuuu, du hast das Puzzle #" . $game . " mit " . count($moves) . " Zügen gelöst!";
    }
    else {
        echo "Das war wohl nix. Nochmal&nbsp;&hellip;";
    }
}
?>
</body>
</html>
