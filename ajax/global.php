<?php

$easy = array("d" => 'leicht', "n" => 3, "m" => 4,
  "mid" => array(
        array(1, 1, 1),
        array(1, 0, 1),
        array(1, 0, 1),
        array(1, 1, 1)
    )
);
$hard = array("d" => 'schwer', "n" => 4, "m" => 5,
  "mid" => array(
        array(0, 0, 0, 0),
        array(1, 1, 1, 1),
        array(1, 0, 0, 1),
        array(1, 1, 1, 1),
        array(0, 0, 0, 0)
    )
);
$extreme = array("d" => 'extrem', "n" => 7, "m" => 10,
  "mid" => array(
        array(1, 1, 1, 1, 1, 1, 1),
        array(1, 0, 0, 0, 0, 0, 1),
        array(1, 1, 0, 0, 0, 1, 1),
        array(0, 1, 0, 1, 0, 1, 0),
        array(1, 1, 1, 0, 1, 1, 1),
        array(1, 1, 1, 0, 1, 1, 1),
        array(0, 1, 0, 1, 0, 1, 0),
        array(1, 1, 0, 0, 0, 1, 1),
        array(1, 0, 0, 0, 0, 0, 1),
        array(1, 1, 1, 1, 1, 1, 1)
    )
);

$difficulties = array($easy, $hard, $extreme);
$puzzle = array();
$game = 0;


function indexesByValue($arr, $v) {
    $concatenated = array_reduce($arr,
        function ($prev, $curr) {
            return array_merge($prev, $curr);
        },
        array());
    $mapped = array_map(
        function ($val, $idx) use ($v) {
            return ($val === $v) ? $idx : null;
        },
        array_values($concatenated),
        array_keys($concatenated));
    $filtered = array_filter($mapped,
        function ($val) {
            return $val !== null;
        });
    return array_values($filtered);
}

$middle = array(
    array(
        indexesByValue($difficulties[0]['mid'], 0),
        indexesByValue($difficulties[0]['mid'], 1)
    ),
    array(
        indexesByValue($difficulties[1]['mid'], 0),
        indexesByValue($difficulties[1]['mid'], 1)
    ),
    array(
        indexesByValue($difficulties[2]['mid'], 0),
        indexesByValue($difficulties[2]['mid'], 1)
    )
);


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
    $zeros = $middle[$difficulty][0];
    $ones = $middle[$difficulty][1];
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