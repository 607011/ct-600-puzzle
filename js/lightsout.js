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
  RNG.MAX_VALUE = 4294967296;
  RNG.prototype.seed = function (seed) {
    if (typeof seed !== 'number')
      throw new TypeError('Parameter `seed` must be a number');
    this.X = seed;
  };
  RNG.prototype.next = function () {
    // LCG from the book 'Numerical Recipes'
    this.X = (1664525 * this.X + 1013904223) % RNG.MAX_VALUE;
    return this.X;
  };

  var opts = { game: null, difficulty: null },
    Positions = ['pos0', 'pos1'],
    nPositions = Positions.length,
    States = ['state0', 'state1'],
    nStates = States.length,
    IMAGES = (function () {
      var images = [], i = nStates;
      while (i--) {
        images.push('img/cover' + i + '-582.jpg');
        images.push('img/cover' + i + '-388.jpg');
      }
      return images;
    })(),
    difficulties = [
      { d: 'leicht', n: 3, m: 4, mid: [
        [1, 1, 1],
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 1]
      ] },
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
    N, M, nFields, nTurns, nCombinations;


  if (nPositions !== nStates)
    console.error('`nPositions` must equal `nStates`');


  function flip(x, y) {
    var i, j, cell;
    puzzle[x][y] = (puzzle[x][y] + 1) % nStates;
    for (i = 0; i < nPositions; ++i) {
      cell = $('#' + Positions[i] + '-' + x + '-' + y);
      for (j = 0; j < nPositions; ++j)
        cell.toggleClass(Positions[j]);
    }
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
    var i, x, y, dw, dh, tw, th, persp, cells = $('#puzzle .cell'), left, top;
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
    for (i = 0; i < nPositions; ++i)
      $('.' + Positions[i]).css('width', tw).css('height', th);
    cells.css('width', tw).css('height', th);
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        left = x * dw;
        top = y * dh;
        $('#cell-' + x + '-' + y).css('left', left + 'px').css('top', top + 'px');
        for (i = 0; i < nPositions; ++i)
          $('#' + Positions[i] + '-' + x + '-' + y)
            .css('background-position', (-left) + 'px ' + (-top) + 'px');
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
    $('#hint').prop('disabled', true);
    $('#again').prop('disabled', false);
    setTimeout(checkFinished, 250);
  }


  function drawPuzzle() {
    var x, y, i, p = $('#puzzle'), cell;
    p.empty();
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        cell = $('<span></span>')
          .attr('id', 'cell-' + x + '-' + y)
          .addClass('cell')
          .on('click', clickTile.bind(null, x, y));
        for (i = 0; i < nPositions; ++i) {
          cell.append($('<span></span>')
            .addClass('three-d')
            .attr('id', Positions[i] + '-' + x + '-' + y)
            .addClass(Positions[i])
            .addClass(States[(puzzle[x][y] + i) % nStates]));
        }
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
    var i = nStates;
    while (i--)
      $('#solution' + i).empty();
    opts.difficulty = (typeof difficulty === 'number') ? difficulty : opts.difficulty;
    N = difficulties[opts.difficulty].n;
    M = difficulties[opts.difficulty].m;
    nFields = N * M;
    nTurns = nFields / 2;
    nCombinations = nFields.factorial() / (nTurns.factorial() * (nFields - nTurns).factorial());
    opts.game = Math.max(0, Math.min(typeof num === 'number' ? num : Math.floor(Math.random() * nCombinations % RNG.MAX_VALUE), RNG.MAX_VALUE));
    document.location.hash = $.map(opts, function (value, key) { return key + '=' + value; }).join(';');
    moves = [];
    $('#moves').text(0);
    $('#again').prop('disabled', true);
    $('#hint').prop('disabled', false);
    initPuzzle();
  }


  function restart() {
    if (confirm('Dieses Puzzle wirklich von vorne beginnen?'))
      newGame(opts.difficulty, opts.game);
  }


  function preloadImages() {
    var N = IMAGES.length, i = IMAGES.length, loaded = 0,
      img, promise = $.Deferred();
    while (i--) {
      img = new Image();
      img.onload = function () {
        if (++loaded === N)
          promise.resolve();
      };
      img.src = IMAGES[i];
    }
    return promise;
  }


  function solvePuzzle() {
    var solutions = Solver.solve(puzzle, nStates),
      solution, nSteps,
      s = (function() { 
        var sol = [], i = solutions.length;
        while (i--)
          sol.push($('#solution' + i));
        return sol;
      })(),
      x, y, tr, td, i = solutions.length;
    while (i--) {
      s[i].empty();
      solution = solutions[i];
      for (y = 0; y < M; ++y) {
        tr = $('<tr></tr>');
        for (x = 0; x < N; ++x)
          tr.append($('<td></td>').text(solution[x][y]));
        s[i].append(tr);
      }
      nSteps = solution.reduce(function (prev, curr) { return prev.concat(curr); }).reduce(function (prev, curr, idx, arr) { return prev + curr; }, 0);
      s[i].prepend($('<thead></thead>').append($('<tr></tr>').append($('<td></td>').attr('colspan', N).text(nSteps))));
    }
  }


  function playSolution() {
    var i = 0,
      solutions = Solver.solve(puzzle, nStates),
      solution = solutions[0],
      stopped = false,
      flips = (function() {
        var x, y, n, moves = [];
        for (y = 0; y < M; ++y)
          for (x = 0; x < N; ++x) {
            n = solution[x][y];
            while (n-- > 0)
              moves.push({ x: x, y: y });
          }
        return moves;
      })(),
      restoreButtons = function () {
        $('#solve').text('Lösen').off('click', stop).on('click', playSolution);
        $('#hint').prop('disabled', false);
        $('#new-game').prop('disabled', false);
        $('#d-container').prop('disabled', false);
      },
      stop = function () {
        stopped = true;
        restoreButtons();
      },
      makeTurn = function () {
        if (stopped)
          return;
        if (i < flips.length) {
          turn(flips[i].x, flips[i].y);
          ++i;
          setTimeout(makeTurn, 1000);
        }
        else {
          restoreButtons();
          alert('Gar nicht so schwer, oder? ;-)');
          newGame();
        }
      };
    setTimeout(makeTurn, 250);
    $('#solve').text('Stopp').off('click', playSolution).on('click', stop);
    $('#hint').prop('disabled', true);
    $('#again').prop('disabled', true);
    $('#new-game').prop('disabled', true);
    $('#d-container').prop('disabled', true);
  }


  function init() {
    var p, i = nStates;
    while (i--)
      $('#puzzle').after($('<table></table>').attr('id', 'solution' + i).addClass('solution'));
    if (document.location.hash.length > 1) {
      p = document.location.hash.substring(1).split(';');
      $.each(p, function (i, d) {
        var p = d.split('=');
        opts[p[0]] = parseInt(p[1], 10);
      });
    }
    $.each(difficulties, function (i, d) {
      $('#d-container').append($('<option></option>').attr('value', i).text(d.d));
    });
    preloadImages()
      .then(function () {
        $('#solve').on('click', playSolution);
        $('#hint').on('click', solvePuzzle);
        $('#again').on('click', restart).prop('disabled', true);
        $('#d-container').on('change', function () {
          newGame(parseInt($('#d-container').val(), 10));
        });
        $('#new-game').on('click', function () {
          newGame(parseInt($('#d-container').val(), 10))
        });
        newGame(
          typeof opts.difficulty === 'number' ? Math.min(Math.max(opts.difficulty, 0), difficulties.length - 1) : 1,
          typeof opts.game === 'number' ? opts.game : undefined
        );
        $('#d-container').val(opts.difficulty);
        $(window).resize(resize).trigger('resize');
      });
  }


  $(document).ready(init);

})();
