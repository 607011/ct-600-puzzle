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
  var opts = { game: null, difficulty: null, n: 2 },
    difficulties = [      { d: 'leicht', n: 3, m: 4 },      { d: 'schwer', n: 4, m: 5 },      { d: 'extrem', n: 7, m: 10 }
    ],
    puzzle, moves,
    N, M, nFields, nTurns, nCombinations,
    cellW, cellH;


  function flip(x, y) {
    var i, j, cell, m;
    puzzle[x][y] = (puzzle[x][y] + 1) % opts.n;
    for (i = 0; i < opts.n; ++i) {
      cell = $('#pos' + i + '-' + x + '-' + y);
      if (cell.length === 0)
        continue;
      m = cell.attr('class').match(/pos(\d+)/);
      cell.removeClass(m[0]).addClass('pos' + ((parseInt(m[1], 10) + 1) % opts.n));
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
    if ($('#main').width() >= 480) {
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
    cells.css('width', tw).css('height', th).css('overflow', opts.n > 4 ? 'hidden' : 'visible');
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
    $.each(['-moz-', '-ms-', '-webkit-', ''], function (i, prefix) {
      cells.css(prefix + 'perspective', Math.round(persp * cellW) + 'px');
    });
  }


  function clickTile(x, y) {
    turn(x, y);
    moves.push({ x: x, y: y });
    $('#moves').text(moves.length);
    $('#again').prop('disabled', false);
    checkFinished();
  }


  function drawPuzzle() {
    var x, y, i, p = $('#puzzle'), cell;
    for (y = 0; y < M; ++y) {
      for (x = 0; x < N; ++x) {
        cell = $('<span></span>')
          .attr('id', 'cell-' + x + '-' + y)
          .addClass('cell')
          .on('click', clickTile.bind(null, x, y));
        for (i = 0; i < opts.n; ++i) {
          cell.append($('<span></span>')
            .addClass('three-d')
            .attr('id', 'pos' + i + '-' + x + '-' + y)
            .addClass('pos' + i)
            .addClass('state' + (opts.n - puzzle[x][y] + i) % opts.n));
        }
        p.append(cell);
      }
    }
    resize();
  }


  function loadPuzzle(game) {
    $.ajax({
      url: 'ajax/puzzle.php',
      type: 'GET',
      accepts: 'json',
      data: {
        game: game,
        difficulty: opts.difficulty
      }
    }).done(function (data) {
      opts.game = data.game;
      puzzle = data.puzzle;
      $('#game-number').text(opts.game);
      drawPuzzle();
    }).error(function (e) {
      console.log(e);
    });
  }


  function newGame(game) {
    opts.game = (typeof game === 'number') ? game : Math.floor(Math.random() * nCombinations);
    opts.difficulty = parseInt($('#d-container').val(), 10);
    N = difficulties[opts.difficulty].n;
    M = difficulties[opts.difficulty].m;
    nFields = N * M;
    nTurns = nFields / 2;
    nCombinations = nFields.factorial() / (nTurns.factorial() * (nFields - nTurns).factorial());    moves = [];
    $('#moves').text(0);
    $('#again').prop('disabled', true);
    $('#puzzle').empty().append($('<span class="loader"></span>'));
    loadPuzzle();
  }


  function restart() {
    if (confirm('Dieses Puzzle wirklich von vorne beginnen?'))
      newGame(opts.game);
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


  function init() {
    $.each(difficulties, function (i, d) {
      $('#d-container').append($('<option></option>').attr('value', i).text(d.d));
    });
    preloadImages()
      .then(function () {
        $('#again').on('click', restart).prop('disabled', true);
        $('#d-container').on('change', function () {
          newGame(parseInt($('#d-container').val(), 10));
        });
        $('#new-game').on('click', function () {
          newGame(parseInt($('#d-container').val(), 10));
        });
        newGame(typeof opts.difficulty === 'number' ? opts.difficulty.clamp(0, difficulties.length - 1) : 1);
        $('#d-container').val(opts.difficulty);
        $(window).on('resize', resize);
        resize();
        (function generateStyles () {
          var i, ii, styles = '',
            n = opts.n, a = cellW, deg1, deg2,
            r = (n > 2) ? a / (2 * Math.tan(Math.PI / n)) : 0,
            t1 = (n > 2) ? ('translateZ(' + (-r) + 'px)') : '',
            t2 = (n > 2) ? ('translateZ(' + r + 'px)') : '';
          for (i = 0; i < n; ++i) {
            ii = (i + 1) % n;
            deg1 = i * 360 / n;
            deg2 = (i + 1) * 360 / n;
            styles += '\n'
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
              + '    -moz-transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '    transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '  }\n'
              + '  to {\n'
              + '    -moz-transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '    transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '  }\n'
              + '}\n'
              + '@-webkit-keyframes spin-to-pos' + i + ' {\n'
              + '  from {\n'
              + '    -webkit-transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '    transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '  }\n'
              + '  to {\n'
              + '    -webkit-transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '    transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '  }\n'
              + '}\n'
              + '@keyframes spin-to-pos' + i + ' {\n'
              + '  from {\n'
              + '    -moz-transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '    -ms-transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '    -o-transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '    -webkit-transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '    transform: ' + t1 + 'rotateY(' + deg1 + 'deg)' + t2 + ';\n'
              + '  }\n'
              + '  to {\n'
              + '    -moz-transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '    -ms-transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '    -o-transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '    -webkit-transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '    transform: ' + t1 + 'rotateY(' + deg2 + 'deg)' + t2 + ';\n'
              + '  }\n'
              + '}\n';
          }
          $('head').append($('<style type="text/css"></style>').text(styles));
        })();
      });
  }


  $(document).ready(init);

})();
