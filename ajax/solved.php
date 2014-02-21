<?php

require_once 'global.php';

if (isset($_REQUEST['game']) && isset($_REQUEST['difficulty']) && isset($_REQUEST['moves'])) {
    $game = intval($_REQUEST['game']);
    $difficulty = intval($_REQUEST['difficulty']);
    $moves = json_decode($_REQUEST['moves'], true);
    $ok = puzzleSolved($game, $difficulty, $moves);
    $result = array(
        'status' => ($ok ? 'ok' : 'wrong'),
        'difficulty' => $difficulty,
        'game' => $game
    );
}
else {
    $result = array(
        'status' => 'error',
        'error' => 'Unvollständige Parameter'
    );
}

header('Content-type: text/json');
echo json_encode($result);

?>
