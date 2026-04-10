import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Star, MapPin, Phone, Mail, Clock,
  UtensilsCrossed, Award, Users, Truck, ChevronDown
} from 'lucide-react';
import './Termos.css';

const faqs = [
  { q: 'Posso cancelar meu pedido?', a: 'Sim, enquanto o status estiver como "Recebido". Após iniciar o preparo, o cancelamento não é possível, conforme o CDC (Lei nº 8.078/1990).' },
  { q: 'Meus dados são compartilhados com terceiros?', a: 'Não. Seus dados são usados exclusivamente para processar e entregar seus pedidos, conforme a LGPD (Lei nº 13.709/2018).' },
  { q: 'Como solicito a exclusão dos meus dados?', a: 'Acesse seu Perfil no aplicativo e clique em "Excluir minha conta". Seus dados serão removidos permanentemente.' },
  { q: 'O tempo de entrega é garantido?', a: 'O prazo informado é estimado e pode variar por fatores externos (trânsito, clima). Não nos responsabilizamos por atrasos fora do nosso controle.' },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{q}</span>
        <ChevronDown size={18} className="faq-icon" />
      </div>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

export default function Termos() {
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="page-content termos-page animate-fade-in">

      {/* ── Hero ── */}
      <div className="termos-hero">
        <div className="container">
          <ShieldCheck size={52} color="white" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h1>Termos de Uso & Política de Privacidade</h1>
          <p>Última atualização: {date}</p>
        </div>
      </div>

      {/* ── SOBRE A EMPRESA ── */}
      <section className="sobre-section">
        <div className="container">
          <div className="sobre-header">
            <div className="sobre-logo">
              <UtensilsCrossed size={32} color="white" />
            </div>
            <div>
              <h2>Sobre Nós</h2>
              <p>Conheça quem está por trás de cada prato</p>
            </div>
          </div>

          <div className="sobre-grid">
            <div className="sobre-text">
              <p>
                Somos um estabelecimento de alimentação dedicado a oferecer refeições preparadas
                com ingredientes frescos e receitas artesanais. Nosso compromisso é levar sabor,
                qualidade e praticidade até você — seja no conforto da sua casa ou no local.
              </p>
              <p>
                Operamos em total conformidade com as normas da <strong>Vigilância Sanitária</strong>,
                seguindo a <strong>Resolução RDC nº 216/2004 da ANVISA</strong>, e obedecemos à
                legislação de comércio eletrônico conforme o <strong>Decreto nº 7.962/2013</strong>.
              </p>
              <div className="info-chips">
                <span><MapPin size={14}/> Endereço disponível no estabelecimento</span>
                <span><Phone size={14}/> Contato via app ou WhatsApp</span>
                <span><Clock size={14}/> Aberto todos os dias</span>
                <span><Mail size={14}/> Suporte pelo app</span>
              </div>
            </div>

            <div className="sobre-stats">
              <div className="stat-card">
                <Award size={28} color="var(--primary-color)" />
                <strong>Qualidade</strong>
                <span>Ingredientes frescos todo dia</span>
              </div>
              <div className="stat-card">
                <Users size={28} color="var(--primary-color)" />
                <strong>Atendimento</strong>
                <span>Equipe dedicada e atenciosa</span>
              </div>
              <div className="stat-card">
                <Truck size={28} color="var(--primary-color)" />
                <strong>Entrega</strong>
                <span>Rápida e segura até você</span>
              </div>
              <div className="stat-card">
                <Star size={28} color="#FBBC04" fill="#FBBC04" />
                <strong>Avaliações</strong>
                <span>Avaliado 5★ pelos clientes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TERMOS LEGAIS ── */}
      <div className="termos-body container">

        <section className="termos-section">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta e utilizar este aplicativo, o usuário declara ter lido, compreendido
            e aceito integralmente os presentes Termos de Uso. Caso não concorde com qualquer
            disposição, deverá abster-se de utilizar os serviços.
          </p>
          <p>
            Estes Termos poderão ser atualizados a qualquer momento. A continuidade de uso após
            qualquer alteração implica na aceitação das novas condições.
          </p>
        </section>

        <section className="termos-section">
          <h2>2. Cadastro e Responsabilidades do Usuário</h2>
          <p>O usuário se compromete a:</p>
          <ul>
            <li>Fornecer informações verdadeiras, precisas e atualizadas no momento do cadastro;</li>
            <li>Manter a confidencialidade de suas credenciais de acesso (e-mail e senha);</li>
            <li>Não compartilhar sua conta com terceiros;</li>
            <li>Informar endereço de entrega correto e acessível;</li>
            <li>Realizar pedidos somente se maior de 18 anos ou com consentimento dos responsáveis legais.</li>
          </ul>
          <p>
            O estabelecimento não se responsabiliza por pedidos realizados com dados incorretos
            fornecidos pelo usuário, incluindo endereços de entrega equivocados.
          </p>
        </section>

        <section className="termos-section">
          <h2>3. Pedidos, Preços e Pagamentos</h2>
          <p>
            Os preços exibidos no cardápio estão expressos em reais (R$) e incluem os impostos
            aplicáveis. A taxa de entrega é informada antes da finalização do pedido e pode variar
            conforme a localização.
          </p>
          <p>
            Após a confirmação do pedido, o cancelamento somente poderá ser solicitado enquanto
            o status estiver como <strong>"Recebido"</strong>. Após o início do preparo, não será
            possível efetuar cancelamentos ou reembolsos, exceto nos casos previstos pelo{' '}
            <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>.
          </p>
        </section>

        <section className="termos-section">
          <h2>4. Prazo e Condições de Entrega</h2>
          <p>
            O prazo estimado de entrega é informativo e pode variar em função da demanda, condições
            climáticas, trânsito e distância. O estabelecimento não se responsabiliza por atrasos
            decorrentes de causas externas alheias ao seu controle.
          </p>
          <p>
            A responsabilidade pela qualidade dos alimentos encerra-se no momento da entrega.
            Recomendamos o consumo imediato após o recebimento.
          </p>
        </section>

        <section className="termos-section highlight-section">
          <h2>5. Proteção de Dados Pessoais — LGPD</h2>
          <p>
            Em conformidade com a <strong>Lei Geral de Proteção de Dados — Lei nº 13.709/2018 (LGPD)</strong>,
            os dados pessoais coletados (nome e e-mail) são utilizados exclusivamente para:
          </p>
          <ul>
            <li>Processamento e entrega dos pedidos realizados;</li>
            <li>Comunicação sobre o status do pedido;</li>
            <li>Cumprimento de obrigações legais.</li>
          </ul>
          <p>
            <strong>Não compartilhamos seus dados com terceiros</strong> para fins comerciais ou
            publicitários. Os dados são armazenados em ambiente seguro e criptografado.
          </p>
          <p>Você tem direito a:</p>
          <ul>
            <li>Acessar seus dados pessoais armazenados;</li>
            <li>Corrigir dados incompletos ou desatualizados no seu Perfil;</li>
            <li>Solicitar a exclusão da conta e remoção permanente dos dados;</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
        </section>

        <section className="termos-section">
          <h2>6. Avaliações no Google</h2>
          <p>
            As avaliações publicadas no Google e em outros canais são de responsabilidade exclusiva
            de seus autores. Respeitamos o direito de expressão dos consumidores, nos termos do{' '}
            <strong>CDC (art. 6º, inciso III, Lei nº 8.078/1990)</strong>.
          </p>
          <p>
            Avaliações com conteúdo falso, difamatório, ofensivo ou discriminatório poderão ser
            reportadas ao Google para análise e remoção, com fundamento na{' '}
            <strong>Lei nº 12.965/2014 (Marco Civil da Internet)</strong> e nas{' '}
            <strong>Políticas de Conteúdo do Google</strong>.
          </p>
          <p>
            O estabelecimento <strong>não recompensa, solicita ou incentiva</strong> avaliações
            positivas falsas, em conformidade com as{' '}
            <strong>Diretrizes de Avaliações do Google (Google Review Policy)</strong>.
          </p>
        </section>

        <section className="termos-section">
          <h2>7. Propriedade Intelectual</h2>
          <p>
            Todos os conteúdos deste aplicativo — logotipos, imagens, textos e identidade visual —
            são protegidos pela <strong>Lei nº 9.610/1998 (Lei de Direitos Autorais)</strong>.
            É vedada a reprodução ou uso sem autorização expressa.
          </p>
        </section>

        <section className="termos-section">
          <h2>8. Foro e Legislação Aplicável</h2>
          <p>
            Os presentes Termos são regidos pelas leis da República Federativa do Brasil.
            Quaisquer conflitos serão submetidos ao foro da comarca da sede do estabelecimento,
            com renúncia a qualquer outro foro, por mais privilegiado que seja.
          </p>
        </section>

        <section className="termos-section">
          <h2>9. Contato e Suporte</h2>
          <p>Em caso de dúvidas, sugestões ou reclamações, entre em contato pelos canais disponíveis no aplicativo.</p>
          <div className="info-chips">
            <span><Mail size={14}/> Suporte disponível pelo aplicativo</span>
            <span><ShieldCheck size={14}/> Dados tratados com segurança</span>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section">
          <h2>Dúvidas Frequentes</h2>
          <div className="faq-list">
            {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── Google Review CTA ── */}
        <div className="google-review-box">
          <Star size={32} color="#FBBC04" fill="#FBBC04" />
          <div>
            <h3>Gostou do nosso serviço?</h3>
            <p>
              Sua avaliação honesta no Google nos ajuda a crescer e melhorar.
              Avaliações falsas ou incentivadas violam as políticas do Google e nunca são praticadas por nós.
            </p>
          </div>
        </div>

        <p className="termos-rodape">
          Ao utilizar este aplicativo, você confirma que leu, entendeu e concordou com todos os termos acima.<br/>
          <strong>Versão {new Date().getFullYear()}.1 — Todos os direitos reservados.</strong>
        </p>
      </div>
    </div>
  );
}
