# FinGestão - Aplicativo de Gestão Financeira Pessoal

> **Trabalho Acadêmico:** *Aplicativo de Gestão Financeira Pessoal: Uma Ferramenta para Organização e Controle de Gestão*  
> **Autores:** Dennis Gabriel de Oliveira e Murilo da Silva Santos  
> **Instituição:** Centro Universitário Cesumar – UNICESUMAR (Curitiba – PR)  
> **Curso:** Análise e Desenvolvimento de Sistemas  
> **Evento:** XIII Mostra Interna de Trabalhos de Iniciação Científica e VI Mostra Interna de Iniciação em Desenvolvimento Tecnológico e Inovação

---

## 🎯 Sobre o Sistema

O **FinGestão** é uma aplicação web completa desenvolvida com o objetivo de democratizar o planejamento financeiro pessoal, auxiliando na organização, acompanhamento e análise estruturada de receitas e despesas.

O sistema foi concebido com uma **interface moderna e agradável em tons de azul**, garantindo facilidade de uso, privacidade de dados (sem conexão bancária externa, conforme premissa metodológica) e recursos avançados de acessibilidade para diferentes públicos, incluindo a terceira idade.

---

## 🚀 Como Executar Localmente

Você tem duas formas simples e práticas de executar o projeto:

### Opção 1: Execução Direta no Navegador (Mais Rápida e 100% Offline)
Basta dar um duplo clique no arquivo:
```
abrir_no_navegador.bat
```
*(ou simplesmente abrir o arquivo `index.html` em qualquer navegador: Google Chrome, Microsoft Edge, Brave, etc.)*

- **Vantagem:** Não requer nenhum servidor ou dependência instalada.
- **Persistência:** Utiliza `LocalStorage` criptografado no navegador. Todos os dados permanecem salvos entre sessões.

### Opção 2: Execução com Servidor Back-end Java (Conforme Artigo)
Dê um duplo clique no arquivo:
```
iniciar_servidor.bat
```
- O script detecta automaticamente o Java instalado (ou o JBR do IntelliJ IDEA), compila o servidor se necessário e inicia a aplicação em:
```
http://localhost:8080
```
- **Persistência:** Sincroniza em tempo real com o arquivo `data/database.json`.

---

## 📋 Atendimento aos Objetivos Específicos do Artigo

O projeto atende de forma integral a todos os objetivos e diretrizes definidos na pesquisa:

| Objetivo Específico do Artigo | Como foi Implementado no Sistema |
| :--- | :--- |
| **1. Desenvolver uma interface acessível e intuitiva para facilitar o registro e a organização** | Interface em tons de azul, moderna, com cartões informativos, feedback instantâneo (toasts), atalhos de teclado e **modo de acessibilidade para idosos** (botões de ampliação de fonte `A`, `A+`, `A++` e modo de alto contraste). |
| **2. Permitir o cadastro e gerenciamento de receitas e despesas (CRUD completo)** | Cadastro, listagem, edição e exclusão de movimentações financeiras com valor, categoria, data, forma de pagamento (PIX, cartões, boleto, etc.) e anotações. |
| **3. Categorizar receitas e despesas (automática e manual)** | **Classificação Automática Inteligente:** ao digitar descrições como *"Supermercado"*, *"Gasolina Shell"*, *"Salário"*, *"Farmácia"*, o sistema identifica palavras-chave e auto-seleciona a categoria. Permite também **criação e edição manual de novas categorias** personalizadas com cores e ícones. |
| **4. Apresentar dados por meio de gráficos e relatórios visuais** | Motor nativo de gráficos SVG: **Gráfico de Rosquinha (Donut)** de gastos por categoria com tooltips interativos; **Gráfico de Barras** comparativo mês a mês; **Gráfico de Linha** de fluxo diário de caixa; e **Relatório Consolidado** com exportação em CSV e impressão limpa formatada em PDF. |
| **5. Disponibilizar histórico das movimentações para acompanhamento** | Tabela dinâmica com busca textual em tempo real, filtros por tipo (Receita/Despesa), categoria, mês/ano e ordenação por data ou valor. |
| **6. Auxiliar no controle do orçamento pessoal e metas financeiras** | Módulo de **Tetos Orçamentários por Categoria** com barras de progresso visuais e **alertas preventivos** (amarelo ao atingir 80% e vermelho ao estourar o limite); e **Metas Financeiras** (Reserva de Emergência, Sonhos) com acompanhamento percentual e aportes. |

---

## 🧠 Módulo Especial: Psicologia Econômica e Combate ao Consumismo

Alinhado com a fundamentação teórica de **Ferreira (2007)**, **Max Weber (1967)** e **Galbraith (1963)** citados no artigo:

1. **Calculadora "Custo em Horas de Trabalho":** Converte o preço de um bem de consumo impulsivo em horas e dias reais de trabalho que o usuário precisa cumprir para pagá-lo, estimulando a reflexão antes da compra.
2. **Quarentena dos Desejos (Regra das 72 Horas):** Lista de espera para compras impulsivas, auxiliando na redução de decisões emocionais induzidas por crédito fácil.
3. **Diretriz 50-30-20:** Termômetro visual de saúde financeira dividindo a renda entre gastos essenciais, estilo de vida e poupança/futuro (Savoia et al., 2007; Potrich et al., 2015).

---

## 📸 Roteiro de Prints para Inserir no Artigo Científico

Na página 9 do template do artigo, constam as anotações: `FALTA OS PRINTS`, `Apresentar linguagem`, `Falar se conseguiu ou não fazer o projeto`, `Responder os objetivos específicos`.

Aqui estão as telas sugeridas para captura de tela e inserção no artigo:

- **Figura 1 – Dashboard Geral do Sistema com Indicadores KPIs e Gráficos:**
  *(Abra a aba "Visão Geral" e capture a tela mostrando os cards em azul, o gráfico de rosquinha de despesas por categoria e o comparativo mensal).*
- **Figura 2 – Histórico e Tabela Interativa de Movimentações:**
  *(Abra a aba "Movimentações" com os filtros aplicados e a tabela detalhada).*
- **Figura 3 – Mecanismo de Classificação Automática por Palavras-Chave:**
  *(Abra o modal de "+ Nova Movimentação" e digite "Supermercado Muffato" para capturar o badge verde ✨ indicando a auto-categorização).*
- **Figura 4 – Controle de Tetos Orçamentários e Alertas Preventivos:**
  *(Capture a aba "Orçamentos & Metas" destacando as barras de consumo do teto por categoria e metas de reserva).*
- **Figura 5 – Módulo de Psicologia Econômica e Consumo Consciente:**
  *(Capture a aba "Consumo Consciente" com o cálculo de horas de trabalho e a quarentena de 72h).*
- **Figura 6 – Relatório Consolidado e Exportação para Impressão:**
  *(Capture a aba "Relatórios" mostrando o resumo executivo pronto para exportar).*
- **Figura 7 – Recursos de Acessibilidade para a Terceira Idade:**
  *(Ative o botão `A+` ou `Alto Contraste` para demonstrar a inclusão de usuários idosos descrita na metodologia).*

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** HTML5 semântico, CSS3 Moderno (Design System em Azul com Variáveis CSS e Grid/Flexbox), JavaScript ES6+ Vanilla.
- **Gráficos:** SVG Nativos desenvolvidos sob medida (independentes de internet, rápidos e com renderização nítida em qualquer resolução).
- **Back-end:** Java (OpenJDK / JDK 18+) utilizando `com.sun.net.httpserver.HttpServer` nativo para criação de servidor HTTP e endpoints REST (`/api/status`, `/api/data`).
- **Armazenamento de Dados:** Arquivo estruturado JSON (`data/database.json`) com sincronização bidirecional e contingência em `LocalStorage`.

---

## 📂 Estrutura de Pastas do Projeto

```
App/
├── index.html                   # Página principal da aplicação web
├── css/
│   └── style.css                # Folha de estilos e Design System em Azul
├── js/
│   ├── app.js                   # Lógica principal, rotas, filtros e CRUD
│   ├── charts.js                # Motor de gráficos SVG nativos
│   ├── autoCategory.js          # Classificador inteligente por palavras-chave
│   └── mockData.js              # Dados padrão e sementes realistas
├── src/main/java/com/gestaofinanceira/
│   └── Server.java              # Servidor HTTP REST em Java
├── data/
│   └── database.json            # Base de dados JSON local
├── bin/                         # Bytecodes Java compilados
├── abrir_no_navegador.bat       # Atalho para abrir direto no navegador
├── iniciar_servidor.bat         # Atalho para iniciar o servidor Java
├── README.md                    # Documentação do sistema e guia acadêmico
└── TEMPLATE-ARTIGO .docx.pdf    # Artigo científico de referência
```

---
*Centro Universitário Cesumar – UNICESUMAR | Curitiba – PR*
