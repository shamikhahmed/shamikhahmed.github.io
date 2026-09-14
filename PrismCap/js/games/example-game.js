'use strict';
/**
 * Modular game pattern — smallest game extracted as proof for future splits.
 * Factory runs after Game is defined in app.js (via PRISM_GAME_FACTORIES).
 */
window.PRISM_GAME_FACTORIES = window.PRISM_GAME_FACTORIES || [];
window.PRISM_GAME_FACTORIES.push(function() {
  var TicTacToe = new Game({
    id: 'ttt',
    title: 'Tic-Tac-Toe',
    icon: '⭕',
    type: 'strategy',
    cat: 'multiplayer',
    col: '#30D158',
    mp: true,
    min: 2,
    max: 2,
    desc: 'Classic X & O. First to three in a row wins.'
  });

  TicTacToe.setup = function(pl) {
    Game.prototype.setup.call(this, pl.slice(0, 2));
    this.gs = {
      board: Array(9).fill(null),
      turn: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      players: pl.slice(0, 2),
      streak: [0, 0]
    };
  };

  TicTacToe._check = function(b) {
    var lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { winner: b[l[0]], line: l };
    }
    if (b.every(function(c) { return c; })) return { draw: true };
    return null;
  };

  TicTacToe.render = function() {
    var gs = this.gs;
    var self = this;
    var marks = ['X', 'O'];
    var colors = ['#FF2D55', '#00D4FF'];
    var curMark = marks[gs.turn];
    var curColor = colors[gs.turn];
    var curPlayer = gs.players[gs.turn];
    var result = this._check(gs.board);

    var cells = gs.board.map(function(c, i) {
      var cidx = c === 'X' ? 0 : c === 'O' ? 1 : null;
      return '<div onclick="window._tt(' + i + ')" style="display:flex;align-items:center;justify-content:center;height:88px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:13px;cursor:pointer;font-size:2.4rem;font-weight:900;color:' + (cidx !== null ? colors[cidx] : 'transparent') + ';transition:all .15s">' + (c || '·') + '</div>';
    }).join('');

    document.getElementById('gbody').innerHTML =
      '<div style="padding:8px 0">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:12px">' +
      gs.players.map(function(p, i) {
        return '<div style="text-align:center;padding:9px 16px;background:' + (gs.turn === i ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (gs.turn === i ? 'rgba(255,255,255,.2)' : 'var(--border)') + ';border-radius:12px;flex:1;margin:' + (i === 0 ? '0 5px 0 0' : '0 0 0 5px') + '"><div style="font-size:1.1rem">' + p.av + '</div><div style="font-size:.78rem;font-weight:700;margin-top:2px">' + p.name + '</div><div style="font-size:1.5rem;color:' + colors[i] + ';font-weight:900">' + marks[i] + '</div></div>';
      }).join('') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">' + cells + '</div>' +
      (result ?
        '<div style="text-align:center;padding:14px;background:rgba(255,255,255,.05);border-radius:13px">' +
        (result.draw ? '<div style="font-size:1.1rem;font-weight:700">It\'s a Draw!</div>' : '<div style="font-size:1.1rem;font-weight:700;color:' + curColor + '">' + curPlayer.name + ' Wins! ' + curMark + '</div>') +
        '<div style="display:flex;gap:8px;margin-top:12px;justify-content:center"><button type="button" class="btn bw" onclick="window._ttreset()">Play Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div>' +
        '</div>'
        : '<div style="text-align:center;opacity:.38;font-size:.8rem">' + curPlayer.av + ' ' + curPlayer.name + ' — play <span style="color:' + curColor + ';font-weight:700">' + curMark + '</span></div>'
      ) +
      '</div>';

    window._tt = function(i) {
      if (gs.board[i] || self._check(gs.board)) return;
      gs.board[i] = marks[gs.turn];
      Snd.click();
      Hap.l();
      var result2 = self._check(gs.board);
      if (result2) {
        if (!result2.draw) {
          self.done(gs.players[gs.turn].name);
          Snd.ok();
          Hap.ok();
        } else {
          self.done(null);
        }
      } else {
        gs.turn = 1 - gs.turn;
      }
      Nav.go('game');
      self.render();
    };
    window._ttreset = function() {
      gs.board = Array(9).fill(null);
      gs.turn = 1 - gs.turn;
      Nav.go('game');
      self.render();
    };
  };

  return TicTacToe;
});
