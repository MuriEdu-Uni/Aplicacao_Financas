/**
 * Aplicação de Gestão Financeira Pessoal
 * Autores: Dennis Gabriel de Oliveira, Murilo da Silva Santos
 * Instituição: Centro Universitário Cesumar - UNICESUMAR
 */

class FinancialApp {
  constructor() {
    this.state = {
      transactions: [],
      categories: [],
      goals: [],
      profile: {},
      impulseList: [],
      currentFilter: {
        month: new Date().getMonth(), // 0 a 11
        year: new Date().getFullYear(),
        type: 'all',
        categoryId: 'all',
        search: '',
        sortBy: 'date-desc'
      },
      currentTab: 'dashboard',
      backendAvailable: false,
      editingTransactionId: null
    };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
    this.applyAccessibilitySettings();
    this.renderAll();
    this.checkBudgetsAndAlerts();
    console.log('🚀 Aplicativo de Gestão Financeira Pessoal inicializado com sucesso.');
  }

  // --- PERSISTÊNCIA & CARREGAMENTO DE DADOS ---

  async loadInitialData() {
    // 1. Tenta carregar do backend Java se disponível
    try {
      const response = await fetch('/api/data', { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        this.state.transactions = data.transactions || [];
        this.state.categories = data.categories || DEFAULT_CATEGORIES;
        this.state.goals = data.goals || DEFAULT_GOALS;
        this.state.profile = data.profile || DEFAULT_USER_PROFILE;
        this.state.impulseList = data.impulseList || [];
        this.state.backendAvailable = true;
        this.updateSyncStatusBadge(true);
        return;
      }
    } catch (e) {
      // Backend não conectado no momento, fallback transparente para LocalStorage
    }

    // 2. Fallback para LocalStorage
    this.state.backendAvailable = false;
    this.updateSyncStatusBadge(false);

    const savedTx = localStorage.getItem('gestao_fin_transactions');
    const savedCat = localStorage.getItem('gestao_fin_categories');
    const savedGoals = localStorage.getItem('gestao_fin_goals');
    const savedProfile = localStorage.getItem('gestao_fin_profile');
    const savedImpulse = localStorage.getItem('gestao_fin_impulse');

    if (savedTx && savedCat) {
      this.state.transactions = JSON.parse(savedTx);
      this.state.categories = JSON.parse(savedCat);
      this.state.goals = savedGoals ? JSON.parse(savedGoals) : DEFAULT_GOALS;
      this.state.profile = savedProfile ? JSON.parse(savedProfile) : DEFAULT_USER_PROFILE;
      this.state.impulseList = savedImpulse ? JSON.parse(savedImpulse) : [];
    } else {
      // Preenchimento inicial padrão do mockData
      this.state.transactions = getInitialTransactions();
      this.state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.state.goals = JSON.parse(JSON.stringify(DEFAULT_GOALS));
      this.state.profile = JSON.parse(JSON.stringify(DEFAULT_USER_PROFILE));
      this.state.impulseList = [
        {
          id: 'imp_1',
          name: 'Tênis Esportivo Lançamento',
          price: 599.90,
          dateAdded: new Date(Date.now() - 24 * 3600 * 1000 * 1.5).toISOString(),
          decision: 'pending',
          reason: 'Visto em promoção na internet'
        }
      ];
      this.saveData();
    }
  }

  async saveData() {
    // Salva no LocalStorage
    localStorage.setItem('gestao_fin_transactions', JSON.stringify(this.state.transactions));
    localStorage.setItem('gestao_fin_categories', JSON.stringify(this.state.categories));
    localStorage.setItem('gestao_fin_goals', JSON.stringify(this.state.goals));
    localStorage.setItem('gestao_fin_profile', JSON.stringify(this.state.profile));
    localStorage.setItem('gestao_fin_impulse', JSON.stringify(this.state.impulseList));

    // Se backend estiver disponível, envia sincronização assíncrona
    if (this.state.backendAvailable) {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: this.state.transactions,
            categories: this.state.categories,
            goals: this.state.goals,
            profile: this.state.profile,
            impulseList: this.state.impulseList
          })
        });
      } catch (err) {
        console.warn('Erro ao sincronizar com backend Java:', err);
      }
    }
  }

  updateSyncStatusBadge(isOnline) {
    const badge = document.getElementById('syncStatusBadge');
    if (!badge) return;
    if (isOnline) {
      badge.className = 'status-badge online';
      badge.innerHTML = `<span class="badge-dot"></span> Servidor Java Conectado (Porta 8080)`;
      badge.title = 'Os dados estão sendo persistidos pelo servidor Java local e salvos no arquivo JSON.';
    } else {
      badge.className = 'status-badge local';
      badge.innerHTML = `<span class="badge-dot local"></span> Modo Local Offline (LocalStorage Seguro)`;
      badge.title = 'Os dados estão salvos localmente e protegidos no seu navegador, sem envio externo.';
    }
  }

  // --- EVENT LISTENERS & NAVEGAÇÃO ---

  setupEventListeners() {
    // Alternância de Abas
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Seletor de Período (Mês e Ano)
    const monthSelect = document.getElementById('filterMonth');
    const yearSelect = document.getElementById('filterYear');

    if (monthSelect) {
      monthSelect.value = this.state.currentFilter.month;
      monthSelect.addEventListener('change', (e) => {
        this.state.currentFilter.month = parseInt(e.target.value);
        this.renderAll();
      });
    }

    if (yearSelect) {
      yearSelect.value = this.state.currentFilter.year;
      yearSelect.addEventListener('change', (e) => {
        this.state.currentFilter.year = parseInt(e.target.value);
        this.renderAll();
      });
    }

    // Formulário de Transação - Auto-categorização em tempo real
    const descInput = document.getElementById('txDescription');
    if (descInput) {
      descInput.addEventListener('input', (e) => {
        this.handleAutoCategorySuggest(e.target.value);
      });
    }

    // Modal de Transação
    const formTx = document.getElementById('transactionForm');
    if (formTx) {
      formTx.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveTransaction();
      });
    }

    // Filtros da Tabela de Movimentações
    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.currentFilter.search = e.target.value;
        this.renderTransactionsTable();
      });
    }

    const filterType = document.getElementById('filterType');
    if (filterType) {
      filterType.addEventListener('change', (e) => {
        this.state.currentFilter.type = e.target.value;
        this.renderTransactionsTable();
      });
    }

    const filterCat = document.getElementById('filterCategory');
    if (filterCat) {
      filterCat.addEventListener('change', (e) => {
        this.state.currentFilter.categoryId = e.target.value;
        this.renderTransactionsTable();
      });
    }

    const sortSelect = document.getElementById('sortTransactions');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.currentFilter.sortBy = e.target.value;
        this.renderTransactionsTable();
      });
    }

    // Formulário de Categoria Personalizada
    const formCat = document.getElementById('categoryForm');
    if (formCat) {
      formCat.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveCategory();
      });
    }

    // Formulário de Metas
    const formGoal = document.getElementById('goalForm');
    if (formGoal) {
      formGoal.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveGoal();
      });
    }

    // Perfil & Configurações
    const formProfile = document.getElementById('profileForm');
    if (formProfile) {
      formProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveProfile();
      });
    }

    // Calculadora de Psicologia Econômica (Horas de Trabalho)
    const calcBtn = document.getElementById('calcWorkHoursBtn');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        this.calculateWorkHoursCost();
      });
    }

    // Formulário de Desejo de Impulso (Regra 72 Horas)
    const formImpulse = document.getElementById('impulseForm');
    if (formImpulse) {
      formImpulse.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddImpulseItem();
      });
    }

    // Atalhos de Teclado
    document.addEventListener('keydown', (e) => {
      // Pressionar 'N' abre nova transação (se não estiver em um input)
      if ((e.key === 'n' || e.key === 'N') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        this.openTransactionModal();
      }
      // Pressionar 'Esc' fecha modal aberto
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  switchTab(tabName) {
    this.state.currentTab = tabName;
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(section => {
      section.classList.toggle('active', section.id === `tab-${tabName}`);
    });

    // Renderiza conteúdo específico da aba
    if (tabName === 'dashboard') {
      this.renderDashboard();
    } else if (tabName === 'transactions') {
      this.renderTransactionsTable();
      this.populateCategorySelects();
    } else if (tabName === 'budgets') {
      this.renderBudgetsAndGoals();
    } else if (tabName === 'psychology') {
      this.renderPsychologyModule();
    } else if (tabName === 'reports') {
      this.renderReports();
    } else if (tabName === 'categories') {
      this.renderCategoryManager();
    } else if (tabName === 'profile') {
      this.renderProfileForm();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- RENDERIZAÇÃO GERAL ---

  renderAll() {
    this.renderHeaderSummary();
    this.populateCategorySelects();
    this.renderDashboard();
    this.renderTransactionsTable();
    this.renderBudgetsAndGoals();
    this.renderPsychologyModule();
    this.renderReports();
    this.renderCategoryManager();
  }

  // Filtra transações pelo mês e ano ativos no filtro
  getFilteredMonthTransactions() {
    const { month, year } = this.state.currentFilter;
    return this.state.transactions.filter(t => {
      if (!t.date) return false;
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return tYear === year && (tMonth - 1) === month;
    });
  }

  // 1. Resumo do Cabeçalho (Cards Principais)
  renderHeaderSummary() {
    const monthTx = this.getFilteredMonthTransactions();

    const totalIncome = monthTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = monthTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

    // Elementos DOM
    const elIncome = document.getElementById('headerTotalIncome');
    const elExpense = document.getElementById('headerTotalExpense');
    const elBalance = document.getElementById('headerBalance');
    const elSavingsRate = document.getElementById('headerSavingsRate');

    if (elIncome) elIncome.textContent = FinancialCharts.formatCurrency(totalIncome);
    if (elExpense) elExpense.textContent = FinancialCharts.formatCurrency(totalExpense);
    if (elBalance) {
      elBalance.textContent = FinancialCharts.formatCurrency(balance);
      elBalance.className = `stat-value ${balance >= 0 ? 'text-positive' : 'text-negative'}`;
    }
    if (elSavingsRate) {
      elSavingsRate.textContent = `${savingsRate}%`;
      elSavingsRate.className = `stat-badge ${savingsRate >= 20 ? 'badge-success' : (savingsRate >= 0 ? 'badge-warning' : 'badge-danger')}`;
    }

    // Saldo Total Geral Acumulado (Todo o histórico)
    const allTotalIncome = this.state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const allTotalExpense = this.state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const totalAccumulated = allTotalIncome - allTotalExpense;

    const elTotalAcc = document.getElementById('headerTotalAccumulated');
    if (elTotalAcc) {
      elTotalAcc.textContent = FinancialCharts.formatCurrency(totalAccumulated);
    }
  }

  // 2. Dashboard
  renderDashboard() {
    this.renderHeaderSummary();
    const monthTx = this.getFilteredMonthTransactions();

    // Gráfico Donut de Despesas por Categoria
    const expenseByCategory = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + Number(t.amount);
    });

    const donutData = Object.entries(expenseByCategory).map(([catId, value]) => {
      const cat = this.state.categories.find(c => c.id === catId) || { name: 'Outros', color: '#64748b' };
      return {
        label: cat.name,
        value: value,
        color: cat.color
      };
    }).sort((a, b) => b.value - a.value);

    FinancialCharts.renderDonutChart('donutChartContainer', donutData, { width: 340, height: 260 });

    // Gráfico de Barras Comparativo (Últimos 4 meses)
    const monthlyHistory = this.calculateMonthlyComparisonData(4);
    FinancialCharts.renderBarChart('barChartContainer', monthlyHistory, { width: 540, height: 260 });

    // Gráfico de Linha do Fluxo Diário
    const dailyPoints = this.calculateDailyFlow(this.state.currentFilter.year, this.state.currentFilter.month);
    FinancialCharts.renderLineChart('lineChartContainer', dailyPoints, { width: 540, height: 220 });

    // Mini lista de transações recentes no Dashboard
    this.renderRecentTransactions();

    // Indicador da Regra 50-30-20 no Dashboard
    this.renderRule503020();
  }

  // Gera dados comparativos de meses anteriores
  calculateMonthlyComparisonData(numMonths = 4) {
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result = [];
    const currYear = this.state.currentFilter.year;
    const currMonth = this.state.currentFilter.month;

    for (let i = numMonths - 1; i >= 0; i--) {
      let targetMonth = currMonth - i;
      let targetYear = currYear;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const txs = this.state.transactions.filter(t => {
        if (!t.date) return false;
        const [y, m] = t.date.split('-').map(Number);
        return y === targetYear && (m - 1) === targetMonth;
      });

      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

      result.push({
        monthLabel: `${monthsNames[targetMonth]}/${String(targetYear).slice(2)}`,
        income,
        expense
      });
    }

    return result;
  }

  // Gera dados diários para curva de evolução do saldo
  calculateDailyFlow(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthTx = this.getFilteredMonthTransactions();
    let runningBalance = 0;
    const points = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTx = monthTx.filter(t => {
        const parts = t.date.split('-').map(Number);
        return parts[2] === day;
      });

      const inc = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const exp = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      runningBalance += (inc - exp);

      if (day % 3 === 0 || day === 1 || day === daysInMonth) {
        points.push({ day, balance: runningBalance });
      }
    }
    return points;
  }

  // Mini Lista de Transações Recentes
  renderRecentTransactions() {
    const container = document.getElementById('recentTransactionsList');
    if (!container) return;

    const monthTx = this.getFilteredMonthTransactions()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (monthTx.length === 0) {
      container.innerHTML = `<div class="empty-list-message">Nenhuma movimentação neste mês. Clique em <strong>"+ Nova Movimentação"</strong> para cadastrar.</div>`;
      return;
    }

    container.innerHTML = monthTx.map(t => {
      const cat = this.state.categories.find(c => c.id === t.categoryId) || { name: 'Geral', color: '#64748b' };
      const isIncome = t.type === 'income';
      const formattedDate = this.formatDisplayDate(t.date);

      return `
        <div class="transaction-row-card">
          <div class="tx-badge-icon" style="background-color: ${cat.color}15; color: ${cat.color};">
            ${isIncome ? '▲' : '▼'}
          </div>
          <div class="tx-info-block">
            <span class="tx-desc">${t.description}</span>
            <span class="tx-cat-date">
              <span class="tx-category-pill" style="background-color: ${cat.color}20; color: ${cat.color};">${cat.name}</span>
              &bull; ${formattedDate} &bull; ${t.paymentMethod || 'PIX'}
            </span>
          </div>
          <div class="tx-amount-block ${isIncome ? 'amount-income' : 'amount-expense'}">
            ${isIncome ? '+' : '-'} ${FinancialCharts.formatCurrency(t.amount)}
          </div>
        </div>
      `;
    }).join('');
  }

  // Indicador 50-30-20 (Educação Financeira - Savoia et al., 2007)
  renderRule503020() {
    const container = document.getElementById('rule503020Container');
    if (!container) return;

    const monthTx = this.getFilteredMonthTransactions();
    const totalIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // Essenciais: Moradia, Alimentação, Saúde, Transporte
    const essentialCatIds = ['cat_moradia', 'cat_alimentacao', 'cat_saude', 'cat_transporte'];
    const essentialSpent = monthTx
      .filter(t => t.type === 'expense' && essentialCatIds.includes(t.categoryId))
      .reduce((s, t) => s + Number(t.amount), 0);

    // Supérfluos / Estilo de Vida: Lazer, Compras, etc.
    const lifestyleSpent = totalExpense - essentialSpent;
    const savings = Math.max(0, totalIncome - totalExpense);

    const base = totalIncome > 0 ? totalIncome : (totalExpense || 1);
    const essentialPct = Math.min(100, (essentialSpent / base) * 100).toFixed(0);
    const lifestylePct = Math.min(100, (lifestyleSpent / base) * 100).toFixed(0);
    const savingsPct = Math.min(100, (savings / base) * 100).toFixed(0);

    container.innerHTML = `
      <div class="rule-card">
        <div class="rule-header">
          <h4>Diretriz 50-30-20 de Saúde Financeira</h4>
          <span class="rule-tag">Potrich et al. (2015)</span>
        </div>
        <p class="rule-desc">Distribuição recomendada da renda para evitar o superendividamento:</p>
        
        <div class="rule-bars-grid">
          <!-- 50% Gastos Essenciais -->
          <div class="rule-metric">
            <div class="metric-top">
              <span>Gastos Essenciais (Meta: até 50%)</span>
              <strong>${essentialPct}% (${FinancialCharts.formatCurrency(essentialSpent)})</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${essentialPct > 55 ? 'fill-warning' : 'fill-primary'}" style="width: ${Math.min(100, essentialPct)}%;"></div>
            </div>
          </div>

          <!-- 30% Estilo de Vida / Supérfluos -->
          <div class="rule-metric">
            <div class="metric-top">
              <span>Estilo de Vida & Lazer (Meta: até 30%)</span>
              <strong>${lifestylePct}% (${FinancialCharts.formatCurrency(lifestyleSpent)})</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${lifestylePct > 35 ? 'fill-danger' : 'fill-accent'}" style="width: ${Math.min(100, lifestylePct)}%;"></div>
            </div>
          </div>

          <!-- 20% Poupança & Reserva -->
          <div class="rule-metric">
            <div class="metric-top">
              <span>Poupança & Futuro (Meta: min. 20%)</span>
              <strong>${savingsPct}% (${FinancialCharts.formatCurrency(savings)})</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${savingsPct >= 20 ? 'fill-success' : 'fill-warning'}" style="width: ${Math.min(100, savingsPct)}%;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- 3. HISTÓRICO E TABELA DE MOVIMENTAÇÕES (Objetivo Específico 5) ---

  renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    let filtered = [...this.state.transactions];

    // Filtro por Mês/Ano
    const { month, year, type, categoryId, search, sortBy } = this.state.currentFilter;
    filtered = filtered.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split('-').map(Number);
      return y === year && (m - 1) === month;
    });

    // Filtro por Tipo (income / expense)
    if (type !== 'all') {
      filtered = filtered.filter(t => t.type === type);
    }

    // Filtro por Categoria
    if (categoryId !== 'all') {
      filtered = filtered.filter(t => t.categoryId === categoryId);
    }

    // Busca textual
    if (search.trim()) {
      const term = AutoCategorizer.normalize(search);
      filtered = filtered.filter(t => {
        const cat = this.state.categories.find(c => c.id === t.categoryId);
        const catName = cat ? AutoCategorizer.normalize(cat.name) : '';
        const desc = AutoCategorizer.normalize(t.description);
        const notes = AutoCategorizer.normalize(t.notes || '');
        return desc.includes(term) || catName.includes(term) || notes.includes(term);
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    // Renderiza linhas
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-row">
            <div style="padding: 32px; text-align: center; color: #64748b;">
              <p style="font-size: 15px; margin-bottom: 8px;">Nenhuma movimentação encontrada com os filtros aplicados.</p>
              <button class="btn btn-secondary btn-sm" onclick="app.resetTableFilters()">Redefinir Filtros</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      const cat = this.state.categories.find(c => c.id === t.categoryId) || { name: 'Sem Categoria', color: '#64748b' };
      const isIncome = t.type === 'income';

      return `
        <tr class="tx-row">
          <td class="col-date">${this.formatDisplayDate(t.date)}</td>
          <td class="col-desc">
            <div class="desc-main"><strong>${t.description}</strong></div>
            ${t.notes ? `<div class="desc-sub">${t.notes}</div>` : ''}
          </td>
          <td class="col-cat">
            <span class="category-chip" style="border-left: 3px solid ${cat.color}; background-color: ${cat.color}15; color: ${cat.color};">
              ${cat.name}
            </span>
          </td>
          <td class="col-method">${t.paymentMethod || 'PIX'}</td>
          <td class="col-type">
            <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
              ${isIncome ? 'Receita' : 'Despesa'}
            </span>
          </td>
          <td class="col-amount ${isIncome ? 'text-positive' : 'text-negative'}">
            <strong>${isIncome ? '+' : '-'} ${FinancialCharts.formatCurrency(t.amount)}</strong>
          </td>
          <td class="col-actions">
            <div class="btn-group-actions">
              <button class="btn-icon" title="Editar movimentação" onclick="app.openEditTransactionModal('${t.id}')">
                ✏️
              </button>
              <button class="btn-icon btn-danger-icon" title="Excluir movimentação" onclick="app.handleDeleteTransaction('${t.id}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Atualiza contadores
    const countEl = document.getElementById('tableRecordsCount');
    if (countEl) countEl.textContent = `${filtered.length} registro(s) encontrado(s)`;
  }

  resetTableFilters() {
    this.state.currentFilter.type = 'all';
    this.state.currentFilter.categoryId = 'all';
    this.state.currentFilter.search = '';
    this.state.currentFilter.sortBy = 'date-desc';

    const sInput = document.getElementById('tableSearch');
    const fType = document.getElementById('filterType');
    const fCat = document.getElementById('filterCategory');
    const sSort = document.getElementById('sortTransactions');

    if (sInput) sInput.value = '';
    if (fType) fType.value = 'all';
    if (fCat) fCat.value = 'all';
    if (sSort) sSort.value = 'date-desc';

    this.renderTransactionsTable();
  }

  // --- 4. ORÇAMENTOS E METAS (Objetivo Específico 6) ---

  renderBudgetsAndGoals() {
    // 1. Orçamentos por Categoria (Teto de Gastos)
    const budgetContainer = document.getElementById('budgetsListContainer');
    if (budgetContainer) {
      const monthTx = this.getFilteredMonthTransactions();
      const expenseCats = this.state.categories.filter(c => c.type === 'expense');

      let totalBudget = 0;
      let totalSpentInBudgets = 0;

      const itemsHtml = expenseCats.map(cat => {
        const spent = monthTx
          .filter(t => t.type === 'expense' && t.categoryId === cat.id)
          .reduce((s, t) => s + Number(t.amount), 0);

        const limit = cat.budget || 0;
        totalBudget += limit;
        totalSpentInBudgets += spent;

        const pct = limit > 0 ? ((spent / limit) * 100).toFixed(0) : 0;
        const remaining = limit - spent;
        const isOver = spent > limit && limit > 0;
        const isWarning = pct >= 80 && !isOver;

        let statusClass = 'status-normal';
        let statusBadge = `<span class="badge badge-normal">Dentro do planejado</span>`;
        if (isOver) {
          statusClass = 'status-danger';
          statusBadge = `<span class="badge badge-danger">⚠️ Teto Ultrapassado (${pct}%)</span>`;
        } else if (isWarning) {
          statusClass = 'status-warning';
          statusBadge = `<span class="badge badge-warning">⚡ Atenção (80% atingido)</span>`;
        }

        return `
          <div class="budget-card ${statusClass}">
            <div class="budget-card-header">
              <div class="budget-cat-info">
                <span class="budget-color-indicator" style="background-color: ${cat.color};"></span>
                <strong>${cat.name}</strong>
              </div>
              <div class="budget-card-badge">${statusBadge}</div>
            </div>

            <div class="budget-values-row">
              <div>
                <span class="val-label">Gasto no Mês</span>
                <span class="val-amount ${isOver ? 'text-negative' : ''}">${FinancialCharts.formatCurrency(spent)}</span>
              </div>
              <div style="text-align: right;">
                <span class="val-label">Teto Orçado</span>
                <span class="val-amount">
                  ${FinancialCharts.formatCurrency(limit)}
                  <button class="btn-tiny" onclick="app.promptEditBudget('${cat.id}', ${limit})" title="Alterar limite">✏️</button>
                </span>
              </div>
            </div>

            <div class="progress-track" style="margin: 10px 0 6px 0;">
              <div class="progress-fill ${isOver ? 'fill-danger' : (isWarning ? 'fill-warning' : 'fill-primary')}" 
                   style="width: ${Math.min(100, pct)}%; background-color: ${isOver ? '#dc2626' : cat.color};">
              </div>
            </div>

            <div class="budget-footer-row">
              <span>${limit > 0 ? `${pct}% do teto consumido` : 'Sem teto definido'}</span>
              <span>${remaining >= 0 ? `Resta: ${FinancialCharts.formatCurrency(remaining)}` : `Estouro: ${FinancialCharts.formatCurrency(Math.abs(remaining))}`}</span>
            </div>
          </div>
        `;
      }).join('');

      budgetContainer.innerHTML = `
        <div class="budget-summary-banner">
          <div>
            <span class="banner-label">Teto Total Orçado no Mês:</span>
            <strong>${FinancialCharts.formatCurrency(totalBudget)}</strong>
          </div>
          <div>
            <span class="banner-label">Total Gasto:</span>
            <strong>${FinancialCharts.formatCurrency(totalSpentInBudgets)}</strong>
          </div>
          <div>
            <span class="banner-label">Saldo do Teto Geral:</span>
            <strong class="${totalBudget - totalSpentInBudgets >= 0 ? 'text-positive' : 'text-negative'}">
              ${FinancialCharts.formatCurrency(totalBudget - totalSpentInBudgets)}
            </strong>
          </div>
        </div>
        <div class="budgets-grid">
          ${itemsHtml}
        </div>
      `;
    }

    // 2. Metas Financeiras
    const goalsContainer = document.getElementById('goalsListContainer');
    if (goalsContainer) {
      if (this.state.goals.length === 0) {
        goalsContainer.innerHTML = `
          <div class="empty-state-card">
            <p>Você ainda não cadastrou nenhuma meta financeira.</p>
            <button class="btn btn-primary" onclick="app.openGoalModal()">+ Criar Primeira Meta</button>
          </div>
        `;
        return;
      }

      goalsContainer.innerHTML = this.state.goals.map(g => {
        const pct = Math.min(100, ((g.currentAmount / g.targetAmount) * 100)).toFixed(1);
        const remaining = Math.max(0, g.targetAmount - g.currentAmount);
        const isCompleted = g.currentAmount >= g.targetAmount;

        return `
          <div class="goal-card ${isCompleted ? 'goal-completed' : ''}">
            <div class="goal-header">
              <div>
                <h4 class="goal-title">${g.title}</h4>
                <p class="goal-desc">${g.description || ''}</p>
              </div>
              <div class="goal-actions">
                <button class="btn-icon" title="Excluir meta" onclick="app.handleDeleteGoal('${g.id}')">🗑️</button>
              </div>
            </div>

            <div class="goal-progress-numbers">
              <div>
                <span class="goal-num-label">Acumulado</span>
                <span class="goal-current-val">${FinancialCharts.formatCurrency(g.currentAmount)}</span>
              </div>
              <div style="text-align: right;">
                <span class="goal-num-label">Alvo</span>
                <span class="goal-target-val">${FinancialCharts.formatCurrency(g.targetAmount)}</span>
              </div>
            </div>

            <div class="progress-track" style="margin: 12px 0 8px 0;">
              <div class="progress-fill fill-primary" style="width: ${pct}%; background: linear-gradient(90deg, #2563eb, #38bdf8);"></div>
            </div>

            <div class="goal-footer">
              <span class="goal-pct-badge">${pct}% concluído</span>
              <span>${isCompleted ? '🎉 Meta Atingida!' : `Faltam ${FinancialCharts.formatCurrency(remaining)}`}</span>
            </div>

            <div class="goal-deposit-actions" style="margin-top: 14px; display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="app.promptDepositGoal('${g.id}')">
                💰 Fazer Aporte
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  promptEditBudget(catId, currentLimit) {
    const val = prompt('Digite o novo teto de gastos mensal para esta categoria (R$):', currentLimit);
    if (val !== null) {
      const num = parseFloat(val.replace(',', '.'));
      if (!isNaN(num) && num >= 0) {
        const cat = this.state.categories.find(c => c.id === catId);
        if (cat) {
          cat.budget = num;
          this.saveData();
          this.renderBudgetsAndGoals();
          this.showToast('Teto orçamentário atualizado com sucesso!', 'success');
        }
      } else {
        this.showToast('Valor inválido.', 'error');
      }
    }
  }

  promptDepositGoal(goalId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const val = prompt(`Quanto deseja aportar para a meta "${goal.title}"? (R$)`);
    if (val !== null) {
      const num = parseFloat(val.replace(',', '.'));
      if (!isNaN(num) && num > 0) {
        goal.currentAmount = Number(goal.currentAmount) + num;

        // Opcionalmente registra como transação na categoria de investimentos
        const shouldRecord = confirm('Deseja registrar este aporte como uma movimentação de poupança/reserva no histórico?');
        if (shouldRecord) {
          const now = new Date();
          const pad = n => String(n).padStart(2, '0');
          this.state.transactions.push({
            id: 'tx_' + Date.now(),
            description: `Aporte Meta: ${goal.title}`,
            amount: num,
            type: 'expense',
            categoryId: 'cat_outras_desp',
            date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
            paymentMethod: 'Transferência / PIX',
            status: 'completed',
            notes: `Direcionado para a meta ${goal.title}`
          });
        }

        this.saveData();
        this.renderAll();
        this.showToast(`Aporte de ${FinancialCharts.formatCurrency(num)} registrado com sucesso!`, 'success');
      }
    }
  }

  // --- 5. MÓDULO DE PSICOLOGIA ECONÔMICA & CONSUMO CONSCIENTE ---
  // (Baseado em Ferreira 2007, Galbraith 1963, Max Weber 1967, citados no artigo)

  renderPsychologyModule() {
    this.renderImpulseWaitlist();
    this.updateWorkHoursRates();
  }

  updateWorkHoursRates() {
    const rateEl = document.getElementById('calcHourlyRateDisplay');
    if (!rateEl) return;
    const salary = Number(this.state.profile.monthlyIncomeGoal) || 4500;
    const hours = Number(this.state.profile.workHoursPerMonth) || 160;
    const hourly = salary / hours;
    rateEl.textContent = `${FinancialCharts.formatCurrency(hourly)} / hora`;
  }

  calculateWorkHoursCost() {
    const priceInput = document.getElementById('calcItemPrice');
    const resultBox = document.getElementById('calcWorkHoursResult');
    if (!priceInput || !resultBox) return;

    const price = parseFloat(priceInput.value.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      resultBox.innerHTML = `<span class="text-negative">Informe um valor válido em reais.</span>`;
      resultBox.style.display = 'block';
      return;
    }

    const salary = Number(this.state.profile.monthlyIncomeGoal) || 4500;
    const hours = Number(this.state.profile.workHoursPerMonth) || 160;
    const hourly = salary / hours;
    const hoursNeeded = (price / hourly);
    const daysNeeded = (hoursNeeded / 8).toFixed(1);

    resultBox.innerHTML = `
      <div class="psych-result-card">
        <div class="result-number">⏱️ ${hoursNeeded.toFixed(1)} horas de trabalho</div>
        <p class="result-explain">
          Para comprar este item de <strong>${FinancialCharts.formatCurrency(price)}</strong>, você precisará dedicar 
          <strong>${hoursNeeded.toFixed(1)} horas</strong> da sua vida (aproximadamente <strong>${daysNeeded} dias de jornada diária</strong>).
        </p>
        <div class="result-quote">
          <em>"A obtenção de bens para suprir desejos e o consumo impulsivo aprisionam o indivíduo em uma jornada exaustiva de trabalho."</em>
          <br/><strong>— Max Weber & Galbraith (citados no artigo)</strong>
        </div>
      </div>
    `;
    resultBox.style.display = 'block';
  }

  renderImpulseWaitlist() {
    const container = document.getElementById('impulseListContainer');
    if (!container) return;

    if (!this.state.impulseList || this.state.impulseList.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <p>Sua lista de espera contra compras por impulso está limpa. Parabéns pelo controle emocional!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.state.impulseList.map(item => {
      const addedDate = new Date(item.dateAdded);
      const now = new Date();
      const diffHours = Math.floor((now - addedDate) / (1000 * 60 * 60));
      const hoursRemaining = Math.max(0, 72 - diffHours);
      const isReadyToDecide = hoursRemaining === 0;

      return `
        <div class="impulse-card ${item.decision !== 'pending' ? 'decided' : ''}">
          <div class="impulse-header">
            <div>
              <strong>${item.name}</strong>
              <div class="impulse-sub">${item.reason || 'Desejo de momento'}</div>
            </div>
            <span class="impulse-price">${FinancialCharts.formatCurrency(item.price)}</span>
          </div>

          <div class="impulse-timer-row">
            ${isReadyToDecide 
              ? `<span class="badge badge-success">✅ Período de 72h concluído! O desejo ainda persiste de forma racional?</span>`
              : `<span class="badge badge-warning">⏳ Aguarde mais ${hoursRemaining} horas para esfriar o impulso</span>`
            }
          </div>

          <div class="impulse-actions">
            ${item.decision === 'pending' ? `
              <button class="btn btn-sm btn-outline-danger" onclick="app.decideImpulse('${item.id}', 'avoided')">
                🚫 Desisti (Economizei!)
              </button>
              <button class="btn btn-sm btn-outline-primary" onclick="app.decideImpulse('${item.id}', 'bought')">
                🛒 Decisão Consciente de Compra
              </button>
            ` : `
              <span class="badge ${item.decision === 'avoided' ? 'badge-success' : 'badge-normal'}">
                ${item.decision === 'avoided' ? '🏆 Compra evitada! Dinheiro economizado.' : 'Consciente'}
              </span>
              <button class="btn-tiny" onclick="app.removeImpulse('${item.id}')">Remover</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  handleAddImpulseItem() {
    const nameEl = document.getElementById('impulseName');
    const priceEl = document.getElementById('impulsePrice');
    const reasonEl = document.getElementById('impulseReason');

    if (!nameEl || !priceEl) return;
    const name = nameEl.value.trim();
    const price = parseFloat(priceEl.value.replace(',', '.'));

    if (!name || isNaN(price) || price <= 0) {
      this.showToast('Preencha o nome e o preço corretamente.', 'error');
      return;
    }

    const newItem = {
      id: 'imp_' + Date.now(),
      name,
      price,
      reason: reasonEl ? reasonEl.value.trim() : '',
      dateAdded: new Date().toISOString(),
      decision: 'pending'
    };

    this.state.impulseList.unshift(newItem);
    this.saveData();
    this.renderImpulseWaitlist();
    this.showToast('Item adicionado à lista de reflexão de 72 horas!', 'success');

    // Limpa formulário
    nameEl.value = '';
    priceEl.value = '';
    if (reasonEl) reasonEl.value = '';
  }

  decideImpulse(id, decision) {
    const item = this.state.impulseList.find(i => i.id === id);
    if (!item) return;

    item.decision = decision;
    if (decision === 'avoided') {
      this.showToast(`Sensacional! Você economizou ${FinancialCharts.formatCurrency(item.price)} evitando uma compra impulsiva.`, 'success');
    } else if (decision === 'bought') {
      const record = confirm('Deseja cadastrar essa compra como despesa no histórico agora?');
      if (record) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        this.state.transactions.push({
          id: 'tx_' + Date.now(),
          description: item.name,
          amount: item.price,
          type: 'expense',
          categoryId: 'cat_compras',
          date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
          paymentMethod: 'Cartão de Crédito',
          status: 'completed',
          notes: 'Compra consciente após período de espera de 72h'
        });
      }
    }

    this.saveData();
    this.renderAll();
  }

  removeImpulse(id) {
    this.state.impulseList = this.state.impulseList.filter(i => i.id !== id);
    this.saveData();
    this.renderImpulseWaitlist();
  }

  // --- 6. RELATÓRIOS E EXPORTAÇÃO ---

  renderReports() {
    const monthTx = this.getFilteredMonthTransactions();
    const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonthLabel = `${monthsNames[this.state.currentFilter.month]} de ${this.state.currentFilter.year}`;

    const totalIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netBalance = totalIncome - totalExpense;

    // Encontra a maior despesa
    const expenses = monthTx.filter(t => t.type === 'expense');
    const largestExpense = expenses.length > 0 
      ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0])
      : null;

    const reportHeader = document.getElementById('reportPeriodTitle');
    if (reportHeader) reportHeader.textContent = `Relatório Financeiro Consolidado: ${currentMonthLabel}`;

    const reportContent = document.getElementById('reportMetricsContainer');
    if (reportContent) {
      reportContent.innerHTML = `
        <div class="report-kpi-grid">
          <div class="report-kpi-card">
            <span class="kpi-label">Total de Receitas</span>
            <span class="kpi-value text-positive">${FinancialCharts.formatCurrency(totalIncome)}</span>
            <span class="kpi-sub">${monthTx.filter(t => t.type === 'income').length} entrada(s)</span>
          </div>

          <div class="report-kpi-card">
            <span class="kpi-label">Total de Despesas</span>
            <span class="kpi-value text-negative">${FinancialCharts.formatCurrency(totalExpense)}</span>
            <span class="kpi-sub">${monthTx.filter(t => t.type === 'expense').length} saída(s)</span>
          </div>

          <div class="report-kpi-card">
            <span class="kpi-label">Resultado Líquido</span>
            <span class="kpi-value ${netBalance >= 0 ? 'text-positive' : 'text-negative'}">${FinancialCharts.formatCurrency(netBalance)}</span>
            <span class="kpi-sub">${netBalance >= 0 ? 'Superávit no período' : 'Déficit orçamentário'}</span>
          </div>

          <div class="report-kpi-card">
            <span class="kpi-label">Maior Gasto do Mês</span>
            <span class="kpi-value">${largestExpense ? FinancialCharts.formatCurrency(largestExpense.amount) : 'R$ 0,00'}</span>
            <span class="kpi-sub">${largestExpense ? largestExpense.description : 'Nenhuma despesa'}</span>
          </div>
        </div>
      `;
    }

    // Tabela resumida de categorias no relatório
    const catSummaryTable = document.getElementById('reportCategorySummaryTable');
    if (catSummaryTable) {
      const expenseByCategory = {};
      monthTx.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + Number(t.amount);
      });

      const rows = Object.entries(expenseByCategory).map(([catId, val]) => {
        const cat = this.state.categories.find(c => c.id === catId) || { name: 'Geral', color: '#64748b', budget: 0 };
        const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
        return `
          <tr>
            <td>
              <span class="legend-color-dot" style="background-color: ${cat.color};"></span>
              <strong>${cat.name}</strong>
            </td>
            <td>${FinancialCharts.formatCurrency(val)}</td>
            <td>${pct}%</td>
            <td>${cat.budget > 0 ? FinancialCharts.formatCurrency(cat.budget) : 'Não definido'}</td>
            <td>
              <span class="badge ${val > cat.budget && cat.budget > 0 ? 'badge-danger' : 'badge-success'}">
                ${val > cat.budget && cat.budget > 0 ? 'Excedeu Teto' : 'Regular'}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      catSummaryTable.innerHTML = rows || `<tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhuma despesa no período.</td></tr>`;
    }
  }

  exportCSV() {
    const monthTx = this.getFilteredMonthTransactions();
    if (monthTx.length === 0) {
      this.showToast('Nenhum dado para exportar neste período.', 'warning');
      return;
    }

    let csv = 'Data;Tipo;Descricao;Categoria;FormaPagamento;Valor;Observacoes\r\n';
    monthTx.forEach(t => {
      const cat = this.state.categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name : 'Outros';
      const cleanDesc = (t.description || '').replace(/;/g, ' ');
      const cleanNotes = (t.notes || '').replace(/;/g, ' ');
      const formattedAmount = Number(t.amount).toFixed(2).replace('.', ',');
      csv += `${t.date};${t.type === 'income' ? 'Receita' : 'Despesa'};"${cleanDesc}";"${catName}";"${t.paymentMethod}";${formattedAmount};"${cleanNotes}"\r\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${this.state.currentFilter.year}_${this.state.currentFilter.month + 1}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Arquivo CSV baixado com sucesso!', 'success');
  }

  printReport() {
    window.print();
  }

  // --- 7. AUTO-CATEGORIZAÇÃO & FORMULÁRIOS DE TRANSAÇÃO ---

  handleAutoCategorySuggest(description) {
    const badge = document.getElementById('autoCategoryBadge');
    const select = document.getElementById('txCategory');
    const typeSelect = document.getElementById('txType');
    if (!badge || !select) return;

    if (!description || description.trim().length < 2) {
      badge.style.display = 'none';
      return;
    }

    const currentType = typeSelect ? typeSelect.value : 'all';
    const match = AutoCategorizer.suggestCategory(description, currentType, this.state.categories);

    if (match && match.category) {
      select.value = match.category.id;
      if (typeSelect && typeSelect.value !== match.type) {
        typeSelect.value = match.type;
        this.updateCategoryOptionsByType(match.type);
        select.value = match.category.id;
      }

      badge.innerHTML = `✨ <strong>Classificação Automática:</strong> Categoria sugerida como <em>"${match.category.name}"</em> pelo termo <em>"${match.matchedKeyword}"</em>.`;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  openTransactionModal(type = 'expense') {
    this.state.editingTransactionId = null;
    const form = document.getElementById('transactionForm');
    if (form) form.reset();

    const titleEl = document.getElementById('modalTransactionTitle');
    if (titleEl) titleEl.textContent = 'Nova Movimentação Financeira';

    const typeEl = document.getElementById('txType');
    if (typeEl) {
      typeEl.value = type;
      this.updateCategoryOptionsByType(type);
    }

    // Define data padrão como hoje
    const dateEl = document.getElementById('txDate');
    if (dateEl) {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      dateEl.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }

    const badge = document.getElementById('autoCategoryBadge');
    if (badge) badge.style.display = 'none';

    this.openModal('modalTransaction');
    setTimeout(() => {
      const descInput = document.getElementById('txDescription');
      if (descInput) descInput.focus();
    }, 150);
  }

  openEditTransactionModal(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (!tx) return;

    this.state.editingTransactionId = id;
    const titleEl = document.getElementById('modalTransactionTitle');
    if (titleEl) titleEl.textContent = 'Editar Movimentação';

    document.getElementById('txDescription').value = tx.description;
    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('txType').value = tx.type;
    this.updateCategoryOptionsByType(tx.type);
    document.getElementById('txCategory').value = tx.categoryId;
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txPaymentMethod').value = tx.paymentMethod || 'PIX';
    document.getElementById('txNotes').value = tx.notes || '';

    const badge = document.getElementById('autoCategoryBadge');
    if (badge) badge.style.display = 'none';

    this.openModal('modalTransaction');
  }

  handleSaveTransaction() {
    const desc = document.getElementById('txDescription').value.trim();
    const amount = parseFloat(document.getElementById('txAmount').value.replace(',', '.'));
    const type = document.getElementById('txType').value;
    const categoryId = document.getElementById('txCategory').value;
    const date = document.getElementById('txDate').value;
    const paymentMethod = document.getElementById('txPaymentMethod').value;
    const notes = document.getElementById('txNotes').value.trim();

    if (!desc || isNaN(amount) || amount <= 0 || !date) {
      this.showToast('Por favor, preencha todos os campos obrigatórios corretamente.', 'error');
      return;
    }

    if (this.state.editingTransactionId) {
      // Edição
      const idx = this.state.transactions.findIndex(t => t.id === this.state.editingTransactionId);
      if (idx !== -1) {
        this.state.transactions[idx] = {
          ...this.state.transactions[idx],
          description: desc,
          amount,
          type,
          categoryId,
          date,
          paymentMethod,
          notes
        };
        this.showToast('Movimentação atualizada com sucesso!', 'success');
      }
    } else {
      // Criação
      const newTx = {
        id: 'tx_' + Date.now(),
        description: desc,
        amount,
        type,
        categoryId,
        date,
        paymentMethod,
        notes,
        status: 'completed'
      };
      this.state.transactions.unshift(newTx);
      this.showToast('Movimentação registrada com sucesso!', 'success');
    }

    this.saveData();
    this.closeModal('modalTransaction');
    this.renderAll();
    this.checkBudgetsAndAlerts();
  }

  handleDeleteTransaction(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (!tx) return;

    if (confirm(`Tem certeza que deseja excluir "${tx.description}" (${FinancialCharts.formatCurrency(tx.amount)})?`)) {
      this.state.transactions = this.state.transactions.filter(t => t.id !== id);
      this.saveData();
      this.renderAll();
      this.showToast('Movimentação excluída.', 'info');
    }
  }

  // --- 8. GERENCIADOR DE CATEGORIAS ---

  populateCategorySelects() {
    const txSelect = document.getElementById('txCategory');
    const filterSelect = document.getElementById('filterCategory');

    const typeEl = document.getElementById('txType');
    const currentType = typeEl ? typeEl.value : 'expense';

    if (txSelect) {
      const activeCats = this.state.categories.filter(c => c.type === currentType);
      txSelect.innerHTML = activeCats.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }

    if (filterSelect) {
      filterSelect.innerHTML = `
        <option value="all">Todas as Categorias</option>
        ${this.state.categories.map(c => `
          <option value="${c.id}">${c.name} (${c.type === 'income' ? 'Receita' : 'Despesa'})</option>
        `).join('')}
      `;
      filterSelect.value = this.state.currentFilter.categoryId;
    }
  }

  updateCategoryOptionsByType(type) {
    const txSelect = document.getElementById('txCategory');
    if (!txSelect) return;
    const cats = this.state.categories.filter(c => c.type === type);
    txSelect.innerHTML = cats.map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');
  }

  renderCategoryManager() {
    const container = document.getElementById('categoriesGridContainer');
    if (!container) return;

    container.innerHTML = this.state.categories.map(cat => {
      const txCount = this.state.transactions.filter(t => t.categoryId === cat.id).length;
      return `
        <div class="category-manager-card">
          <div class="cat-card-header">
            <span class="cat-icon-circle" style="background-color: ${cat.color};">
              ${cat.type === 'income' ? '↗' : '↘'}
            </span>
            <div style="flex: 1;">
              <strong>${cat.name}</strong>
              <div class="cat-type-label">${cat.type === 'income' ? 'Categoria de Receita' : 'Categoria de Despesa'}</div>
            </div>
            ${!cat.id.startsWith('cat_alimentacao') && !cat.id.startsWith('cat_moradia') && !cat.id.startsWith('cat_salario') ? `
              <button class="btn-icon" title="Excluir categoria" onclick="app.handleDeleteCategory('${cat.id}')">🗑️</button>
            ` : ''}
          </div>
          <div class="cat-card-meta">
            <span>${txCount} registro(s) vinculado(s)</span>
            ${cat.type === 'expense' ? `<span>Teto: ${FinancialCharts.formatCurrency(cat.budget)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  handleSaveCategory() {
    const name = document.getElementById('catName').value.trim();
    const type = document.getElementById('catType').value;
    const color = document.getElementById('catColor').value;
    const budget = parseFloat(document.getElementById('catBudget').value.replace(',', '.')) || 0;

    if (!name) {
      this.showToast('Informe o nome da categoria.', 'error');
      return;
    }

    const newCat = {
      id: 'cat_custom_' + Date.now(),
      name,
      type,
      color,
      budget,
      icon: 'tag'
    };

    this.state.categories.push(newCat);
    this.saveData();
    this.closeModal('modalCategory');
    this.renderAll();
    this.showToast(`Categoria "${name}" criada com sucesso!`, 'success');
  }

  handleDeleteCategory(catId) {
    if (confirm('Deseja excluir esta categoria personalizada?')) {
      this.state.categories = this.state.categories.filter(c => c.id !== catId);
      this.saveData();
      this.renderAll();
      this.showToast('Categoria removida.', 'info');
    }
  }

  // --- 9. METAS FINANCEIRAS ---

  openGoalModal() {
    const form = document.getElementById('goalForm');
    if (form) form.reset();
    this.openModal('modalGoal');
  }

  handleSaveGoal() {
    const title = document.getElementById('goalTitle').value.trim();
    const targetAmount = parseFloat(document.getElementById('goalTargetAmount').value.replace(',', '.'));
    const currentAmount = parseFloat(document.getElementById('goalCurrentAmount').value.replace(',', '.')) || 0;
    const targetDate = document.getElementById('goalDate').value;
    const desc = document.getElementById('goalDescription').value.trim();

    if (!title || isNaN(targetAmount) || targetAmount <= 0) {
      this.showToast('Preencha os campos obrigatórios da meta.', 'error');
      return;
    }

    const newGoal = {
      id: 'goal_' + Date.now(),
      title,
      description: desc,
      targetAmount,
      currentAmount,
      targetDate,
      color: '#2563eb'
    };

    this.state.goals.push(newGoal);
    this.saveData();
    this.closeModal('modalGoal');
    this.renderBudgetsAndGoals();
    this.showToast(`Meta "${title}" criada com sucesso!`, 'success');
  }

  handleDeleteGoal(goalId) {
    if (confirm('Deseja realmente excluir esta meta financeira?')) {
      this.state.goals = this.state.goals.filter(g => g.id !== goalId);
      this.saveData();
      this.renderBudgetsAndGoals();
      this.showToast('Meta excluída.', 'info');
    }
  }

  // --- 10. ACESSIBILIDADE E PERFIL (Idosos e Inclusão - Artigo) ---

  applyAccessibilitySettings() {
    const body = document.body;
    body.classList.remove('font-large', 'font-xlarge', 'high-contrast');

    const fontPref = this.state.profile.accessibilityFont || 'normal';
    if (fontPref === 'large') body.classList.add('font-large');
    if (fontPref === 'xlarge') body.classList.add('font-xlarge');

    if (this.state.profile.highContrast) {
      body.classList.add('high-contrast');
    }
  }

  setAccessibilityFont(size) {
    this.state.profile.accessibilityFont = size;
    this.applyAccessibilitySettings();
    this.saveData();
    this.showToast(`Tamanho de fonte: ${size === 'xlarge' ? 'Extra Grande' : (size === 'large' ? 'Grande' : 'Normal')}`, 'info');
  }

  toggleHighContrast() {
    this.state.profile.highContrast = !this.state.profile.highContrast;
    this.applyAccessibilitySettings();
    this.saveData();
    this.showToast(this.state.profile.highContrast ? 'Modo Alto Contraste ativado' : 'Modo Padrão ativado', 'info');
  }

  renderProfileForm() {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const incomeEl = document.getElementById('profileMonthlyIncome');
    const hoursEl = document.getElementById('profileWorkHours');

    if (nameEl) nameEl.value = this.state.profile.name || '';
    if (emailEl) emailEl.value = this.state.profile.email || '';
    if (incomeEl) incomeEl.value = this.state.profile.monthlyIncomeGoal || 4500;
    if (hoursEl) hoursEl.value = this.state.profile.workHoursPerMonth || 160;
  }

  handleSaveProfile() {
    this.state.profile.name = document.getElementById('profileName').value.trim();
    this.state.profile.email = document.getElementById('profileEmail').value.trim();
    this.state.profile.monthlyIncomeGoal = parseFloat(document.getElementById('profileMonthlyIncome').value.replace(',', '.')) || 4500;
    this.state.profile.workHoursPerMonth = parseInt(document.getElementById('profileWorkHours').value) || 160;

    this.saveData();
    this.renderAll();
    this.showToast('Configurações do perfil salvas com sucesso!', 'success');
  }

  // Backup e Restauração
  exportBackupJSON() {
    const data = {
      transactions: this.state.transactions,
      categories: this.state.categories,
      goals: this.state.goals,
      profile: this.state.profile,
      impulseList: this.state.impulseList,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestao_financeira_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Backup JSON exportado com sucesso!', 'success');
  }

  importBackupJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.transactions && data.categories) {
          this.state.transactions = data.transactions;
          this.state.categories = data.categories;
          this.state.goals = data.goals || DEFAULT_GOALS;
          this.state.profile = data.profile || DEFAULT_USER_PROFILE;
          this.state.impulseList = data.impulseList || [];

          this.saveData();
          this.renderAll();
          this.showToast('Dados restaurados com sucesso do backup!', 'success');
        } else {
          this.showToast('Arquivo JSON inválido.', 'error');
        }
      } catch (err) {
        this.showToast('Erro ao ler arquivo de backup.', 'error');
      }
    };
    reader.readAsText(file);
  }

  resetAllDataToSample() {
    if (confirm('Deseja recarregar os dados de exemplo do artigo científico?')) {
      this.state.transactions = getInitialTransactions();
      this.state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.state.goals = JSON.parse(JSON.stringify(DEFAULT_GOALS));
      this.state.profile = JSON.parse(JSON.stringify(DEFAULT_USER_PROFILE));
      this.saveData();
      this.renderAll();
      this.showToast('Dados de demonstração recarregados com sucesso!', 'success');
    }
  }

  clearAllData() {
    if (confirm('Atenção: Isso apagará todas as suas movimentações e registros. Deseja continuar?')) {
      this.state.transactions = [];
      this.state.goals = [];
      this.saveData();
      this.renderAll();
      this.showToast('Todos os registros foram apagados.', 'info');
    }
  }

  // --- 11. ALERTAS PREVENTIVOS & TOASTS ---

  checkBudgetsAndAlerts() {
    const monthTx = this.getFilteredMonthTransactions();
    const alertBox = document.getElementById('budgetAlertNotice');
    if (!alertBox) return;

    const warnings = [];
    this.state.categories.filter(c => c.type === 'expense' && c.budget > 0).forEach(cat => {
      const spent = monthTx.filter(t => t.type === 'expense' && t.categoryId === cat.id).reduce((s, t) => s + Number(t.amount), 0);
      if (spent > cat.budget) {
        warnings.push(`<strong>${cat.name}</strong> estourou o teto em ${FinancialCharts.formatCurrency(spent - cat.budget)}!`);
      } else if (spent >= cat.budget * 0.8) {
        warnings.push(`<strong>${cat.name}</strong> atingiu ${((spent / cat.budget) * 100).toFixed(0)}% do orçamento estipulado.`);
      }
    });

    if (warnings.length > 0) {
      alertBox.innerHTML = `
        <div class="alert-banner">
          <span class="alert-icon">⚠️</span>
          <div class="alert-text">
            <strong>Aviso de Gestão Orçamentária:</strong>
            ${warnings.join(' | ')}
          </div>
          <button class="alert-close-btn" onclick="document.getElementById('budgetAlertNotice').style.display='none'">✕</button>
        </div>
      `;
      alertBox.style.display = 'block';
    } else {
      alertBox.style.display = 'none';
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
      <span class="toast-body">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Modais
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.body.classList.remove('modal-open');
  }

  formatDisplayDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }
}

// Inicialização Global
let app = null;
document.addEventListener('DOMContentLoaded', () => {
  app = new FinancialApp();
});
