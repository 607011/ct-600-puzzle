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

Number.prototype.factorial = function () {
  var x = 1, i;
  for (i = 2; i <= this; ++i)
    x *= i;
  return x;
};


var Solver = (function () {
  "use strict";
  /// Original solver by Norio Kato, http://www.ueda.info.waseda.ac.jp/~n-kato/lightsout/ 
  /// Modified 2014 by Oliver Lau <ola@ct.de>
  var mat,        // integer[i][j]
    cols,         // integer[]
    m,            // count of rows of the matrix
    n,            // count of columns of the matrix
    np,           // count of columns of the enlarged matrix
    r,            // minimum rank of the matrix
    maxr,         // maximum rank of the matrix
    nStates = 2,  // number of states: 0 or 1
    N, M, cells;  // integer[N][M], current states of tiles

  function a(i, j) {
    return mat[i][cols[j]];
  }

  function setmat(i, j, val) {
    mat[i][cols[j]] = modulate(val);
  }

  function modulate(x) {
    if (x >= 0)
      return x % nStates;
    x = (-x) % nStates;
    if (x === 0)
      return 0;
    return nStates - x;
  }

  function gcd(x, y) {
    if (y === 0)
      return x;
    if (x === y)
      return x;
    if (x > y)
      x = x % y;
    while (x > 0) {
      y = y % x;
      if (y === 0)
        return x;
      x = x % y;
    }
    return y;
  }

  function invert(value) {
    var seed, a = 1, b = 0, c = 0, d = 1, x, y = nStates, tmp;
    if (value <= 1)
      return value;
    x = value;
    seed = gcd(value, nStates);
    if (seed !== 1)
      return 0;
    while (x > 1) {
      tmp = Math.floor(y / x);
      y -= x * tmp;
      c -= a * tmp;
      d -= b * tmp;
      tmp = a; a = c; c = tmp;
      tmp = b; b = d; d = tmp;
      tmp = x; x = y; y = tmp;
    }
    return a;
  }

  function initMatrix() {
    var x, y, i, j, line;
    maxr = Math.min(m, n);
    mat = new Array();
    for (x = 0; x < N; ++x)
      for (y = 0; y < M; ++y) {
        i = y * N + x;
        line = new Array();
        mat[i] = line;
        for (j = 0; j < n; ++j)
          line[j] = 0;
        line[i] = 1;
        if (x > 0)
          line[i - 1] = 1;
        if (y > 0)
          line[i - N] = 1;
        if (x < N - 1)
          line[i + 1] = 1;
        if (y < M - 1)
          line[i + N] = 1;
      }
    cols = new Array();
    for (j = 0; j < np; ++j)
      cols[j] = j;
  }

  function solvedProblem(goal) {
    var size = N * M, x, y;
    m = size;
    n = size;
    np = n + 1;
    initMatrix();
    for (x = 0; x < N; ++x)
      for (y = 0; y < M; ++y)
        mat[y * N + x][n] = modulate(goal - cells[x][y]);
    return sweep();
  }

  function sweep() {
    for (r = 0; r < maxr; r++) {
      if (!sweepStep())
        return false;
      if (r === maxr)
        break;
    }
    return true;
  }

  function sweepStep() {
    var i, j, finished = true, inv, aij, jj;
    for (j = r; j < n; ++j) {
      for (i = r; i < m; ++i) {
        aij = a(i, j);
        if (aij !== 0)
          finished = false;
        inv = invert(aij);
        if (inv !== 0) {
          for (jj = r; jj < np; ++jj)
            setmat(i, jj, a(i, jj) * inv);
          doBasicSweep(i, j);
          return true;
        }
      }
    }
    if (finished) {
      maxr = r;
      for (j = n; j < np; ++j)
        for (i = r; i < m; ++i)
          if (a(i, j) != 0)
            return false;
      return true;
    }
    return false;
  }

  function swap(array, x, y) {
    var tmp = array[x];
    array[x] = array[y];
    array[y] = tmp;
  }

  function doBasicSweep(pivoti, pivotj) {
    var i, j, air;
    if (r !== pivoti)
      swap(mat, r, pivoti);
    if (r !== pivotj)
      swap(cols, r, pivotj);
    for (i = 0; i < m; ++i) {
      if (i !== r) {
        var air = a(i, r);
        if (air !== 0)
          for (j = r; j < np; ++j)
            setmat(i, j, a(i, j) - a(r, j) * air);
      }
    }
  }
  function solved() {
    var i, j, x, y, solution, solutions = [], goal, anscols, value;
    for (goal = 0; goal < nStates; goal++) {
      solution = new Array(N);
      for (i = 0; i < N; ++i)
        solution[i] = new Array(M);
      if (solvedProblem(goal)) {
        anscols = new Array();
        for (j = 0; j < n; ++j)
          anscols[cols[j]] = j;
        for (x = 0; x < N; ++x) {
          for (y = 0; y < M; ++y) {
            j = anscols[y * N + x];
            value = (j < r) ? a(j, n) : '';
            solution[x][y] = a(j, n);
          }
        }
        solutions.push(solution);
      }
    }
    return solutions;
  }  return {
    solve: function (puzzle) {
      cells = puzzle;
      N = cells.length;
      M = cells[0].length;
      return solved();
    }
  }
})();



(function () {
  "use strict";

  var opts = { game: null, difficulty: null },
    difficulties = [
      { d: 'leicht', n: 3, m: 4 },
      { d: 'schwer', n: 4, m: 5 },
      { d: 'extrem', n: 7, m: 10 }
    ],
    rng = new RNG(),
    puzzle, moves,
    solution, /* TODO: alles damit Zusammenhängende für Finalversion entfernen! */
    N, M, nFields, nTurns, nCombinations;


  function flip(x, y) {
    puzzle[x][y] ^= 1;
    $('#back-' + x + '-' + y).toggleClass('front').toggleClass('back');
    $('#front-' + x + '-' + y).toggleClass('front').toggleClass('back');
  }


  function turn(x, y) {
    var above = y - 1,
      below = y + 1,
      left = x - 1,
      right = x + 1;
    flip(x, y);
    if (above >= 0)
      flip(x, above);
    if (below < M)
      flip(x, below);
    if (left >= 0)
      flip(left, y);
    if (right < N)
      flip(right, y);
  }


  function allTheSame() {
    var sample = puzzle[0][0], x, y;
    for (x = 0; x < N; ++x)
      for (y = 0; y < M; ++y)
        if (puzzle[x][y] !== sample)
          return false;
    return true;
  }


  function checkFinished() {
    if (allTheSame()) {
      alert('Juhuuu! Du hast das Puzzle mit ' + moves.length + ' Zügen gelöst!');
      newGame();
    }
  }


  function resize() {
    var x, y, dw, dh, tw, th, persp, bgpos, cells = $('table#puzzle td');
    if ($(window).width() >= 480) {
      dw = 411 / N;
      dh = 582 / M;
      persp = 2;
    }
    else {
      dw = 274 / N;
      dh = 388 / M;
      persp = 3;
    }
    tw = Math.floor(dw) + 'px';
    th = Math.floor(dh) + 'px';
    $('.front').css('width', tw).css('height', th);
    $('.back').css('width', tw).css('height', th);
    cells.css('width', tw).css('height', th);
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        bgpos = Math.floor(-x * dw) + 'px ' + Math.floor(-y * dh) + 'px';
        $('#back-' + x + '-' + y).css('background-position', bgpos);
        $('#front-' + x + '-' + y).css('background-position', bgpos);
      }
    }
    $.each(['-moz-', '-ms-', '-webkit-', ''], function (i, prefix) {
      cells.css(prefix + 'perspective', Math.floor(persp * dw) + 'px');
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
    var x, y, p = $('table#puzzle'), tr, td, fOld, fNew;
    p.empty();
    for (y = 0; y < M; ++y) {
      tr = $('<tr></tr>');
      for (x = 0; x < N; ++x) {
        fOld = $('<span></span>')
          .attr('id', 'back-' + x + '-' + y)
          .addClass('three-d back')
          .addClass(puzzle[x][y] === 0 ? 'old' : 'new');
        fNew = $('<span></span>')
          .attr('id', 'front-' + x + '-' + y)
          .addClass('three-d front')
          .addClass(puzzle[x][y] === 1 ? 'old' : 'new');
        td = $('<td></td>')
          .click(clickTile.bind(null, x, y))
          .append(fOld)
          .append(fNew);
        tr.append(td);
      }
      p.append(tr);
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
    var f, x, y, i, selected;
    clearPuzzle();
    rng.seed(opts.game);
    $('#game-number').text(opts.game);
    selected = [];
    solution = [];
    i = nTurns;
    while (i > 0) {
      f = rng.next() % nFields;
      if (selected.indexOf(f) < 0) {
        selected.push(f);
        x = f % N;
        y = Math.floor(f / N);
        turn(x, y);
        solution.push({ x: x, y: y });
        --i;
      }
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


  function preloadImages(callback) {
    var IMAGES = ['img/cover0-388.jpg', 'img/cover1-388.jpg', 'img/cover0-582.jpg', 'img/cover1-582.jpg'],
      N = IMAGES.length, loaded = 0, img, i;
    for (i = 0; i < N; ++i) {
      img = new Image();
      img.onload = function () {
        if (++loaded === N)
          callback.call();
      }
      img.src = IMAGES[i];
    }
  }


  function init() {
    preloadImages(function () {
      var p;
      if (document.location.hash.length > 1) {
        p = document.location.hash.substring(1).split(';');
        $.each(p, function (i, d) {
          var p = d.split('=');
          opts[p[0]] = parseInt(p[1], 10);
        });
      }
      $('button#solve').click(function () {
        var solution, solutions = Solver.solve(puzzle), nSteps,
          s = [$('table#solution0'), $('table#solution1')],
          i, x, y, tr, td;
        for (i = 0; i < solutions.length; ++i) {
          s[i].empty();
          solution = solutions[i];
          for (y = 0; y < M; ++y) {
            tr = $('<tr></tr>');
            for (x = 0; x < N; ++x)
              tr.append($('<td></td>').text((['','X'])[solution[x][y]]));
            s[i].append(tr);
          }
          nSteps = solution.reduce(function (prev, curr) { return prev.concat(curr); }).reduce(function(prev, curr, idx, arr) { return prev + curr; }, 0);
          s[i].prepend($('<thead></thead>').append($('<tr></tr>').append($('<td></td>').attr('colspan', N).text(nSteps))));
        }
      });
      $('button#hint').click(function () {
        var i, f;
        for (i = 0; i < solution.length; ++i) {
          f = solution[i];
          $('#back-' + f.x + '-' + f.y).toggleClass('hint');
          $('#front-' + f.x + '-' + f.y).toggleClass('hint');
        }
      });
      $('button#again').click(restart).prop('disabled', true);
      $('button#new-game').click(function () { newGame(parseInt($('#d-container').val(), 10)) });
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
