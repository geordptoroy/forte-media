import app from './app';
import { config } from './config';
import { startSyncWorker } from './workers/syncWorker';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 FORTE MEDIA Backend rodando na porta ${PORT}`);
  console.log(`📊 Modo Mock: ${config.useMock ? 'ATIVADO' : 'DESATIVADO'}`);
  startSyncWorker();
});
