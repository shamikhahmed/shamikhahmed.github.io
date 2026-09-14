type TabId = 'home' | 'games' | 'arcade' | 'profile' | 'settings';
type GameId = 'reflex' | 'ttt' | 'memory';

type AppSave = {
  profile: { name: string; avatar: string; xp: number; level: number; streak: number };
  stats: Record<GameId, { plays: number; best: number }>;
  favorites: GameId[];
  recent: GameId[];
  achievements: string[];
  daily: { key: string; claimed: boolean };
  config: { sfx: boolean; haptics: boolean; lowPower: boolean; theme: 'cyber' | 'neon' | 'midnight' };
};

const SAVE_KEY = 'prismos_v2_save';

const DEFAULT_SAVE: AppSave = {
  profile: { name: 'Player', avatar: '🕹️', xp: 0, level: 1, streak: 0 },
  stats: {
    reflex: { plays: 0, best: 0 },
    ttt: { plays: 0, best: 0 },
    memory: { plays: 0, best: 0 },
  },
  favorites: [],
  recent: [],
  achievements: [],
  daily: { key: '', claimed: false },
  config: { sfx: true, haptics: true, lowPower: false, theme: 'cyber' },
};

export class PrismApp {
  private root: HTMLDivElement;
  private save: AppSave;
  private activeTab: TabId = 'home';
  private activeGame: GameId | null = null;
  private activeCleanup: (() => void) | null = null;

  constructor(root: HTMLDivElement) {
    this.root = root;
    this.save = this.load();
  }

  mount(): void {
    this.render();
    this.bindGlobalEvents();
    this.applyTheme();
  }

  private load(): AppSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw) as AppSave;
      return {
        ...structuredClone(DEFAULT_SAVE),
        ...parsed,
        profile: { ...DEFAULT_SAVE.profile, ...parsed.profile },
        config: { ...DEFAULT_SAVE.config, ...parsed.config },
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  private persist(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
  }

  private render(): void {
    this.root.innerHTML = `
      <main class="app-shell theme-${this.save.config.theme}">
        <header class="topbar glass">
          <div>
            <h1>PrismCap</h1>
            <p>Offline Gaming Ecosystem</p>
          </div>
          <div class="top-actions">
            <button id="daily-btn" class="btn">Daily Reward</button>
            <button id="install-app-btn" class="btn">Install</button>
          </div>
        </header>

        <section id="screen" class="screen"></section>

        <nav class="bottom-nav glass">
          ${this.navButton('home', 'Home', '⬡')}
          ${this.navButton('games', 'Games', '◫')}
          ${this.navButton('arcade', 'Arcade', '◈')}
          ${this.navButton('profile', 'Profile', '◉')}
          ${this.navButton('settings', 'Settings', '⚙️')}
        </nav>
      </main>
    `;
    this.renderScreen();
    this.bindStaticEvents();
  }

  private navButton(id: TabId, label: string, icon: string): string {
    const on = this.activeTab === id ? ' on' : '';
    return `<button class="nav-btn${on}" data-tab="${id}"><span>${icon}</span><small>${label}</small></button>`;
  }

  private renderScreen(): void {
    const screen = this.root.querySelector<HTMLDivElement>('#screen');
    if (!screen) return;
    if (this.activeTab === 'home') screen.innerHTML = this.homeView();
    if (this.activeTab === 'games') screen.innerHTML = this.gamesView();
    if (this.activeTab === 'arcade') screen.innerHTML = this.arcadeView();
    if (this.activeTab === 'profile') screen.innerHTML = this.profileView();
    if (this.activeTab === 'settings') screen.innerHTML = this.settingsView();
    this.bindScreenEvents();
  }

  private homeView(): string {
    const recents = this.save.recent
      .map((id) => this.gameCard(id, true))
      .join('');
    return `
      <section class="panel glass">
        <h2>Command Center</h2>
        <p>Level ${this.save.profile.level} · ${this.save.profile.xp} XP · Streak ${this.save.profile.streak}</p>
      </section>
      <section class="panel glass">
        <h3>Recently Played</h3>
        <div class="cards">${recents || '<p class="muted">No recent games yet.</p>'}</div>
      </section>
      <section class="panel glass">
        <h3>Legacy PrismCap</h3>
        <p class="muted">Your full previous single-file build is preserved.</p>
        <a class="btn link" href="/legacy/PrismCap-v12.html" target="_blank" rel="noreferrer">Open Legacy Build</a>
      </section>
    `;
  }

  private gamesView(): string {
    return `
      <section class="panel glass">
        <h2>Games</h2>
        <div class="cards">
          ${this.gameCard('reflex')}
          ${this.gameCard('memory')}
          ${this.gameCard('ttt')}
        </div>
      </section>
    `;
  }

  private arcadeView(): string {
    const rows = (Object.keys(this.save.stats) as GameId[])
      .map((id) => {
        const s = this.save.stats[id];
        return `<div class="stat-row"><span>${this.title(id)}</span><span>${s.plays} plays · best ${s.best}</span></div>`;
      })
      .join('');
    return `
      <section class="panel glass">
        <h2>Arcade Stats</h2>
        ${rows}
      </section>
      <section class="panel glass">
        <h3>Achievements</h3>
        <div class="chips">${this.achievementChips()}</div>
      </section>
    `;
  }

  private profileView(): string {
    return `
      <section class="panel glass">
        <h2>${this.save.profile.avatar} ${this.save.profile.name}</h2>
        <p>Level ${this.save.profile.level} · ${this.save.profile.xp} XP</p>
        <div class="profile-edit">
          <input id="name-input" value="${this.save.profile.name}" />
          <select id="avatar-input">
            ${['🕹️', '😎', '🤖', '👾', '⚡'].map((a) => `<option ${a === this.save.profile.avatar ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
          <button id="save-profile-btn" class="btn">Save Profile</button>
        </div>
      </section>
    `;
  }

  private settingsView(): string {
    const c = this.save.config;
    return `
      <section class="panel glass">
        <h2>Settings</h2>
        ${this.toggleRow('sfx', 'Sound FX', c.sfx)}
        ${this.toggleRow('haptics', 'Haptics', c.haptics)}
        ${this.toggleRow('lowPower', 'Low Power Mode', c.lowPower)}
        <div class="setting-row">
          <span>Theme</span>
          <select id="theme-select">
            <option value="cyber" ${c.theme === 'cyber' ? 'selected' : ''}>Cyber</option>
            <option value="neon" ${c.theme === 'neon' ? 'selected' : ''}>Neon</option>
            <option value="midnight" ${c.theme === 'midnight' ? 'selected' : ''}>Midnight</option>
          </select>
        </div>
      </section>
    `;
  }

  private toggleRow(key: 'sfx' | 'haptics' | 'lowPower', label: string, on: boolean): string {
    return `
      <div class="setting-row">
        <span>${label}</span>
        <button class="toggle ${on ? 'on' : ''}" data-toggle="${key}">${on ? 'ON' : 'OFF'}</button>
      </div>
    `;
  }

  private gameCard(id: GameId, compact = false): string {
    const fav = this.save.favorites.includes(id) ? '★' : '☆';
    const c = compact ? ' compact' : '';
    return `
      <article class="game-card${c}">
        <div>
          <h4>${this.title(id)}</h4>
          <p>${this.desc(id)}</p>
        </div>
        <div class="row">
          <button class="btn" data-play="${id}">Play</button>
          <button class="btn ghost" data-fav="${id}">${fav}</button>
        </div>
      </article>
    `;
  }

  private title(id: GameId): string {
    return { reflex: 'Neon Reflex', memory: 'Memory Matrix', ttt: 'Tic Tac Toe AI' }[id];
  }

  private desc(id: GameId): string {
    return {
      reflex: 'Tap the target quickly for score.',
      memory: 'Remember and repeat sequence patterns.',
      ttt: 'Beat adaptive offline AI.',
    }[id];
  }

  private bindStaticEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach((btn) => {
      btn.onclick = () => {
        this.activeTab = btn.dataset.tab as TabId;
        this.render();
      };
    });
    const daily = this.root.querySelector<HTMLButtonElement>('#daily-btn');
    if (daily) daily.onclick = () => this.claimDaily();
  }

  private bindScreenEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((btn) => {
      btn.onclick = () => this.play(btn.dataset.play as GameId);
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.fav as GameId;
        this.save.favorites = this.save.favorites.includes(id)
          ? this.save.favorites.filter((x) => x !== id)
          : [...this.save.favorites, id];
        this.persist();
        this.renderScreen();
      };
    });
    const saveBtn = this.root.querySelector<HTMLButtonElement>('#save-profile-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const name = this.root.querySelector<HTMLInputElement>('#name-input')?.value.trim();
        const avatar = this.root.querySelector<HTMLSelectElement>('#avatar-input')?.value || '🕹️';
        if (name) this.save.profile.name = name;
        this.save.profile.avatar = avatar;
        this.persist();
        this.renderScreen();
      };
    }
    this.root.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.toggle as 'sfx' | 'haptics' | 'lowPower';
        this.save.config[key] = !this.save.config[key];
        this.persist();
        this.renderScreen();
      };
    });
    const theme = this.root.querySelector<HTMLSelectElement>('#theme-select');
    if (theme) {
      theme.onchange = () => {
        this.save.config.theme = theme.value as AppSave['config']['theme'];
        this.persist();
        this.applyTheme();
      };
    }
  }

  private bindGlobalEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeOverlay();
    });
  }

  private claimDaily(): void {
    const key = new Date().toDateString();
    if (this.save.daily.key !== key) {
      this.save.daily = { key, claimed: false };
      this.save.profile.streak += 1;
    }
    if (this.save.daily.claimed) return alert('Daily reward already claimed.');
    this.save.daily.claimed = true;
    this.awardXP(80, 'Daily reward');
    this.persist();
    this.renderScreen();
  }

  private play(id: GameId): void {
    this.activeGame = id;
    this.save.stats[id].plays += 1;
    this.save.recent = [id, ...this.save.recent.filter((x) => x !== id)].slice(0, 6);
    this.persist();
    this.openOverlay();
    if (id === 'reflex') this.mountReflex();
    if (id === 'memory') this.mountMemory();
    if (id === 'ttt') this.mountTTT();
  }

  private openOverlay(): void {
    this.closeOverlay();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card glass">
        <div class="overlay-top">
          <h3>${this.activeGame ? this.title(this.activeGame) : 'Game'}</h3>
          <button class="btn" id="close-game-btn">Close</button>
        </div>
        <div id="game-mount"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = overlay.querySelector<HTMLButtonElement>('#close-game-btn');
    if (close) close.onclick = () => this.closeOverlay();
  }

  private closeOverlay(): void {
    if (this.activeCleanup) {
      this.activeCleanup();
      this.activeCleanup = null;
    }
    document.getElementById('game-overlay')?.remove();
    this.activeGame = null;
  }

  private mountReflex(): void {
    const mount = document.getElementById('game-mount');
    if (!mount) return;
    let score = 0;
    let live = true;
    mount.innerHTML = `<p>Tap targets for 20 seconds.</p><div class="arena" id="reflex-arena"></div><p id="reflex-score">Score: 0</p>`;
    const arena = mount.querySelector<HTMLDivElement>('#reflex-arena');
    const label = mount.querySelector<HTMLParagraphElement>('#reflex-score');
    if (!arena || !label) return;
    const spawn = () => {
      if (!live) return;
      arena.innerHTML = '';
      const t = document.createElement('button');
      t.className = 'target';
      t.style.left = `${Math.random() * 86}%`;
      t.style.top = `${Math.random() * 80}%`;
      t.onclick = () => {
        score += 10;
        label.textContent = `Score: ${score}`;
        spawn();
      };
      arena.appendChild(t);
    };
    spawn();
    const timer = window.setTimeout(() => {
      live = false;
      this.finishGame('reflex', score);
      alert(`Reflex complete! Score ${score}`);
      this.closeOverlay();
    }, 20000);
    this.activeCleanup = () => {
      live = false;
      clearTimeout(timer);
    };
  }

  private mountMemory(): void {
    const mount = document.getElementById('game-mount');
    if (!mount) return;
    let level = 1;
    let sequence: number[] = [];
    let input: number[] = [];
    let score = 0;
    mount.innerHTML = `
      <p>Repeat sequence to progress levels.</p>
      <div class="memory-grid" id="memory-grid">
        <button data-i="0"></button><button data-i="1"></button>
        <button data-i="2"></button><button data-i="3"></button>
      </div>
      <p id="memory-status">Watch the pattern...</p>
    `;
    const grid = mount.querySelector<HTMLDivElement>('#memory-grid');
    const status = mount.querySelector<HTMLParagraphElement>('#memory-status');
    if (!grid || !status) return;
    const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>('button'));
    const flash = (i: number, ms = 300) => {
      buttons[i].classList.add('on');
      setTimeout(() => buttons[i].classList.remove('on'), ms);
    };
    const show = () => {
      status.textContent = `Level ${level} · Watch...`;
      input = [];
      sequence.push(Math.floor(Math.random() * 4));
      sequence.forEach((s, idx) => setTimeout(() => flash(s), idx * 480 + 250));
      setTimeout(() => (status.textContent = 'Your turn'), sequence.length * 500 + 350);
    };
    buttons.forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.i);
        flash(idx, 120);
        input.push(idx);
        const pos = input.length - 1;
        if (sequence[pos] !== idx) {
          this.finishGame('memory', score);
          alert(`Memory over! Level ${level}, score ${score}`);
          this.closeOverlay();
          return;
        }
        if (input.length === sequence.length) {
          score += 20;
          level += 1;
          setTimeout(show, 500);
        }
      };
    });
    show();
    this.activeCleanup = () => {};
  }

  private mountTTT(): void {
    const mount = document.getElementById('game-mount');
    if (!mount) return;
    const board = Array(9).fill('');
    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    let ended = false;
    mount.innerHTML = `<p>You are X. Beat ARIA (O).</p><div class="ttt-grid">${Array.from({ length: 9 }).map((_, i) => `<button data-i="${i}"></button>`).join('')}</div>`;
    const cells = Array.from(mount.querySelectorAll<HTMLButtonElement>('.ttt-grid button'));
    const winner = () => {
      for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
      }
      return '';
    };
    const aiMove = () => {
      const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (!empty.length || ended) return;
      const pick = empty[Math.floor(Math.random() * empty.length)];
      board[pick] = 'O';
      cells[pick].textContent = 'O';
      const w = winner();
      if (w || board.every(Boolean)) finish(w);
    };
    const finish = (w: string) => {
      ended = true;
      let points = 10;
      if (w === 'X') points = 80;
      if (w === 'O') points = 20;
      this.finishGame('ttt', points);
      alert(w === 'X' ? 'You win!' : w === 'O' ? 'ARIA wins!' : 'Draw');
      this.closeOverlay();
    };
    cells.forEach((c) => {
      c.onclick = () => {
        if (ended) return;
        const i = Number(c.dataset.i);
        if (board[i]) return;
        board[i] = 'X';
        c.textContent = 'X';
        const w = winner();
        if (w || board.every(Boolean)) return finish(w);
        setTimeout(aiMove, 250);
      };
    });
    this.activeCleanup = () => {
      ended = true;
    };
  }

  private finishGame(id: GameId, points: number): void {
    this.save.stats[id].best = Math.max(this.save.stats[id].best, points);
    this.awardXP(points, `${this.title(id)} complete`);
    this.checkAchievements();
    this.persist();
    this.renderScreen();
  }

  private awardXP(amount: number, _reason: string): void {
    this.save.profile.xp += amount;
    this.save.profile.level = Math.max(1, Math.floor(this.save.profile.xp / 200) + 1);
  }

  private checkAchievements(): void {
    const add = (id: string) => {
      if (!this.save.achievements.includes(id)) this.save.achievements.push(id);
    };
    const totalPlays = (Object.keys(this.save.stats) as GameId[]).reduce((n, id) => n + this.save.stats[id].plays, 0);
    if (totalPlays >= 10) add('ten_plays');
    if (this.save.stats.reflex.best >= 120) add('reflex_master');
    if (this.save.profile.level >= 5) add('rising_operator');
  }

  private achievementChips(): string {
    if (!this.save.achievements.length) return '<p class="muted">No achievements yet.</p>';
    const map: Record<string, string> = {
      ten_plays: '🎯 Ten Plays',
      reflex_master: '⚡ Reflex Master',
      rising_operator: '🏆 Rising Operator',
    };
    return this.save.achievements.map((id) => `<span class="chip">${map[id] || id}</span>`).join('');
  }

  private applyTheme(): void {
    document.body.className = `theme-${this.save.config.theme}`;
  }
}

