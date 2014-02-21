<?php

$easy = array("n" => 3, "m" => 4, "middle" => array(
    array(4,7),
    array(0,1,2,3,5,6,8,9,10,11)
  ));
$hard = array("n" => 4, "m" => 5, "middle" => array(
    array(0,1,2,3,9,10,16,17,18,19),
    array(4,5,6,7,8,11,12,13,14,15)
  ));
$extreme = array("n" => 7, "m" => 10, "middle" => array(
    array(8,9,10,11,12,16,17,18,21,23,25,27,31,38,42,44,46,48,51,52,53,57,58,59,60,61),
    array(0,1,2,3,4,5,6,7,13,14,15,19,20,22,24,26,28,29,30,32,33,34,35,36,37,39,40,41,43,45,47,49,50,54,55,56,62,63,64,65,66,67,68,69)
  ));

$difficulties = array($easy, $hard, $extreme);
$puzzle = array();
$game = 0;


function allTheSame() {
    global $puzzle, $N, $M;
    $sample = $puzzle[0][0];
    for ($x = 0; $x < $N; ++$x) {
        $col = $puzzle[$x];
        for ($y = 0; $y < $M; ++$y)
            if ($col[$y] !== $sample)
                return false;
    }
    return true;
}


function flip($x, $y) {
    global $puzzle;
    $puzzle[$x][$y] = $puzzle[$x][$y] ^ 1;
}


function turn($x, $y) {
    global $N, $M;
    flip($x, $y);
    if ($y > 0)      flip($x, $y - 1);
    if ($y + 1 < $M) flip($x, $y + 1);
    if ($x > 0)      flip($x - 1, $y);
    if ($x + 1 < $N) flip($x + 1, $y);
}


function clearPuzzle() {
    global $N, $M, $puzzle;
    $puzzle = array();
    for ($i = 0; $i < $N; ++$i)
        $puzzle[] = array_fill(0, $M, 0);
}


function generatePuzzle($game, $difficulty) {
    global $N, $M, $difficulties, $middle;
    mt_srand($game);
    $N = $difficulties[$difficulty]['n'];
    $M = $difficulties[$difficulty]['m'];
    $nTurns = $N * $M / 2;
    clearPuzzle();
    $zeros = $difficulties[$difficulty]['middle'][0];
    $ones = $difficulties[$difficulty]['middle'][1];
    // discard half of the ones
    $nOnes = count($ones) / 2;
    while (count($ones) > $nOnes)
      array_splice($ones, mt_rand(0, count($ones)), 1);
    // discard zeros
    $nZeros = $nTurns - $nOnes;
    while (count($zeros) > $nZeros)
      array_splice($zeros, mt_rand(0, count($zeros)), 1);
    $selected = array_merge($ones, $zeros);
    for ($i = 0; $i < count($selected); ++$i) {
      $f = $selected[$i];
      turn($f % $N, floor($f / $N));
    }
    return $selected;
}


function verifyPuzzle($game, $difficulty, $moves) {
    generatePuzzle($game, $difficulty);
    // play solution
    foreach($moves as $f)
        turn($f[0], $f[1]);
    return allTheSame();
}

?>