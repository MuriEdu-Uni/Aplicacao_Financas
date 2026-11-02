/**
 * Dados Iniciais e Estruturas Padrão do Sistema de Gestão Financeira Pessoal
 * Projeto baseado no artigo de Dennis Gabriel de Oliveira e Murilo da Silva Santos (UniCesumar)
 */

const DEFAULT_CATEGORIES = [
  // Despesas
  { id: 'cat_alimentacao', name: 'Alimentação', type: 'expense', color: '#2563eb', icon: 'utensils', budget: 1200 },
  { id: 'cat_moradia', name: 'Moradia & Contas', type: 'expense', color: '#1d4ed8', icon: 'home', budget: 1500 },
  { id: 'cat_transporte', name: 'Transporte', type: 'expense', color: '#0284c7', icon: 'car', budget: 450 },
  { id: 'cat_saude', name: 'Saúde & Farmácia', type: 'expense', color: '#0ea5e9', icon: 'activity', budget: 300 },
  { id: 'cat_educacao', name: 'Educação & Livros', type: 'expense', color: '#3b82f6', icon: 'book', budget: 250 },
  { id: 'cat_lazer', name: 'Lazer & Entretenimento', type: 'expense', color: '#6366f1', icon: 'film', budget: 350 },
  { id: 'cat_compras', name: 'Compras & Vestuário', type: 'expense', color: '#4f46e5', icon: 'shopping-bag', budget: 200 },
  { id: 'cat_outras_desp', name: 'Outras Despesas', type: 'expense', color: '#64748b', icon: 'more-horizontal', budget: 150 },

  // Receitas
  { id: 'cat_salario', name: 'Salário & Renda Principal', type: 'income', color: '#059669', icon: 'briefcase', budget: 0 },
  { id: 'cat_freelance', name: 'Freelance & Extras', type: 'income', color: '#10b981', icon: 'zap', budget: 0 },
  { id: 'cat_rendimentos', name: 'Rendimentos & Investimentos', type: 'income', color: '#0d9488', icon: 'trending-up', budget: 0 },
  { id: 'cat_outras_rec', name: 'Outras Receitas', type: 'income', color: '#34d399', icon: 'dollar-sign', budget: 0 }
];

const DEFAULT_USER_PROFILE = {
  name: 'Murilo Santos',
  email: 'murilo.santos@aluno.unicesumar.edu.br',
  monthlyIncomeGoal: 4500.00,
  workHoursPerMonth: 160, // Para cálculo de horas de trabalho por compra (Psicologia Econômica)
  currency: 'BRL',
  accessibilityFont: 'normal', // normal, large, xlarge
  highContrast: false,
  soundEffects: false
};

const DEFAULT_GOALS = [
  {
    id: 'goal_reserva',
    title: 'Reserva de Emergência (6 Meses)',
    description: 'Segurança financeira conforme recomendado por Gitman (2010) e Savoia et al. (2007)',
    targetAmount: 15000.00,
    currentAmount: 8500.00,
    targetDate: '2026-12-31',
    category: 'cat_rendimentos',
    color: '#2563eb'
  },
  {
    id: 'goal_notebook',
    title: 'Notebook para Estudos e Desenvolvimento',
    description: 'Equipamento para pesquisas acadêmicas e projetos em Análise e Desenvolvimento de Sistemas',
    targetAmount: 4200.00,
    currentAmount: 2600.00,
    targetDate: '2026-08-15',
    category: 'cat_educacao',
    color: '#0284c7'
  },
  {
    id: 'goal_viagem',
    title: 'Fundo para Congresso Tecnológico',
    description: 'Participação na Mostra de Iniciação Científica e Tecnológica',
    targetAmount: 1200.00,
    currentAmount: 900.00,
    targetDate: '2026-10-10',
    category: 'cat_lazer',
    color: '#3b82f6'
  }
];

// Regras para classificação automática de categorias por palavras-chave
const AUTO_CATEGORY_RULES = [
  {
    categoryId: 'cat_alimentacao',
    keywords: [
      'supermercado', 'mercado', 'muffato', 'condor', 'carrefour', 'assai', 'atacadao', 
      'pao de acucar', 'padaria', 'restaurante', 'almoço', 'jantar', 'lanche', 'pizza', 
      'hamburguer', 'ifood', 'rappi', 'acougue', 'feira', 'sacolao', 'cafe', 'sorvete',
      'refeicao', 'marmita', 'churrasco'
    ]
  },
  {
    categoryId: 'cat_moradia',
    keywords: [
      'aluguel', 'condominio', 'luz', 'copel', 'enel', 'energisa', 'agua', 'sanepar', 
      'sabesp', 'gas', 'ultragaz', 'internet', 'claro', 'vivo', 'tim', 'iptu', 'reforma',
      'manutencao casa', 'mobilia', 'eletrodomestico'
    ]
  },
  {
    categoryId: 'cat_transporte',
    keywords: [
      'gasolina', 'combustivel', 'etanol', 'posto', 'shell', 'ipiranga', 'petrobras',
      'uber', '99', 'taxi', 'onibus', 'metro', 'passagem', 'pedagio', 'estacionamento',
      'ipva', 'seguro auto', 'mecanico', 'pneu', 'troca de oleo', 'lavagem carro'
    ]
  },
  {
    categoryId: 'cat_saude',
    keywords: [
      'farmacia', 'droga raia', 'drogasil', 'pague menos', 'panvel', 'remedio', 'medicamento',
      'consulta', 'medico', 'dentista', 'unimed', 'plano de saude', 'exame', 'laboratorio',
      'oculos', 'psicologo', 'terapia', 'fisioterapia'
    ]
  },
  {
    categoryId: 'cat_educacao',
    keywords: [
      'mensalidade', 'unicesumar', 'faculdade', 'universidade', 'curso', 'udemy', 'alura',
      'livro', 'apostila', 'matricula', 'escola', 'idiomas', 'ingles', 'copias'
    ]
  },
  {
    categoryId: 'cat_lazer',
    keywords: [
      'cinema', 'filme', 'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'show',
      'teatro', 'viagem', 'hotel', 'airbnb', 'praia', 'parque', 'academia', 'smart fit',
      'jogos', 'steam', 'playstation', 'passeio'
    ]
  },
  {
    categoryId: 'cat_compras',
    keywords: [
      'roupa', 'calcado', 'tenis', 'camisa', 'calca', 'zara', 'renner', 'riachuelo', 'c&a',
      'shopee', 'shein', 'mercado livre', 'amazon', 'aliexpress', 'eletronico', 'celular',
      'perfume', 'cosmetico', 'presente'
    ]
  },
  {
    categoryId: 'cat_salario',
    keywords: [
      'salario', 'adiantamento', 'holerite', 'remuneracao', 'folha de pagamento', 'decimo terceiro',
      '13o', '13º', 'ferias', 'bonus', 'comissao mensal'
    ]
  },
  {
    categoryId: 'cat_freelance',
    keywords: [
      'freela', 'freelance', 'projeto extra', 'consultoria', 'bico', 'servico prestado',
      'desenvolvimento site', 'design'
    ]
  },
  {
    categoryId: 'cat_rendimentos',
    keywords: [
      'rendimento', 'dividendo', 'juros', 'cdb', 'tesouro', 'poupanca', 'investimento',
      'fundo imobiliario', 'lucro'
    ]
  }
];

// Transações realistas para preenchimento inicial (mês corrente e anterior)
function getInitialTransactions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 a 11

  // Formatador de data YYYY-MM-DD
  const formatDate = (y, m, d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  };

  return [
    // Mês Atual - Receitas
    {
      id: 'tx_1',
      description: 'Salário Mensal - Empresa de Tecnologia',
      amount: 4500.00,
      type: 'income',
      categoryId: 'cat_salario',
      date: formatDate(year, month, 5),
      paymentMethod: 'Transferência / PIX',
      status: 'completed',
      notes: 'Salário líquido depositado em conta'
    },
    {
      id: 'tx_2',
      description: 'Desenvolvimento de Landing Page (Freelance)',
      amount: 950.00,
      type: 'income',
      categoryId: 'cat_freelance',
      date: formatDate(year, month, 12),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Projeto web entregue com sucesso'
    },
    {
      id: 'tx_3',
      description: 'Rendimentos CDB e Tesouro Direto',
      amount: 142.80,
      type: 'income',
      categoryId: 'cat_rendimentos',
      date: formatDate(year, month, 15),
      paymentMethod: 'Transferência / PIX',
      status: 'completed',
      notes: 'Rendimento mensal da reserva'
    },

    // Mês Atual - Despesas Essenciais (Moradia, Alimentação, Saúde)
    {
      id: 'tx_4',
      description: 'Aluguel do Apartamento e Condomínio',
      amount: 1350.00,
      type: 'expense',
      categoryId: 'cat_moradia',
      date: formatDate(year, month, 7),
      paymentMethod: 'Boleto',
      status: 'completed',
      notes: 'Moradia fixa'
    },
    {
      id: 'tx_5',
      description: 'Conta de Energia Copel',
      amount: 145.30,
      type: 'expense',
      categoryId: 'cat_moradia',
      date: formatDate(year, month, 10),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Consumo moderado no mês'
    },
    {
      id: 'tx_6',
      description: 'Internet Fibra 500MB',
      amount: 119.90,
      type: 'expense',
      categoryId: 'cat_moradia',
      date: formatDate(year, month, 11),
      paymentMethod: 'Cartão de Crédito',
      status: 'completed',
      notes: 'Essencial para trabalho remoto e estudos'
    },
    {
      id: 'tx_7',
      description: 'Supermercado Muffato - Compras do Mês',
      amount: 680.50,
      type: 'expense',
      categoryId: 'cat_alimentacao',
      date: formatDate(year, month, 6),
      paymentMethod: 'Cartão de Débito',
      status: 'completed',
      notes: 'Itens básicos e feira'
    },
    {
      id: 'tx_8',
      description: 'Supermercado Condor - Reposição Semanal',
      amount: 215.40,
      type: 'expense',
      categoryId: 'cat_alimentacao',
      date: formatDate(year, month, 18),
      paymentMethod: 'Cartão de Débito',
      status: 'completed',
      notes: 'Frutas, legumes e laticínios'
    },
    {
      id: 'tx_9',
      description: 'Abastecimento Gasolina Shell',
      amount: 190.00,
      type: 'expense',
      categoryId: 'cat_transporte',
      date: formatDate(year, month, 9),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Deslocamento faculdade e trabalho'
    },
    {
      id: 'tx_10',
      description: 'Recarga Cartão Transporte Público / Ônibus',
      amount: 120.00,
      type: 'expense',
      categoryId: 'cat_transporte',
      date: formatDate(year, month, 14),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Passagens do mês'
    },
    {
      id: 'tx_11',
      description: 'Farmácia Droga Raia - Vitaminas e Medicamentos',
      amount: 115.60,
      type: 'expense',
      categoryId: 'cat_saude',
      date: formatDate(year, month, 8),
      paymentMethod: 'Cartão de Crédito',
      status: 'completed',
      notes: 'Cuidados preventivos com a saúde'
    },
    {
      id: 'tx_12',
      description: 'Mensalidade UniCesumar - ADS',
      amount: 249.90,
      type: 'expense',
      categoryId: 'cat_educacao',
      date: formatDate(year, month, 10),
      paymentMethod: 'Boleto',
      status: 'completed',
      notes: 'Investimento em formação superior'
    },
    {
      id: 'tx_13',
      description: 'Mensalidade Academia Smart Fit',
      amount: 119.90,
      type: 'expense',
      categoryId: 'cat_lazer',
      date: formatDate(year, month, 12),
      paymentMethod: 'Cartão de Crédito',
      status: 'completed',
      notes: 'Saúde física e mental'
    },
    {
      id: 'tx_14',
      description: 'Assinaturas Digitais (Netflix + Spotify)',
      amount: 74.80,
      type: 'expense',
      categoryId: 'cat_lazer',
      date: formatDate(year, month, 16),
      paymentMethod: 'Cartão de Crédito',
      status: 'completed',
      notes: 'Lazer e entretenimento em casa'
    },
    {
      id: 'tx_15',
      description: 'Almoço Restaurante com Colegas de Projeto',
      amount: 88.50,
      type: 'expense',
      categoryId: 'cat_alimentacao',
      date: formatDate(year, month, 20),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Alinhamento acadêmico da mostra'
    },

    // Mês Anterior - Para comparação histórica nos gráficos
    {
      id: 'tx_prev_1',
      description: 'Salário Mensal',
      amount: 4500.00,
      type: 'income',
      categoryId: 'cat_salario',
      date: formatDate(month === 0 ? year - 1 : year, (month + 11) % 12, 5),
      paymentMethod: 'Transferência / PIX',
      status: 'completed',
      notes: 'Mês anterior'
    },
    {
      id: 'tx_prev_2',
      description: 'Projeto Freelance de Backend Java',
      amount: 800.00,
      type: 'income',
      categoryId: 'cat_freelance',
      date: formatDate(month === 0 ? year - 1 : year, (month + 11) % 12, 14),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Mês anterior'
    },
    {
      id: 'tx_prev_3',
      description: 'Aluguel e Condomínio',
      amount: 1350.00,
      type: 'expense',
      categoryId: 'cat_moradia',
      date: formatDate(month === 0 ? year - 1 : year, (month + 11) % 12, 7),
      paymentMethod: 'Boleto',
      status: 'completed',
      notes: 'Mês anterior'
    },
    {
      id: 'tx_prev_4',
      description: 'Supermercado e Feira',
      amount: 890.00,
      type: 'expense',
      categoryId: 'cat_alimentacao',
      date: formatDate(month === 0 ? year - 1 : year, (month + 11) % 12, 8),
      paymentMethod: 'Cartão de Débito',
      status: 'completed',
      notes: 'Mês anterior'
    },
    {
      id: 'tx_prev_5',
      description: 'Combustível e Transporte',
      amount: 340.00,
      type: 'expense',
      categoryId: 'cat_transporte',
      date: formatDate(month === 0 ? year - 1 : year, (month + 11) % 12, 12),
      paymentMethod: 'PIX',
      status: 'completed',
      notes: 'Mês anterior'
    },
    {
      id: 'tx_prev_6',
      description: 'UniCesumar e Livros',
      amount: 280.00,
      type: 'expense',
      categoryId: 'cat_educacao',
      date: formatDate(month === 0 ? year - 1 : year, (month + 11) % 12, 10),
      paymentMethod: 'Boleto',
      status: 'completed',
      notes: 'Mês anterior'
    }
  ];
}
