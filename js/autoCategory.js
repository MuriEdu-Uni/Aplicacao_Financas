/**
 * Módulo de Categorização Automática Inteligente
 * Atende ao Objetivo Específico 3 do Artigo:
 * "Categorizar receitas e despesas, permitindo tanto a classificação automática quanto a definição manual das categorias pelo usuário"
 */

const AutoCategorizer = {
  // Normaliza string (remove acentos, pontuação e converte para minúsculas)
  normalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
  },

  // Identifica categoria sugerida a partir do texto de descrição
  suggestCategory(description, type = 'all', categories = DEFAULT_CATEGORIES, customRules = AUTO_CATEGORY_RULES) {
    if (!description || description.trim().length < 2) {
      return null;
    }

    const normalizedDesc = this.normalize(description);
    const tokens = normalizedDesc.split(/\s+/);

    let bestMatch = null;
    let highestScore = 0;

    for (const rule of customRules) {
      // Encontra categoria correspondente
      const category = categories.find(c => c.id === rule.categoryId);
      if (!category) continue;

      // Se um tipo específico foi solicitado (income ou expense), filtra
      if (type !== 'all' && category.type !== type) continue;

      for (const keyword of rule.keywords) {
        const normalizedKeyword = this.normalize(keyword);

        // Correspondência exata da palavra ou frase
        if (normalizedDesc === normalizedKeyword) {
          return {
            category,
            matchedKeyword: keyword,
            confidence: 1.0,
            type: category.type
          };
        }

        // Se a frase contém a palavra-chave completa
        if (normalizedDesc.includes(normalizedKeyword)) {
          const score = normalizedKeyword.length / normalizedDesc.length + 0.5;
          if (score > highestScore) {
            highestScore = score;
            bestMatch = {
              category,
              matchedKeyword: keyword,
              confidence: Math.min(score, 0.95),
              type: category.type
            };
          }
        }

        // Verificação por token individual
        for (const token of tokens) {
          if (token === normalizedKeyword && token.length >= 3) {
            const score = 0.8;
            if (score > highestScore) {
              highestScore = score;
              bestMatch = {
                category,
                matchedKeyword: keyword,
                confidence: score,
                type: category.type
              };
            }
          }
        }
      }
    }

    return bestMatch;
  },

  // Detecta se a descrição soa como receita
  predictType(description) {
    const normalized = this.normalize(description);
    const incomeKeywords = ['salario', 'rendimento', 'freela', 'freelance', 'deposito', 'recebido', 'dividendo', 'lucro', 'venda', 'restituicao', 'bonus'];
    for (const kw of incomeKeywords) {
      if (normalized.includes(kw)) {
        return 'income';
      }
    }
    return 'expense';
  }
};
