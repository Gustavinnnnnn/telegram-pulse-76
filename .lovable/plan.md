## Reformulação visual completa — TeleAds Pro

A plataforma atual está com cara de "template de IA". Vou reconstruir a identidade visual para parecer uma ferramenta real de mídia paga do Telegram, com personalidade própria — não um dashboard SaaS genérico.

### Direção visual nova

**Conceito:** "Telegram Ads Manager" — mistura da estética nativa do Telegram (bolhas de chat, gradientes azuis profundos, tipografia condensada) com a densidade de informação do Meta Ads Manager e a sofisticação do Linear/Vercel.

**Mudanças de identidade:**
- **Tipografia dupla:** `Space Grotesk` (display, números grandes, headlines) + `Inter` (corpo). Numerais tabulares em todas as métricas.
- **Paleta expandida:** fundo `#0A1119` (mais profundo que Telegram), superfícies em camadas (`#0F1A24` → `#162433` → `#1E3247`), azul Telegram `#229ED9` como acento + verde-ciano `#2EE6B6` para performance positiva e laranja `#FF8A3D` para alertas. Gradientes mesh sutis no fundo.
- **Bordas e sombras:** bordas internas com `inset 0 1px 0 rgba(255,255,255,0.04)` (efeito vidro), sombras coloridas (azul, verde) em vez de pretas neutras.
- **Iconografia:** ícones outline custom-feel com peso 1.5px, sempre em containers quadrados com cantos `rounded-xl` e leve gradiente — não os Lucide soltos padrão.
- **Animações:** números que animam ao carregar (count-up), gráficos com gradiente animado, micro-pulse nos status "ao vivo".

### Páginas a reconstruir

**1. Dashboard (`/`)** — virar uma central de operações
- Header executivo com: nome do anunciante + chip "ID: TLG-XXXXX" + período selecionável (Hoje / 7d / 30d / Custom) + botão "Exportar relatório".
- Faixa de 4 métricas hero em "tiles de vidro" com sparkline interno e badge de variação animada.
- Grid principal:
  - Gráfico grande "Performance por hora" (área empilhada: impressões / cliques / conversões) ocupando 8 cols.
  - Painel lateral 4 cols: "Top campanhas hoje" com mini-progress bars de gasto vs orçamento.
- Linha inferior: 
  - Heatmap 24h × 7d de melhor horário de entrega.
  - Funil visual (Impressões → Cliques → DMs → Conversões) com taxas entre etapas.
  - Mapa de distribuição por nicho (donut customizado, não recharts default).
- Feed lateral "Atividade ao vivo" com pulse verde mostrando eventos chegando em tempo real (simulado).

**2. Criar campanha (`/campaigns/new`)** — virar um wizard cinematográfico
- Layout split-screen: lado esquerdo formulário com stepper vertical numerado (5 etapas), lado direito **preview ao vivo do anúncio renderizado dentro de um mockup de chat do Telegram** (bolha azul, avatar do canal, botão inline) que atualiza em tempo real conforme o usuário digita.
- Cada etapa em card com glassmorphism, transições suaves entre etapas.
- Etapa de objetivo: 3 cards grandes com ilustração SVG animada em cada um (não só ícone Lucide).
- Etapa de orçamento: slider customizado com marcadores de "alcance estimado" calculado dinamicamente, gráfico mini mostrando projeção de impressões.
- Etapa de segmentação: chips coloridos por categoria + mapa de calor de canais Telegram disponíveis por nicho.
- Footer fixo com resumo (orçamento, alcance estimado, CPM previsto) + CTA grande gradiente.

**3. Lista de campanhas (`/campaigns`)** — densidade Meta Ads Manager
- Tabela completa com colunas: checkbox, status (toggle inline), nome + objetivo, entrega (barra de progresso), gasto / orçamento, impressões, cliques, CTR, CPC, conversões, ações.
- Toolbar com filtros multi-select (status, objetivo, nicho, período), busca, "colunas customizáveis", "exportar".
- Cada linha expandível mostrando mini gráfico inline.
- Hover state com destaque azul lateral.
- Mobile: cards detalhados (não a tabela).

**4. Detalhe da campanha (`/campaigns/$id`)** — manter as abas mas reformular cada uma
- Header com breadcrumb + status pill animado + ações (pausar / duplicar / editar / excluir).
- Faixa de KPIs com comparação vs período anterior.
- Aba Overview: combinação de gráfico principal + preview do anúncio no mockup Telegram + score de qualidade circular.
- Aba Destinatários: feed com avatares gerados (gradiente baseado no nome), badges de status animados, infinite scroll simulado.

**5. Carteira (`/wallet`)** — visual de "fintech ads"
- Card de saldo grande com gradiente animado (estilo cartão de crédito virtual), número grande tipográfico.
- Histórico em timeline vertical (não tabela), agrupado por data.
- Modal de depósito com seleção de valores rápidos (R$ 50, 100, 500, 1k) + input custom + métodos de pagamento ilustrados.

**6. Sidebar/AppLayout** — repaginar
- Sidebar mais estreita com ícones grandes + label, seção "Ferramentas" separada de "Conta".
- Logo TeleAds com mark customizado (não emoji).
- Indicador de campanhas ativas com bolinha pulsante verde no item "Campanhas".
- Topbar com: search global (Cmd+K visual), seletor de conta, notificações com badge, avatar.

### Componentes novos a criar

- `src/components/MetricTile.tsx` — tile de métrica com sparkline embutido, count-up, badge de variação.
- `src/components/TelegramAdPreview.tsx` — mockup fiel de mensagem patrocinada do Telegram (bolha, avatar, botão inline, "Sponsored").
- `src/components/LiveActivityFeed.tsx` — feed pulsante de eventos.
- `src/components/HourlyHeatmap.tsx` — heatmap 24×7 SVG custom.
- `src/components/ConversionFunnel.tsx` — funil visual com taxas.
- `src/components/CampaignTable.tsx` — tabela densa estilo Ads Manager.
- `src/components/StepperVertical.tsx` — stepper numerado vertical.
- `src/components/QualityScore.tsx` — gauge circular de qualidade.
- `src/components/BalanceCard.tsx` — card "cartão virtual" da carteira.
- `src/components/Logo.tsx` — mark TeleAds.

### Detalhes técnicos

- Adicionar Google Font `Space Grotesk` via `<link>` no `__root.tsx`.
- Estender `src/styles.css` com: nova paleta multi-camada, gradientes mesh, classes utilitárias `.glass`, `.tile`, `.tabular`, animação `count-up` e `pulse-live`.
- Criar `src/lib/format.ts` com helpers de formatação BR (R$, números compactos 1.2k / 3.4M, percentuais).
- Criar `src/hooks/useCountUp.ts` para animar números.
- Manter toda a lógica de dados (queries, fake-metrics, auth) — só repaginar UI.
- Sem alterações de schema/backend.

### Fora do escopo

- Não mexer em RLS, migrations, autenticação ou geração de métricas.
- Não adicionar novas rotas além das existentes.
- Não integrar bot Telegram real.