import { SaveManager } from '../state/SaveManager';
import { registerServiceWorker } from '../pwa/registerServiceWorker';
import { installPrompt } from '../pwa/installPrompt';
import { PrismApp } from './App';

export function bootstrap(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  SaveManager.migrateLegacy();
  const prism = new PrismApp(app);
  prism.mount();

  registerServiceWorker();
  const installBtn = document.querySelector<HTMLButtonElement>('#install-app-btn');
  if (installBtn) installPrompt(installBtn);
}

