/*
    c't Lights Out Puzzle
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


var CTLIGHTSOUT = (function () {
  "use strict";

  var opts = { game: undefined, difficulty: undefined },
    difficulties = [
      { d: 'leicht', n: 3, m: 4 },
      { d: 'mittel', n: 4, m: 5 },
      { d: 'schwer', n: 7, m: 10 }
    ],
    rng = new RNG(),
    puzzle, moves,
    solution, /* TODO: alles damit Zusammenhängende für Finalversion entfernen! */
    N, M, nFields, nTurns, nCombinations;


  function flip(x, y) {
    puzzle[x][y] ^= 0x1;
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


  function checkFinished() {
    var fields = puzzle.reduce(
      function (prev, current) {
        return prev.concat(current);
      }),
      finished = fields.every(function (ele) {
        return ele === 1;
      }) || fields.every(function (ele) {
        return ele === 0;
      });
    if (finished) {
      alert('Juhuuu! Du hast das Puzzle mit ' + moves.length + ' Zügen gelöst!');
      newGame();
    }
  }


  function drawPuzzle() {
    var x, y, p = $('#puzzle'), tr, td, fOld, fNew;
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
          .click(function (x, y) {
            turn(x, y);
            moves.push({ x: x, y: y });
            $('#moves').append('[' + x + ',' + y + '] ');
            $('button#hint').prop('disabled', true);
            $('button#again').prop('disabled', false);
            setTimeout(checkFinished, 100);
          }.bind(null, x, y))
          .append(fOld)
          .append(fNew);
        tr.append(td);
      }
      p.append(tr);
    }
  }


  function clearPuzzle() {
    var x, y;
    puzzle = new Array(N);
    for (x = 0; x < N; ++x) {
      puzzle[x] = new Array(M);
      for (y = 0; y < M; ++y)
        puzzle[x][y] = 0x1;
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
    $('#moves').empty();
    initPuzzle();
    $('button#again').prop('disabled', true);
    $('button#hint').prop('disabled', false)
      .click(function () {
        var i, f;
        for (i = 0; i < solution.length; ++i) {
          f = solution[i];
          $('#back-' + f.x + '-' + f.y).toggleClass('hint');
          $('#front-' + f.x + '-' + f.y).toggleClass('hint');
        }
      });
  }


  function restart() {
    if (confirm('Dieses Puzzle wirklich von vorne beginnen?'))
      newGame(opts.difficulty, opts.game);
  }


  return {
    init: function () {
      var p;
      if (document.location.hash.length > 1) {
        p = document.location.hash.substring(1).split(';');
        $.each(p, function (i, d) {
          var p = d.split('=');
          opts[p[0]] = parseInt(p[1], 10);
        });
      }
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
    }
  };

})();
