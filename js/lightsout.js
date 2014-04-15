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

/* extern */ var Solver;

(function () {
  "use strict";
  var RNG = function (seed) {
    if (typeof seed !== 'number')
      seed = Date.now();
    this.seed(seed);
  };
  RNG.MAX_VALUE = 4294967296;
  RNG.prototype.seed = function (seed) {
    if (typeof seed !== 'number')
      throw new TypeError('Parameter `seed` must be a number');
    this._X = seed;
  };
  RNG.prototype.next = function () {
    // LCG from the book 'Numerical Recipes'
    this._X = (1664525 * this._X + 1013904223) % RNG.MAX_VALUE;
    return this._X;
  };

  Number.prototype.factorial = function () {
    var x = 1, i;
    for (i = 2; i <= this; ++i)
      x *= i;
    return x;
  };

  Number.prototype.clamp = function (lo, hi) {
    return Math.min(Math.max(this, lo), hi);
  };

  Array.prototype.clone = function () {
    return this.slice(0);
  };

  var opts = { game: undefined, difficulty: undefined, n: 2 },
    PREFIXES = ['', '-moz-', '-ms-', '-o-', '-webkit-'],
    MAX_STATES = 6,
    DIFFICULTIES = [
      {
        d: 'leicht', n: 3, m: 4, mid: [
        [1, 1, 1],
        [1, 0, 1],
        [1, 0, 1],
        [1, 1, 1]
        ]
      },
      {
        d: 'schwer', n: 4, m: 5, mid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1],
        [0, 0, 0, 0]
        ]
      },
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
        ]
      }
    ],
    indexesByValue = function (arr, v) {
      return arr.reduce(function (prev, curr) { return prev.concat(curr); })
        .map(function (curr, idx, arr) { return (curr === v) ? idx : null; })
        .filter(function (val) { return val !== null; });
    },
    MIDDLE = [
      {
        0: indexesByValue(DIFFICULTIES[0].mid, 0),
        1: indexesByValue(DIFFICULTIES[0].mid, 1)
      },
      {
        0: indexesByValue(DIFFICULTIES[1].mid, 0),
        1: indexesByValue(DIFFICULTIES[1].mid, 1)
      },
      {
        0: indexesByValue(DIFFICULTIES[2].mid, 0),
        1: indexesByValue(DIFFICULTIES[2].mid, 1)
      }
    ],
    rng = new RNG(),
    puzzle, moves,
    N, M, nFields, nTurns,
    cellW, cellH;


  function flip(x, y) {
    var state, cell, m;
    puzzle[x][y] = (puzzle[x][y] + 1) % opts.n;
    for (state = 0; state < opts.n; ++state) {
      cell = $('#pos' + state + '-' + x + '-' + y);
      if (cell.length > 0) {
        m = cell.attr('class').match(/pos(\d+)/);
        cell
          .removeClass(m[0])
          .addClass('pos' + ((parseInt(m[1], 10) + 1) % opts.n));
      }
    }
  }


  function turn(x, y) {
    flip(x, y);
    if (y > 0) flip(x, y - 1);
    if (y + 1 < M) flip(x, y + 1);
    if (x > 0) flip(x - 1, y);
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
    for (i = 0; i < opts.n; ++i)
      $('.pos' + i).css('width', tw).css('height', th);
    cells.css('width', tw).css('height', th);
    // cells.css('overflow', opts.n > 4 ? 'hidden' : 'visible');
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        left = x * cellW;
        top = y * cellH;
        $('#cell-' + x + '-' + y).css('left', left + 'px').css('top', top + 'px');
        for (i = 0; i < opts.n; ++i)
          $('#pos' + i + '-' + x + '-' + y)
            .css('background-position', (-left) + 'px ' + (-top) + 'px');
      }
    }
    PREFIXES.forEach(function (prefix) {
      cells.css(prefix + 'perspective', Math.round(persp * cellW) + 'px');
    });
  }


  function clickTile(x, y) {
    turn(x, y);
    moves.push({ x: x, y: y });
    $('#moves').text(moves.length);
    $('#again').prop('disabled', false);
    setTimeout(checkFinished, 250);
    if ($('#solution').css('display') === 'block')
      solvePuzzle();
  }


  function drawPuzzle() {
    var x, y, state, p = $('#puzzle'), cell;
    p.empty();
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        cell = $('<span></span>')
          .attr('id', 'cell-' + x + '-' + y)
          .addClass('cell')
          .on('click', clickTile.bind(null, x, y));
        for (state = 0; state < opts.n; ++state) {
          cell.append($('<span></span>')
            .addClass('three-d')
            .attr('id', 'pos' + state + '-' + x + '-' + y)
            .addClass('pos' + state)
            .addClass('state' + (opts.n - puzzle[x][y] + state) % opts.n));
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
        puzzle[x][y] = 0;
    }
  }


  function initPuzzle() {
    var i, f, ones, zeros, nOnes, nZeros;
    clearPuzzle();
    rng.seed(opts.game);
    $('#game-number').text(opts.game);
    if (opts.n === 2) {
      ones = MIDDLE[opts.difficulty][0].clone();
      zeros = MIDDLE[opts.difficulty][1].clone();
      // die Hälfte der 1-Felder wegwerfen
      nOnes = ones.length / 2;
      while (ones.length > nOnes)
        ones.splice(rng.next() % ones.length, 1);
      // so viel 0-Felder wegwerfen, dass die
      // gewünschte Anzahl von Zügen übrig bleibt
      nZeros = nTurns - nOnes;
      while (zeros.length > nZeros)
        zeros.splice(rng.next() % zeros.length, 1);
      ones.concat(zeros).forEach(function (val) {
        turn(val % N, Math.floor(val / N));
      });
    }
    else {
      i = nTurns;
      while (i-- > 0) {
        f = rng.next() % nFields;
        turn(f % N, Math.floor(f / N));
      }
    }
    drawPuzzle();
  }


  function newGame(difficulty, num) {
    $('#solution').empty().css('display', 'none');
    opts.game = (typeof num === 'number') ? num : Math.floor(Math.random() * RNG.MAX_VALUE);
    opts.difficulty = (typeof difficulty === 'number') ? difficulty : opts.difficulty;
    N = DIFFICULTIES[opts.difficulty].n;
    M = DIFFICULTIES[opts.difficulty].m;
    nFields = N * M;
    nTurns = nFields / 2;
    document.location.hash = $.map(opts, function (value, key) { return key + '=' + value; }).join(';');
    moves = [];
    $('#moves').text(moves.length);
    $('#again').prop('disabled', true);
    $('#hint').prop('disabled', false);
    initPuzzle();
  }


  function restart() {
    if (confirm('Dieses Puzzle wirklich von vorne beginnen?'))
      newGame(opts.difficulty, opts.game);
  }


  function preloadImages() {
    var IMAGES = (function () {
      var images = [], i = opts.n;
      while (i--) {
        images.push('img/cover' + i + '-582.jpg');
        images.push('img/cover' + i + '-388.jpg');
      }
      return images;
    })(),
    N = IMAGES.length, i = IMAGES.length,
    loaded = 0, img, promise = $.Deferred();
    function checkLoaded() {
      if (++loaded === N)
        promise.resolve();
    }
    function error() {
      console.error('image not found');
    }
    while (i--) {
      img = new Image();
      img.onload = checkLoaded;
      img.onerror = error;
      img.src = IMAGES[i];
    }
    return promise;
  }


  function solvePuzzle() {
    var solutions = Solver.solve(puzzle, opts.n),
      solution, nSteps, table = $('#solution'),
      x, y, tr, td, i = solutions.length;
    table.empty().css('display', 'block');
    function concatenate(p, c) { return p.concat(c); }
    function summarize(p, c) { return p + c; }
    while (i--) {
      solution = solutions[i];
      nSteps = solution.reduce(concatenate).reduce(summarize, 0);
      tr = $('<tr></tr>')
        .append($('<td title="Schritte zur Lösung"></td>')
        .attr('colspan', N)
        .addClass('steps')
        .text(nSteps));
      table.append(tr);
      for (y = 0; y < M; ++y) {
        tr = $('<tr></tr>');
        for (x = 0; x < N; ++x)
          tr.append($('<td></td>')
            .text(solution[x][y]).attr('title', x + ',' + y));
        table.append(tr);
      }
    }
  }


  function playSolution() {
    var i = 0,
      solutions = Solver.solve(puzzle, opts.n),
      solution = solutions[0],
      stopped = false,
      flips = (function () {
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
        $('#difficulties').prop('disabled', false);
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
          if ($('#solution').css('display') === 'block')
            solvePuzzle();
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
    $('#difficulties').prop('disabled', true);
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
    opts.n = opts.n.clamp(2, MAX_STATES);
    DIFFICULTIES.forEach(function (val, idx) {
      $('#difficulties').append($('<option></option>').attr('value', idx).text(val.d));
    });
    preloadImages()
      .then(function () {
        $('#solve').on('click', playSolution);
        $('#hint').on('click', solvePuzzle);
        $('#again').on('click', restart).prop('disabled', true);
        $('#difficulties').on('change', function () {
          newGame(parseInt($('#difficulties').val(), 10));
        });
        $('#new-game').on('click', function () {
          newGame(parseInt($('#difficulties').val(), 10));
        });
        newGame(
          typeof opts.difficulty === 'number' ? opts.difficulty.clamp(0, DIFFICULTIES.length - 1) : 1,
          typeof opts.game === 'number' ? opts.game.clamp(0, RNG.MAX_VALUE) : undefined
        );
        $('#difficulties').val(opts.difficulty);
        $('#puzzle').after($('<table></table>').attr('id', 'solution'));
        $(window).on('resize', resize);
        resize();
        (function generateStyles() {
          var state, state2, styles = '',
            n = opts.n, a = cellW, deg1, deg2,
            d = (n > 2) ? a / (2 * Math.tan(Math.PI / n)) : 3,
            t1 = 'translateZ(' + (-d) + 'px) ',
            t2 = ' translateZ(' + d + 'px)';
          for (state = 0; state < n; ++state) {
            state2 = (state + 1) % n;
            deg1 = state * 360 / n;
            deg2 = (state + 1) * 360 / n;
            styles += '\n' +
              '.state' + state + ' { background-image: url("img/cover' + state + '-582.jpg"); }\n' +
              '@media screen and (max-width: 480px) { .state' + state + ' { background-image: url("img/cover' + state + '-388.jpg"); } }\n' +
              '.pos' + state + ' {\n' +
              PREFIXES.map(function (prefix) {
                return prefix + 'animation: spin-to-pos' + state2 + ' ease 0.5s forwards;'
              }).join('\n') +
              '}\n' +
              PREFIXES.map(function (prefix) {
                return '@' + prefix + 'keyframes spin-to-pos' + state + ' {\n' +
                  '  from { ' + prefix + 'transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + '; }\n' +
                  '  to { ' + prefix + 'transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + '; }\n' +
                  '}';
              }).join('\n');
          }
          $('head').append($('<style type="text/css"></style>').text(styles));
        })();
      });
  }


  $(document).ready(init);

})();
