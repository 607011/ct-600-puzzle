/// Original solver by Norio Kato, http://www.ueda.info.waseda.ac.jp/~n-kato/lightsout/ 
/// Modified 2014 by Oliver Lau <ola@ct.de>

var Solver = (function () {
  "use strict";
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
    mat = [];
    for (x = 0; x < N; ++x)
      for (y = 0; y < M; ++y) {
        i = y * N + x;
        line = [];
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
    cols = [];
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
          if (a(i, j) !== 0)
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
        air = a(i, r);
        if (air !== 0)
          for (j = r; j < np; ++j)
            setmat(i, j, a(i, j) - a(r, j) * air);
      }
    }
  }
  function solved() {
    var i, j, x, y, solution, solutions = [], goal, anscols;
    for (goal = 0; goal < nStates; ++goal) {
      solution = new Array(N);
      for (i = 0; i < N; ++i)
        solution[i] = new Array(M);
      if (solvedProblem(goal)) {
        anscols = [];
        for (j = 0; j < n; ++j)
          anscols[cols[j]] = j;
        for (x = 0; x < N; ++x) {
          for (y = 0; y < M; ++y) {
            j = anscols[y * N + x];
            solution[x][y] = a(j, n);
          }
        }
        solutions.push(solution);
      }
    }
    return solutions;
  }  return {
    solve: function (puzzle, states) {
      cells = puzzle;
      N = cells.length;
      M = cells[0].length;
      nStates = states;
      return solved();
    }
  };
})();
