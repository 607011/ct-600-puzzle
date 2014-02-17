/*
    c't Cover Switch
    Copyright (c) 2014 Oliver Lau <ola@ct.de>, Heise Zeitschriften Verlag

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

Number.prototype.factorial = function () {
  var x = 1, i;
  for (i = 2; i <= this; ++i)
    x *= i;
  return x;
};


(function () {
  "use strict";
  var RNG = function (seed) {
    this.seed(seed || Date.now());
  };
  RNG.prototype.seed = function (seed) {
    if (typeof seed !== 'number')
      throw new TypeError('Parameter `seed` must be a number');
    this.X = seed;
  };
  RNG.prototype.next = function () {
    // LCG from the book 'Numerical Recipes'
    this.X = (1664525 * this.X + 1013904223) % 4294967296;
    return this.X;
  };

  var opts = { game: null, difficulty: null },
    difficulties = [
      { d: 'leicht', n: 3, m: 4, mid: [
        [1, 1, 1],
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 1]
      ]  },
      {
        d: 'schwer', n: 4, m: 5, mid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
      ] },
      {
        d: 'extrem', n: 7, m: 10, mid: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 0, 0, 0, 1, 1],
        [0, 1, 0, 1, 0, 1, 0],
        [1, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 0, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0],
        [1, 1, 0, 0, 0, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
      ] }
    ],
    indexesByValue = function (arr, v) {
      return arr.reduce(function (prev, curr) { return prev.concat(curr); })
        .map(function (curr, idx, arr) { return (curr === v) ? idx : null; })
        .filter(function (val) { return val !== null; });
    },
    middle = [
      {
        0: indexesByValue(difficulties[0].mid, 0),
        1: indexesByValue(difficulties[0].mid, 1)
      },
      {
        0: indexesByValue(difficulties[1].mid, 0),
        1: indexesByValue(difficulties[1].mid, 1)
      },
      {
        0: indexesByValue(difficulties[2].mid, 0),
        1: indexesByValue(difficulties[2].mid, 1)
      }
    ],
    rng = new RNG(),
    puzzle, moves,
    N, M, nStates = 2, nFields, nTurns, nCombinations;


  function flip(x, y) {
    puzzle[x][y] ^= 1;
    $('#back-' + x + '-' + y).toggleClass('front').toggleClass('back');
    $('#front-' + x + '-' + y).toggleClass('front').toggleClass('back');
  }


  function turn(x, y) {
    flip(x, y);
    if (y > 0)     flip(x, y - 1);
    if (y + 1 < M) flip(x, y + 1);
    if (x > 0)     flip(x - 1, y);
    if (x + 1 < N) flip(x + 1, y);
  }


  function allTheSame() {
    var sample = puzzle[0][0], x, y, col;
    for (x = 0; x < N; ++x) {
      col = puzzle[x];
      for (y = 0; y < M; ++y)
        if (col[y] !== sample)
          return false;
    }
    return true;
  }


  function checkFinished() {
    if (allTheSame()) {
      alert('Juhuuu! Du hast das Puzzle mit ' + moves.length + ' Zügen gelöst!');
      newGame();
    }
  }


  function resize() {
    var x, y, dw, dh, tw, th, persp, bgpos, cells = $('#puzzle .cell'), left, top;
    if ($(window).width() >= 480) {
      dw = Math.floor(411 / N);
      dh = Math.floor(582 / M);
      persp = 2;
    }
    else {
      dw = Math.floor(274 / N);
      dh = Math.floor(388 / M);
      persp = 3;
    }
    $('#puzzle').width((dw * N) + 'px').height((dh * M) + 'px');
    tw = dw + 'px';
    th = dh + 'px';
    $('.front').css('width', tw).css('height', th);
    $('.back').css('width', tw).css('height', th);
    cells.css('width', tw).css('height', th);
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        left = x * dw;
        top = y * dh;
        $('#cell-' + x + '-' + y).css('left', left + 'px').css('top', top + 'px');
        bgpos = (-left) + 'px ' + (-top) + 'px';
        $('#back-' + x + '-' + y).css('background-position', bgpos);
        $('#front-' + x + '-' + y).css('background-position', bgpos);
      }
    }
    $.each(['-moz-', '-ms-', '-webkit-', ''], function (i, prefix) {
      cells.css(prefix + 'perspective', Math.round(persp * dw) + 'px');
    });
  }


  function clickTile(x, y) {
    turn(x, y);
    moves.push({ x: x, y: y });
    $('#moves').text(moves.length);
    $('button#hint').prop('disabled', true);
    $('button#again').prop('disabled', false);
    setTimeout(checkFinished, 450);
  }


  function drawPuzzle() {
    var x, y, p = $('#puzzle'), cell, fOld, fNew;
    p.empty();
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        fOld = $('<span></span>')
          .attr('id', 'back-' + x + '-' + y)
          .addClass('three-d back')
          .addClass(puzzle[x][y] === 0 ? 'old' : 'new');
        fNew = $('<span></span>')
          .attr('id', 'front-' + x + '-' + y)
          .addClass('three-d front')
          .addClass(puzzle[x][y] === 1 ? 'old' : 'new');
        cell = $('<span></span>')
          .attr('id', 'cell-' + x + '-' + y)
          .addClass('cell')
          .on('click', clickTile.bind(null, x, y))
          .append(fOld)
          .append(fNew);
        p.append(cell);
      }
    }
    resize();
  }


  function clearPuzzle() {
    var x, y;
    puzzle = new Array(N);
    for (x = 0; x < N; ++x) {
      puzzle[x] = new Array(M);
      for (y = 0; y < M; ++y)
        puzzle[x][y] = 1;
    }
  }


  function initPuzzle() {
    var i, f, selected, ones, zeros, nOnes, nZeros;
    clearPuzzle();
    rng.seed(opts.game);
    $('#game-number').text(opts.game);
    ones = middle[opts.difficulty][0].slice(0);  // clone
    zeros = middle[opts.difficulty][1].slice(0); // clone
    // discard half of the ones
    nOnes = ones.length / 2;
    while (ones.length > nOnes)
      ones.splice(rng.next() % ones.length, 1);
    // discard zeros
    nZeros = nTurns - nOnes;
    while (zeros.length > nZeros)
      zeros.splice(rng.next() % zeros.length, 1);
    selected = ones.concat(zeros);
    for (i = 0; i < selected.length; ++i) {
      f = selected[i];
      turn(f % N,  Math.floor(f / N));
    }
    drawPuzzle();
  }


  function newGame(difficulty, num) {
    opts.difficulty = (typeof difficulty === 'number') ? difficulty : opts.difficulty;
    N = difficulties[opts.difficulty].n;
    M = difficulties[opts.difficulty].m;
    nFields = N * M;
    nTurns = nFields / 2;
    nCombinations = nFields.factorial() / (nTurns.factorial() * (nFields - nTurns).factorial());
    opts.game = Math.max(0, Math.min(typeof num === 'number' ? num : Math.floor(Math.random() * nCombinations % 4294967296), 4294967296));
    document.location.hash = $.map(opts, function (value, key) { return key + '=' + value; }).join(';');
    moves = [];
    $('#moves').text(0);
    $('button#again').prop('disabled', true);
    $('button#hint').prop('disabled', false);
    $('table#solution0').empty();
    $('table#solution1').empty();
    initPuzzle();
  }


  function restart() {
    if (confirm('Dieses Puzzle wirklich von vorne beginnen?'))
      newGame(opts.difficulty, opts.game);
  }


  function preloadImages() {
    var IMAGES = ['img/cover0-388.jpg', 'img/cover1-388.jpg', 'img/cover0-582.jpg', 'img/cover1-582.jpg'],
      N = IMAGES.length, loaded = 0, img, i, promise = $.Deferred();
    for (i = 0; i < N; ++i) {
      img = new Image();
      img.onload = function () {
        if (++loaded === N)
          promise.resolve();
      }
      img.src = IMAGES[i];
    }
    return promise;
  }


  function solvePuzzle() {
    var solutions = Solver.solve(puzzle), solution, nSteps,
      s = [$('table#solution0'), $('table#solution1')],
      i, x, y, tr, td;
    for (i = 0; i < solutions.length; ++i) {
      s[i].empty();
      solution = solutions[i];
      for (y = 0; y < M; ++y) {
        tr = $('<tr></tr>');
        for (x = 0; x < N; ++x)
          tr.append($('<td></td>').text((['', 'X'])[solution[x][y]]));
        s[i].append(tr);
      }
      nSteps = solution.reduce(function (prev, curr) { return prev.concat(curr); }).reduce(function (prev, curr, idx, arr) { return prev + curr; }, 0);
      s[i].prepend($('<thead></thead>').append($('<tr></tr>').append($('<td></td>').attr('colspan', N).text(nSteps))));
    }
  }


  function playSolution() {
    var i = 0,
      solutions = Solver.solve(puzzle),
      solution = solutions[0],
      stopped = false,
      playTimerId = null,
      flips = (function() {
        var x, y, moves = [], col;
        for (x = 0; x < N; ++x) {
          col = solution[x];
          for (y = 0; y < M; ++y)
            if (col[y] === 1)
              moves.push({ x: x, y: y });
        }
        return moves;
      })(),
      restoreButtons = function () {
        $('button#solve').text('Lösen').off('click', stop).on('click', playSolution);
        $('button#hint').prop('disabled', false);
        $('button#new-game').prop('disabled', false);
        $('#d-container').prop('disabled', false);
      },
      stop = function () {
        if (playTimerId)
          clearTimeout(playTimerId);
        playTimerId = null;
        stopped = true;
        restoreButtons();
      },
      makeTurn = function () {
        if (stopped) {
          if (playTimerId)
            clearTimeout(playTimerId);
          return;
        }
        if (i < flips.length) {
          turn(flips[i].x, flips[i].y);
          ++i;
          playTimerId = setTimeout(makeTurn, 1000);
        }
        else {
          restoreButtons();
          alert('Gar nicht so schwer, oder? ;-)');
          newGame();
        }
      };
    playTimerId = setTimeout(makeTurn, 250);
    $('button#solve').text('Stopp').off('click', playSolution).on('click', stop);
    $('button#hint').prop('disabled', true);
    $('button#again').prop('disabled', true);
    $('button#new-game').prop('disabled', true);
    $('#d-container').prop('disabled', true);
  }


  function init() {
    var p;
    if (document.location.hash.length > 1) {
      p = document.location.hash.substring(1).split(';');
      $.each(p, function (i, d) {
        var p = d.split('=');
        opts[p[0]] = parseInt(p[1], 10);
      });
    }
    preloadImages()
      .then(function () {
        $('button#solve').on('click', playSolution);
        $('button#hint').on('click', solvePuzzle);
        $('button#again').on('click', restart).prop('disabled', true);
        $('button#new-game').on('click', function () { newGame(parseInt($('#d-container').val(), 10)) });
        newGame(
          typeof opts.difficulty === 'number' ? Math.min(Math.max(opts.difficulty, 0), difficulties.length - 1) : 1,
          typeof opts.game === 'number' ? opts.game : undefined
        );
        $.each(difficulties, function (i, d) {
          $('#d-container').append($('<option></option>').attr('value', i).text(d.d));
        });
        $('#d-container').change(function () {
          var difficulty = parseInt($('#d-container').val(), 10);
          newGame(difficulty);
        }).val(opts.difficulty);
        $(window).resize(resize).trigger('resize');
      });
  }


  $(document).ready(init);

})();
