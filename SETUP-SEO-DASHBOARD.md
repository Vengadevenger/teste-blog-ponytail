# Como configurar o Dashboard SEO

O dashboard fica em **`/admin/seo`** (ex.: `http://localhost:3000/admin/seo`).
Ele é protegido por senha e não aparece no Google.

## 1. Definir a senha de acesso (obrigatório)

1. Na raiz do projeto, crie um arquivo chamado `.env.local` (se ele ainda não existir)
2. Adicione esta linha, trocando `minha-senha-secreta` pela senha que você quiser:

```
SEO_DASHBOARD_PASSWORD=minha-senha-secreta
```

3. Reinicie o servidor (`npm run dev`) e acesse `/admin/seo`
4. Digite a senha — pronto, você fica logado por 7 dias neste navegador

> ⚠️ O arquivo `.env.local` nunca vai para o GitHub (já está no `.gitignore`).
> É assim que as senhas e chaves ficam só na sua máquina.

## 2. Rodar a auditoria (funciona sem configurar mais nada)

Dentro do dashboard, clique em **"Rodar auditoria"**. O sistema descobre
sozinho todas as páginas do site, analisa o HTML como o Google vê, mostra
cada problema com explicação simples e gera a fila de tarefas priorizadas.

## 3. Conectar as ferramentas de SEO (aba "Integrações")

Todas grátis. A aba **Integrações** do dashboard tem as mesmas instruções
abaixo, com botão "Testar conexão" para conferir cada uma.

### 3.1 Google Search Console (a mais importante — comece por ela)

É o Google te contando quais buscas mostram seu site, em que posição, e
quantas pessoas clicam.

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e crie um
   projeto (grátis, não pede cartão)
2. Menu ☰ → **APIs e serviços** → **Biblioteca** → procure **"Google Search
   Console API"** → **Ativar**
3. Menu ☰ → **IAM e administrador** → **Contas de serviço** → **Criar conta de
   serviço** → dê qualquer nome (ex.: "dashboard-seo") → **Concluir**
4. Clique na conta criada → aba **Chaves** → **Adicionar chave** → **JSON**.
   Um arquivo será baixado — guarde-o, ele é a "senha" da conta
5. Abra o arquivo baixado num editor de texto e copie dois valores para o
   `.env.local`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=valor do campo "client_email"
GOOGLE_PRIVATE_KEY="valor do campo "private_key" (cole inteiro, entre aspas, com os \n)"
```

6. Acesse [search.google.com/search-console](https://search.google.com/search-console),
   abra a propriedade do site → **Configurações** → **Usuários e permissões** →
   **Adicionar usuário** → cole o `client_email` → permissão **Total**
7. Se a sua propriedade no Search Console for do tipo "Prefixo do URL" (em vez
   de Domínio), adicione também no `.env.local`:

```
GSC_PROPERTY=https://colabola.com.br/
```

8. Reinicie o servidor e clique em **Testar conexão** na aba Integrações

### 3.2 Google Analytics 4

Usa a mesma conta de serviço do passo anterior.

1. Em [analytics.google.com](https://analytics.google.com): **Administrador** →
   coluna Propriedade → **Gerenciamento de acesso à propriedade** → adicione o
   `client_email` com papel **Leitor**
2. Ainda no Administrador → **Configurações da propriedade** → copie o **ID da
   propriedade** (só números) e adicione ao `.env.local`:

```
GA4_PROPERTY_ID=123456789
```

3. Reinicie o servidor e teste a conexão

### 3.3 PageSpeed Insights (a mais fácil)

1. No mesmo projeto do [console.cloud.google.com](https://console.cloud.google.com):
   **APIs e serviços** → **Biblioteca** → ative a **"PageSpeed Insights API"**
2. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **Chave de
   API** → copie a chave:

```
PAGESPEED_API_KEY=AIza...
```

3. Reinicie o servidor e teste. A medição leva ~1 minuto e fica guardada por
   7 dias (o botão "Atualizar performance" força uma nova medição)

### 3.4 IndexNow (Bing e outros buscadores)

Não precisa de chave externa — clique em **"Ativar IndexNow"** na aba
Integrações. O dashboard gera a chave e publica o arquivo de verificação
sozinho. Depois, o botão **"Notificar buscadores"** avisa Bing/Yandex sobre
todas as páginas do site (use após publicar posts novos).

> 💡 Bônus: cadastre o site no [Bing Webmaster Tools](https://www.bing.com/webmasters)
> — dá para importar tudo do Search Console com 1 clique, e o Bing passa a
> mostrar suas próprias métricas por lá.

## 4. Resumo das chaves no .env.local

```
SEO_DASHBOARD_PASSWORD=sua-senha
GOOGLE_SERVICE_ACCOUNT_EMAIL=dashboard-seo@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GA4_PROPERTY_ID=123456789
PAGESPEED_API_KEY=AIza...
GSC_PROPERTY=sc-domain:colabola.com.br   # opcional
```

## E as ferramentas pagas (Ahrefs, Semrush)?

A arquitetura está pronta para recebê-las (um arquivo novo em
`lib/seo-providers/`), mas as APIs delas custam caro e o contrato do projeto
as deixa fora do escopo. As ferramentas acima cobrem o essencial de graça.
