## Pivô para plataforma de venda de DMs (Telegram)

Mudança de modelo: **deixa de ser uma plataforma de Ads com saldo em dinheiro** e passa a ser uma plataforma de **pacotes fixos de DMs**. Cada disparo consome 1 DM do saldo, não há gasto monetário em campanhas.

### 1. Banco de dados (migration)

- `profiles`: renomear `balance` → `dm_balance` (integer, default 0). Trigger de boas-vindas passa a creditar **100 DMs grátis** em vez de R$ 100.
- `campaigns`: 
  - remover `budget`, `spent`
  - adicionar `dm_total` (int), `dm_sent` (int default 0), `media_url` (text, mídia única do disparo)
  - manter `text`, `button_label`, `button_url`, `clicks`, `impressions`, `status`, `niche`, `objective`
- Nova tabela `dm_packages` (catálogo público read-only): `id`, `name`, `quantity`, `price_brl`, `featured`, `sort_order`. Seed com 4 pacotes (500 / 1.000 / 5.000 / 20.000).
- Nova tabela `dm_purchases` (substitui `wallet_transactions`): `id`, `user_id`, `package_id`, `quantity`, `price_brl`, `status` (paid/pending), `created_at`. RLS owner-only.
- Função `purchase_dm_package(package_id)` SECURITY DEFINER: cria `dm_purchases` (paid simulado) + incrementa `dm_balance` atomicamente.
- Função `consume_dms(campaign_id, qty)` SECURITY DEFINER: valida saldo, decrementa `dm_balance`, incrementa `campaigns.dm_sent`, marca campanha como `completed` quando `dm_sent >= dm_total`.

### 2. Frontend — rotas e telas

- **Renomear** `/wallet` → `/store` (Loja de DMs). Substituir `BalanceCard` (cartão de crédito virtual) por **grid de pacotes** com ícone de pacote, quantidade grande (ex: "1.000 DMs"), preço, badge "Mais popular" e CTA "Comprar agora". Histórico vira lista de compras (data, pacote, qtd, preço).
- **Dashboard `/`**: trocar KPIs de dinheiro por:
  1. DMs disponíveis (saldo) — tile hero grande
  2. DMs enviadas (acumulado)
  3. DMs restantes em campanhas ativas
  4. Total de campanhas
  5. Cliques totais
  6. CTR médio
  Manter gráfico de performance diária (impressões/cliques/conversões), funnel, heatmap, feed ao vivo, top campanhas (mostrando barra `dm_sent / dm_total` em vez de gasto/orçamento).
- **`/campaigns/new`**: trocar etapa de "orçamento (R$)" por "**Quantidade de DMs**" com slider (mínimo 100, máximo = saldo do usuário) + cards de atalho (250 / 500 / 1k / saldo total). Validação: bloqueia avançar se saldo insuficiente, com CTA "Comprar mais DMs" → `/store`. Manter wizard de 5 etapas, preview Telegram, segmentação.
- **`/campaigns`**: tabela passa a mostrar `Progresso (dm_sent/dm_total)` com barra, `Cliques`, `CTR`, `Status`. Remove colunas "Gasto" e "Orçamento".
- **`/campaigns/$id`**: header com barra grande de progresso `[████░░] 60% — 600/1.000 DMs enviadas`. Aba Overview troca métricas monetárias por DMs entregues/restantes. Mantém abas Entrega/Público/Destinatários.
- **AppLayout**:
  - Sidebar: trocar item "Carteira" por "**Loja**" (ícone `Package`). Indicador de saldo de DMs no topo da sidebar (chip com `Zap` + número).
  - **Mobile**: adicionar **bottom nav fixo** com 5 ícones (Dashboard, Campanhas, **+ Criar** central destacado, Loja, Perfil) — só aparece em `< md`. Sidebar vira off-canvas em mobile.

### 3. Lógica/queries

- `src/lib/queries.ts`: adicionar `useDMBalance()`, `usePackages()`, `usePurchases()`, `usePurchasePackage()`, `useConsumeDMs()`. Remover hooks de `wallet_transactions`.
- `src/lib/fake-metrics.ts`: ajustar para gerar `dmsSent` proporcional ao tempo decorrido desde criação da campanha até atingir `dm_total`. Cliques/impressões/CTR continuam derivados.
- Simulador de progresso: ao iniciar campanha (status `active`), avança `dm_sent` no client a cada N segundos via interval (apenas visual; persistência opcional via `consume_dms` em batch a cada minuto).

### 4. Visual / UX

- Manter design system TeleAds Pro (Space Grotesk, paleta azul Telegram, tiles glass, animações count-up).
- Pacotes na loja: cards com gradiente sutil por tamanho (500 azul, 1k cyan, 5k magenta, 20k dourado), ícone `Package`/`Zap`, animação de hover (scale 1.03 + glow).
- Toasts (`sonner`) em compra de pacote, criação/pausa de campanha e erro de saldo insuficiente.
- Barra de progresso DMs com gradiente animado e contador `tabular`.

### Fora do escopo

- Integração real com Telegram Bot API e fila BullMQ (mantém simulação determinística — backend real fica para iteração futura).
- Gateway de pagamento real (compra é simulada e credita DMs imediatamente; integração Stripe/Pix pode entrar depois).
- Não mexer em auth, RLS de tabelas existentes além das mudanças listadas.

### Arquivos a criar / editar

- **Novos**: `src/components/PackageCard.tsx`, `src/components/DMProgressBar.tsx`, `src/components/MobileBottomNav.tsx`, `src/components/DMBalanceChip.tsx`, `src/routes/_app.store.tsx`.
- **Editar**: `AppLayout.tsx`, `_app.index.tsx`, `_app.campaigns.index.tsx`, `_app.campaigns.new.tsx`, `_app.campaigns.$id.tsx`, `queries.ts`, `fake-metrics.ts`, `format.ts` (helper `dms(n)`).
- **Remover**: `_app.wallet.tsx`, `BalanceCard.tsx` (substituídos).
- **Migration**: schema + seed de pacotes + funções RPC.
