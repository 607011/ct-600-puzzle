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
  // LCG (from the book 'Numerical Recipes')
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

  var rng = new RNG(),
    puzzle, moves, solution,
    N = 4, M = 5,
    nFields = N * M,
    nTurns = nFields / 2,
    nCombinations = nFields.factorial() / (nTurns.factorial() * (nFields - nTurns).factorial()),
    gameNum;


  function flip(x, y) {
    puzzle[x][y] ^= 0x1;
    $('#new-' + x + '-' + y).toggleClass('front').toggleClass('back');
    $('#old-' + x + '-' + y).toggleClass('front').toggleClass('back');
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


  function solvePuzzle() {
    var i, f;
    for (i = 0; i < solution.length; ++i) {
      f = solution[i];
      turn(f.x, f.y);
    }
  }


  function drawPuzzle() {
    var x, y, p = $('#puzzle'), tr, td, fOld, fNew;
    p.empty();
    for (y = 0; y < M; ++y) {
      tr = $('<tr></tr>');
      for (x = 0; x < N; ++x) {
        fOld = $('<span></span>')
          .text(puzzle[x][y] ^ 1)
          .attr('id', 'old-' + x + '-' + y)
          .addClass('three-d back')
        fNew = $('<span></span>')
          .text(puzzle[x][y])
          .attr('id', 'new-' + x + '-' + y)
          .addClass('three-d front')
        td = $('<td></td>')
          .click(function (x, y) {
            turn(x, y);
            moves.push({ x: x, y: y });
            $('#moves').append('[' + x + ',' + y + '] ');
            $('button#hint').prop('disabled', true);
            checkFinished();
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
      restart();
    }
  }


  function initPuzzle() {
    var f, x, y, i, selected;

    clearPuzzle();
    rng.seed(gameNum);
    $('#game-number').text(gameNum);
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


  function restart() {
    moves = [];
    $('#moves').empty();
    initPuzzle();
    $('button#hint')
      .prop('disabled', false)
      .click(function () {
        var i, f;
        for (i = 0; i < solution.length; ++i) {
          f = solution[i];
          $('#old-' + f.x + '-' + f.y).addClass('hint');
          $('#new-' + f.x + '-' + f.y).addClass('hint');
        }
      });
  }


  return {
    init: function () {
      $('button#new-game').click(function () {
        gameNum = Math.floor(Math.random() * nCombinations);
        document.location.hash = '#' + gameNum;
        restart();
      });
      gameNum = (document.location.hash) ? parseInt(document.location.hash.substring(1), 10) : Math.floor(Math.random() * nCombinations);
      restart();
    }
  };

})();
