/*
    c't Cover Switch Klickaffe
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

Number.prototype.clamp = function (lo, hi) {
  return Math.min(Math.max(this, lo), hi);
};

Array.prototype.clone = function () {
  return this.slice(0);
};



var MersenneTwister = function (seed) {
  /* Period parameters */
  this.N = 624;
  this.M = 397;
  this.MATRIX_A = 0x9908b0df;   /* constant vector a */
  this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
  this.LOWER_MASK = 0x7fffffff; /* least significant r bits */
  this.mt = new Array(this.N); /* the array for the state vector */
  this.mti = this.N + 1; /* mti==N+1 means mt[N] is not initialized */
  this.init_genrand(seed || 0);
};

/* initializes mt[N] with a seed */
MersenneTwister.prototype.init_genrand = function (s) {
  this.mt[0] = s >>> 0;
  for (this.mti = 1; this.mti < this.N; this.mti++) {
    s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
    this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
    /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
    /* In the previous versions, MSBs of the seed affect   */
    /* only MSBs of the array mt[].                        */
    /* 2002/01/09 modified by Makoto Matsumoto             */
    this.mt[this.mti] >>>= 0;
    /* for >32 bit machines */
  }
};

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
MersenneTwister.prototype.init_by_array = function (init_key, key_length) {
  var i, j, k;
  this.init_genrand(19650218);
  i = 1; j = 0;
  k = (this.N > key_length ? this.N : key_length);
  for (; k; k--) {
    s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
    this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
      + init_key[j] + j; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++; j++;
    if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
    if (j >= key_length) j = 0;
  }
  for (k = this.N - 1; k; k--) {
    s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
    this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
      - i; /* non linear */
    this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
    i++;
    if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
  }
  this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
};

/* generates a random number on [0,0xffffffff]-interval */
MersenneTwister.prototype.genrand_int32 = function () {
  var y, mag01 = new Array(0x0, this.MATRIX_A), kk;
  /* mag01[x] = x * MATRIX_A  for x=0,1 */
  if (this.mti >= this.N) { /* generate N words at one time */
    if (this.mti === this.N + 1)   /* if init_genrand() has not been called, */
      this.init_genrand(5489); /* a default initial seed is used */
    for (kk = 0; kk < this.N - this.M; kk++) {
      y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
      this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
    }
    for (; kk < this.N - 1; kk++) {
      y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
      this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
    }
    y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
    this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
    this.mti = 0;
  }
  y = this.mt[this.mti++];
  /* Tempering */
  y ^= (y >>> 11);
  y ^= (y << 7) & 0x9d2c5680;
  y ^= (y << 15) & 0xefc60000;
  y ^= (y >>> 18);
  return y >>> 0;
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

  var MAX_STATES = 6,
    opts = { game: null, difficulty: null, n: 2 },
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
    // TODO: Berechnen von `middle` anhand von `opts.n`
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
    mt = new MersenneTwister(Date.now()),
    puzzle, moves,
    N, M, nFields, nTurns, nCombinations,
    nSolutions = 0;


  function flip(x, y) {
    puzzle[x][y] = (puzzle[x][y] + 1) % opts.n;
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
    var i, f, selected, ones, zeros, nOnes, nZeros;
    clearPuzzle();
    rng.seed(opts.game);
    if (opts.n === 2) {
      ones = middle[opts.difficulty][0].clone();
      zeros = middle[opts.difficulty][1].clone();
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
        turn(f % N, Math.floor(f / N));
      }
    }
    else {
      i = nTurns;
      while (i-- > 0) {
        f = rng.next() % nFields;
        turn(f % N, Math.floor(f / N));
      }
    }
  }


  function newGame(difficulty, num) {
    opts.difficulty = (typeof difficulty === 'number') ? difficulty : opts.difficulty;
    N = difficulties[opts.difficulty].n;
    M = difficulties[opts.difficulty].m;
    nFields = N * M;
    nTurns = nFields / 2;
    nCombinations = nFields.factorial() / (nTurns.factorial() * (nFields - nTurns).factorial());
    opts.game = (typeof num === 'number') ? num : Math.floor(Math.random() * nCombinations % RNG.MAX_VALUE);
    initPuzzle();
  }


  function idiotSolver() {
    var i = 0, f;
    do {
      f = mt.genrand_int32() % nFields;
      turn(f % N, Math.floor(f / N));
      // turn(mt.genrand_int32() % N, mt.genrand_int32() % M);
      if (++i % 1000000 === 0)
        console.log((new Date()).toISOString() + ' ' + '#' + i + ' ' + nSolutions + ' solutions found.');
    } while (!allTheSame());
    return i;
  }


  function main() {
    var i, n, sum = 0, N_ITERATIONS = 10000;
    for (i = 0; i < N_ITERATIONS; ++i) {
      newGame(1, mt.genrand_int32());
      n = idiotSolver();
      sum += n;
      ++nSolutions;
      console.log('solved after ' + n + ' random turns.');
    }
    console.log('\naverage turns per solution: ' + (sum / N_ITERATIONS).toFixed(1));
  }

  main();

})();
