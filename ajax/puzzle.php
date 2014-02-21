<?php

require_once 'global.php';

if (isset($_REQUEST['difficulty'])) {
    $game = isset($_REQUEST['game']) ? intval($_REQUEST['game']) : rand();
    $difficulty = intval($_REQUEST['difficulty']);
    $selected = generatePuzzle($game, $difficulty);
    sort($selected, SORT_NUMERIC);
    $result = array(
        'game' => $game,
        'difficulty' => $difficulty,
        'puzzle' => $puzzle,
        'N' => $N,
        'M' => $M
    );
}
else {
    $result = array(
        'status' => 'error',
        'error' => 'Parameter `difficulty` fehlt'
    );
}

header('Content-type: text/json');
echo json_encode($result);

?>
