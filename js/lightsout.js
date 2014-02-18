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
    NUM_STATES = 3,
    IMAGES = (function () {
      var images = [], i = NUM_STATES;
      while (i--) {
        images.push('img/cover' + i + '-582.jpg');
        images.push('img/cover' + i + '-388.jpg');
      }
      return images;
    })(),
    // TODO: Berechnen von `difficulties` anhand von `NUM_STATES`
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
    // TODO: Berechnen von `middle` anhand von `NUM_STATES`
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
    N, M, nFields, nTurns, nCombinations,
    cellW, cellH;


  function flip(x, y) {
    var i, j, cell, m;
    puzzle[x][y] = (puzzle[x][y] + 1) % NUM_STATES;
    for (i = 0; i < NUM_STATES; ++i) {
      cell = $('#pos' + i + '-' + x + '-' + y);
      if (cell.length === 0)
        continue;
      m = cell.attr('class').match(/pos(\d+)/);
      cell.addClass('pos' + ((parseInt(m[1], 10) + 1) % NUM_STATES)).removeClass(m[0]);
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
    var i, x, y, tw, th, persp, cells = $('#puzzle .cell'), left, top;
    if ($(window).width() >= 480) {
      cellW = Math.floor(411 / N);
      cellH = Math.floor(582 / M);
      persp = 2;
    }
    else {
      cellW = Math.floor(274 / N);
      cellH = Math.floor(388 / M);
      persp = 3;
    }
    $('#puzzle').width((cellW * N) + 'px').height((cellH * M) + 'px');
    tw = cellW + 'px';
    th = cellH + 'px';
    for (i = 0; i < NUM_STATES; ++i)
      $('.pos' + i).css('width', tw).css('height', th);
    cells.css('width', tw).css('height', th);
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        left = x * cellW;
        top = y * cellH;
        $('#cell-' + x + '-' + y).css('left', left + 'px').css('top', top + 'px');
        for (i = 0; i < NUM_STATES; ++i)
          $('#pos' + i + '-' + x + '-' + y)
            .css('background-position', (-left) + 'px ' + (-top) + 'px');
      }
    }
    $.each(['-moz-', '-ms-', '-webkit-', ''], function (i, prefix) {
      cells.css(prefix + 'perspective', Math.round(persp * cellW) + 'px');
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
        for (i = 0; i < NUM_STATES; ++i) {
          cell.append($('<span></span>')
            .addClass('three-d')
            .attr('id', 'pos' + i + '-' + x + '-' + y)
            .addClass('pos' + i)
            .addClass('state' + (puzzle[x][y] + i) % NUM_STATES));
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
    // TODO: Berechnen des Startzustandes anhand von `NUM_STATES`
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
    var i = NUM_STATES;
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
    var solutions = Solver.solve(puzzle, NUM_STATES),
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
      solutions = Solver.solve(puzzle, NUM_STATES),
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
    var p;
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
        var i, ii, deg, styles = '', r, a,
          getDeg = function (n, i) {
            return (NUM_STATES > 2)
              ? [i * (NUM_STATES - 2) / NUM_STATES * 360, (i + 1) * (NUM_STATES - 2) / NUM_STATES * 360]
              : [i * 180, (i + 1) * 180];
          };
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
        // generate styles
        a = cellW;
        switch (NUM_STATES) {
          case 0: // fall-through
          case 1: console.error('Are you kidding me?'); return;
          case 2: r = 0; break;
          case 3: r = a / 6 * Math.sqrt(3); break;
          case 4: r = a / 2; break;
          case 5: r = a / 10 * Math.sqrt(25 + 10 * Math.sqrt(5)); break;
          case 6: r = a * Math.sqrt(3) / 2; break;
          default: console.error(NUM_STATES + '-hedrons not implemented.'); return;
        }
        for (i = 0; i < NUM_STATES; ++i) {
          ii = (i + 1) % NUM_STATES;
          deg = getDeg(NUM_STATES, i);
          $('#puzzle').after($('<table class="solution"></table>').attr('id', 'solution' + i));
          styles += '\n'
            + '#solution' + i + ' { left: 0; top: ' + (i * 100) /* XXX: bad for large puzzles */ + 'px; }\n'
            + '.state' + i + ' { background-image: url("img/cover' + i + '-582.jpg"); }\n'
            + '@media screen and (max-width: 480px) { .state' + i + ' { background-image: url("img/cover' + i + '-388.jpg"); } }\n'
            + '.pos' + i + ' {\n'
            + '  -moz-animation: spin-to-pos' + ii + ' ease 0.5s forwards;\n'
            + '  -o-animation: spin-to-pos' + ii + ' ease 0.5s forwards;\n'
            + '  -webkit-animation: spin-to-pos' + ii + ' ease 0.5s forwards;\n'
            + '  animation: spin-to-pos' + ii + ' ease 0.5s forwards;\n'
            + '}\n'
            + '@-moz-keyframes spin-to-pos' + i + ' {\n'
            + '  from {\n'
            + '    -moz-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '    transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '  }\n'
            + '  to {\n'
            + '    -moz-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '    transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '  }\n'
            + '}\n'
            + '@-webkit-keyframes spin-to-pos' + i + ' {\n'
            + '  from {\n'
            + '    -webkit-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '    transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '  }\n'
            + '  to {\n'
            + '    -webkit-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '    transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '  }\n'
            + '}\n'
            + '@keyframes spin-to-pos' + i + ' {\n'
            + '  from {\n'
            + '    -moz-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '    -ms-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '    -o-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '    -webkit-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '    transform: translateZ(' + (-r) + 'px) rotateY(' + deg[0] + 'deg) translateZ(' + r + 'px);\n'
            + '  }\n'
            + '  to {\n'
            + '    -moz-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '    -ms-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '    -o-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '    -webkit-transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '    transform: translateZ(' + (-r) + 'px) rotateY(' + deg[1] + 'deg) translateZ(' + r + 'px);\n'
            + '  }\n'
            + '}\n';
        }
        $('head').append($('<style type="text/css"></style>').text(styles));
      });
  }


  $(document).ready(init);

})();
