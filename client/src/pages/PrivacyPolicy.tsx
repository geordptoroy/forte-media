import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-white mb-4"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Home
        </Button>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">Política de Privacidade</CardTitle>
            <p className="text-zinc-400">Última atualização: 03 de abril de 2026</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 text-zinc-300 leading-relaxed">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">1. Introdução</h2>
                  <p>
                    A FORTE MEDIA ("nós", "nosso") valoriza a sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações ao utilizar nossa plataforma e integração com APIs de terceiros, incluindo a Meta Ad Library API.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">2. Informações que Coletamos</h2>
                  <p>
                    Para fornecer nossos serviços de inteligência competitiva, podemos coletar:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Informações de conta (nome, e-mail) fornecidas durante o registro.</li>
                    <li>Credenciais de API (Access Tokens) fornecidas por você para acessar a Meta Ad Library.</li>
                    <li>Dados de uso técnico, como endereço IP e logs de atividade para segurança e melhoria do serviço.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">3. Uso da Meta Ad Library API</h2>
                  <p>
                    Nossa plataforma utiliza a Meta Ad Library API para permitir que você visualize e analise anúncios públicos. 
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Não armazenamos dados de anúncios de forma permanente em nossos servidores, exceto quando você explicitamente salva um anúncio como "Favorito".</li>
                    <li>Seus tokens de acesso da Meta são armazenados de forma criptografada e usados exclusivamente para realizar chamadas à API em seu nome.</li>
                    <li>Respeitamos todos os Termos de Serviço da Meta e as políticas de dados aplicáveis.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">4. Compartilhamento de Dados</h2>
                  <p>
                    Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Seus dados são usados apenas para a operação da plataforma e cumprimento de obrigações legais.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">5. Segurança</h2>
                  <p>
                    Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou alteração. Isso inclui criptografia de dados sensíveis e monitoramento de segurança.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">6. Seus Direitos</h2>
                  <p>
                    Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento através das configurações da sua conta ou entrando em contato com nosso suporte.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">7. Contato</h2>
                  <p>
                    Se você tiver dúvidas sobre esta política, entre em contato através do e-mail: suporte@fortemedia.com
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
