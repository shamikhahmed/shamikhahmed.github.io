type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: DeferredPrompt | null = null;

export function installPrompt(button: HTMLButtonElement): void {
  button.style.display = 'none';

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as DeferredPrompt;
    button.style.display = 'inline-flex';
  });

  button.addEventListener('click', async () => {
    if (!deferred) return;
    await deferred.prompt();
    deferred = null;
    button.style.display = 'none';
  });
}

