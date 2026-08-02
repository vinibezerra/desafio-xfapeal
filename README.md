# Educação em Alagoas

Esse projeto é uma aplicação full-stack que recebe um arquivo CSV com dados educacionais dos municípios do estado. O envio é feito pela tela de upload, depois o backend valida o arquivo e salva os dados no banco. Quando a importação termina, a aplicação mostra quantas linhas foram lidas, quantas entraram no banco, quantas foram rejeitadas e o motivo de cada erro.

Depois da importação, dá pra visualizar tudo em um dashboard com filtros por município, período, rede e etapa de ensino. A tela tem cards, série temporal, ranking dos municípios, gráfico por rede ou etapa e uma tabela paginada. A ideia não foi só jogar os dados na tela, mas também tomar cuidado com umas situações que vieram nesse desafio, tipo hierarquia das redes, cálculo de percentuais e a diferença entre valor zero e dado inexistente.

## Tecnologias usadas

- React, TypeScript, Vite, Tailwind CSS e Recharts no frontend;
- Node.js, Express, TypeScript e Zod no backend;
- PostgreSQL com Drizzle ORM;
- Vitest e Supertest nos testes.

## Como rodar o projeto do zero

### O que precisa ter instalado

- Node.js 20 ou superior;
- npm;
- PostgreSQL 14 ou superior.

### 1. Clonar o projeto

```bash
git clone https://github.com/vinibezerra/desafio-xfapeal.git
cd desafio-xfapeal
```

### 2. Preparar o backend

```bash
cd backend
npm install
```

Depois, crie o arquivo `.env` usando o [`backend/.env.example`](backend/.env.example) como base:

```env
PORT=3333
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/educacao_alagoas
CORS_ORIGIN=http://localhost:5173
```

No Linux ou macOS:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Com isso pronto, crie o banco, as tabelas e os índices:

```bash
npm run db:setup
```

Agora é só iniciar a API:

```bash
npm run dev
```

A API vai ficar disponível em `http://localhost:3333`. Pra conferir se está tudo certo, dá pra acessar `GET /api/health`.

### 3. Preparar o frontend

Abra outro terminal na raiz do projeto e rode:

```bash
cd frontend
npm install
npm run dev
```

Depois, abra `http://localhost:5173` no navegador.

Por padrão, o frontend busca a API em `http://localhost:3333/api`. Se ela estiver rodando em outro endereço, é só criar um `.env` no frontend:

```env
VITE_API_URL=http://localhost:3333/api
```

### 4. Importar o CSV

Na página inicial, selecione o arquivo `.csv` e espere o processamento terminar. No final, a própria tela mostra o resumo da importação e libera o acesso ao dashboard.

Também deixei a opção de fazer a importação pelo terminal:

```bash
cd backend
npm run import:csv -- "caminho/educacao_alagoas_amostra.csv"
```

## Formato esperado do CSV

O arquivo precisa estar em UTF-8, usar vírgula como separador e ter no máximo 20 MB. O cabeçalho esperado é este:

```text
co_mun,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor
```

Durante a validação, são conferidos:

- código IBGE como texto com exatamente sete dígitos;
- ano inteiro entre 2007 e 2025;
- campos obrigatórios;
- fontes, variáveis, redes e etapas permitidas;
- se a variável realmente pertence à fonte informada;
- valores numéricos e não negativos;
- percentuais entre 0 e 100;
- contagens absolutas sem casas decimais.

Se o cabeçalho ou a estrutura estiverem errados, a API responde com HTTP 400 e explica o problema. Agora, se só algumas linhas tiverem erro, elas são rejeitadas sem atrapalhar o restante da importação. A resposta mostra quantas linhas foram lidas, importadas e rejeitadas, além de trazer até 100 detalhes dos erros encontrados.

Os registros são inseridos em lotes de 500, tudo dentro de uma transação. O limite de 20 MB já cobre a base completa de mais ou menos 13 MB informada no desafio.

## Como os dados foram tratados

Essa foi uma das partes que mais exigiu cuidado, porque uma soma que parece simples pode acabar gerando um resultado errado.

### Redes de ensino

As redes seguem esta hierarquia:

```text
Total = Pública + Privada
Pública = Estadual + Municipal + Federal
```

Então não dá pra simplesmente somar todas elas. Quando nenhuma rede é escolhida, uso somente `Total`. Se o usuário selecionar uma rede específica, considero só aquela rede.

No gráfico de divisão por rede, `Total` e `Pública` ficam de fora. Assim, o gráfico compara Estadual, Municipal, Federal e Privada sem contar os mesmos alunos mais de uma vez.

### Escolas ou ofertas de ensino

Uma mesma escola pode oferecer várias etapas. Por isso, somar `Escolas` entre Educação Infantil, Ensino Fundamental e Ensino Médio não representa a quantidade real de escolas diferentes.

Pra evitar essa confusão, quando nenhuma etapa está selecionada o card aparece como **Ofertas de ensino**. Se o usuário escolher uma etapa específica, aí ele passa a mostrar **Escolas**, já que o recorte fica bem definido.

### Percentuais

Os percentuais não são somados e também não usei média simples. Nos dados de aprovação, reprovação e abandono, a média é ponderada pela quantidade de matrículas. Já em alfabetização e analfabetismo, o peso usado é `Pessoas Total`.

```text
soma(taxa do grupo × população de referência)
------------------------------------------------
        soma(população de referência)
```

Esse cálculo é feito direto no PostgreSQL. Dessa forma, um município pequeno não recebe o mesmo peso de Maceió, por exemplo. A interface também avisa que o número mostrado é uma média ponderada.

### Fontes com períodos diferentes

Os dados do Censo Escolar e dos indicadores de rendimento são anuais. Já os dados demográficos da amostra só aparecem em 2010 e 2022.

Quando um indicador demográfico é escolhido sem uma rede ou etapa específica, o sistema usa automaticamente `Não se aplica` e `Pessoas de 15 anos ou mais de idade`. Os anos também não ficam fixos no frontend: as opções são carregadas de acordo com os registros que realmente existem no banco.

### Zero não é ausência

Um valor zero continua sendo exibido normalmente. Isso quer dizer que existe uma linha no CSV com o valor `0`.

Ausência é outra coisa: significa que não existe nenhuma linha para aquela combinação. Nesse caso, a API retorna `null` e o gráfico deixa uma lacuna. No Recharts, usei `connectNulls={false}` pra não transformar ausência em zero e nem ligar dois pontos como se existisse algum dado entre eles.

### Reimportação

Decidi bloquear a importação quando o mesmo conjunto de dados for enviado de novo.

Depois da validação, é gerado um hash SHA-256 das linhas válidas. Esse hash fica salvo no banco com uma restrição única. Se o mesmo conjunto já tiver sido importado, a API responde com HTTP 409 e nenhum dado é duplicado. Tanto o registro da importação quanto as linhas do CSV são salvos na mesma transação.

Uma limitação atual é que a ordem das linhas também entra no hash. Então, se alguém mandar exatamente os mesmos registros, mas em outra ordem, o arquivo pode ser entendido como um conjunto novo.

### Banco e agregações

Mantive os registros no formato longo do CSV e deixei as agregações por conta das consultas SQL. Com isso, o frontend recebe só o resultado necessário pra cada gráfico, em vez de carregar as 145 mil linhas completas.

Também criei um índice composto em `(ano, variavel, ensino_rede, ensino_tipo)` e outro para `co_mun`. A tabela usa `LIMIT` e `OFFSET`, então a paginação acontece no servidor.

## Conferência dos resultados

Usei os números passados no desafio pra conferir se o processamento da amostra estava certo:

| Medida | Resultado |
| --- | ---: |
| Linhas de dados | 3.534 |
| Municípios | 10 |
| Anos | 2010, 2019, 2021, 2022 e 2023 |
| Matrículas em 2023, rede Total, cinco etapas | 380.454 |
| Matrículas em Maceió, 2023, Ensino Fundamental, rede Total | 109.026 |
| Aprovação ponderada, Ensino Fundamental, 2023, rede Total | 96,16% |
| Analfabetismo em Maceió | 11,86% em 2010 e 8,42% em 2022 |
| Analfabetismo em Piaçabuçu | 31,77% em 2010 e 22,83% em 2022 |

## Endpoints principais

| Método | Endpoint | O que faz |
| --- | --- | --- |
| `POST` | `/api/education/import` | Importa o CSV enviado no campo `file` |
| `GET` | `/api/education/filters` | Retorna as opções dos filtros |
| `GET` | `/api/education/summary` | Retorna os valores dos cards |
| `GET` | `/api/education/series` | Retorna a série temporal |
| `GET` | `/api/education/ranking` | Retorna o ranking dos municípios |
| `GET` | `/api/education/breakdown` | Retorna a divisão por rede ou etapa |
| `GET` | `/api/education/data` | Retorna a tabela paginada |
| `GET` | `/api/health` | Verifica o estado da API |

Os filtros são enviados pelos parâmetros `municipality`, `yearStart`, `yearEnd`, `network` e `educationType`. Alguns endpoints também recebem `variable`, `dimension`, `page` e `pageSize`. Se quiser filtrar vários municípios, é só repetir o parâmetro `municipality`.

## Testes

Pra testar o backend:

```bash
cd backend
npm test
npm run typecheck
npm run build
```

Pra conferir o frontend:

```bash
cd frontend
npm run lint
npm run build
```

Os testes cobrem o parser do CSV, validações, linhas inválidas, percentuais, preservação do zero, ausência de dados, redes hierárquicas, média ponderada e respostas básicas da API.

## O que ficou de fora

Preferi focar primeiro no upload, nas validações e em deixar os cálculos certos. Por isso, algumas coisas opcionais ficaram de fora:

- importação em streaming: hoje o arquivo fica na memória e o parsing é síncrono. Para os 13 MB informados no desafio isso funciona dentro do limite, mas streaming seria uma opção melhor para arquivos maiores;
- Docker Compose: o PostgreSQL precisa ser configurado localmente;
- Swagger/OpenAPI e GitHub Actions;
- mapa e enriquecimento com fontes externas;
- deploy público.

O projeto funciona só com o CSV e não precisa buscar dados em nenhuma API externa. Se sobrasse mais tempo, eu faria a importação por streaming, criaria testes usando um PostgreSQL separado, testaria o desempenho com a base completa e deixaria os testes e o build rodando automaticamente no GitHub Actions.

## Deploy

Ainda não fiz o deploy público. Por enquanto, o projeto roda localmente seguindo os passos deste README.

Muito obrigado!
