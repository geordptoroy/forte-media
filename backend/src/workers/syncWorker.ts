import cron from 'node-cron';
import { config } from '../config';

export function startSyncWorker() {
  if (config.useMock) {
    console.log('[SyncWorker] Modo mock ativo — worker desativado.');
    return;
  }

  // Sincroniza a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('[SyncWorker] Iniciando sincronização com Meta API...');
    try {
      // TODO: Implementar sincronização real com Meta API
      console.log('[SyncWorker] Sincronização concluída.');
    } catch (err) {
      console.error('[SyncWorker] Erro na sincronização:', err);
    }
  });

  console.log('[SyncWorker] Worker de sincronização iniciado.');
}
