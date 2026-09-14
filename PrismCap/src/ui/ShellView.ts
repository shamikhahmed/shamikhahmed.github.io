export function ShellView(): string {
  return `
    <main class="shell">
      <header class="topbar glass">
        <div>
          <h1>PrismCap</h1>
          <p>Modular Offline Gaming Platform</p>
        </div>
        <button id="install-app-btn" class="btn">Install</button>
      </header>

      <section class="grid">
        <article class="card glass">
          <h2>Migration Status</h2>
          <ul>
            <li>Project structure created</li>
            <li>PWA bootstrapped</li>
            <li>Legacy app preserved</li>
          </ul>
        </article>

        <article class="card glass">
          <h2>Legacy Runtime</h2>
          <p>Your current single-file app is preserved and testable:</p>
          <a class="btn link" href="/legacy/PrismCap-v12.html" target="_blank" rel="noreferrer">Open Legacy PrismCap</a>
        </article>
      </section>
    </main>
  `;
}

