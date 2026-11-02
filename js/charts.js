/**
 * Motor de Gráficos SVG Nativos e Interativos (Zero Dependências Externas)
 * Atende ao Objetivo Específico 4 do Artigo:
 * "Apresentar os dados financeiros por meio de gráficos e relatórios, facilitando a visualização, interpretação e análise das informações"
 */

const FinancialCharts = {
  // Formata moeda BRL
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  },

  // 1. Gráfico de Rosquinha / Donut para Despesas por Categoria
  renderDonutChart(containerId, items, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-chart-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Nenhum dado registrado para este período.</p>
        </div>
      `;
      return;
    }

    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) {
      container.innerHTML = `
        <div class="empty-chart-state">
          <p>Sem despesas registradas no período selecionado.</p>
        </div>
      `;
      return;
    }

    const width = options.width || 340;
    const height = options.height || 260;
    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const radius = Math.min(centerX, centerY) - 25;
    const innerRadius = radius * 0.62;

    let currentAngle = -Math.PI / 2; // Inicia no topo (12h)
    let slicesSvg = '';

    items.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;
      const percent = ((item.value / total) * 100).toFixed(1);

      // Coordenadas do arco externo
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      // Coordenadas do arco interno
      const ix1 = centerX + innerRadius * Math.cos(endAngle);
      const iy1 = centerY + innerRadius * Math.sin(endAngle);
      const ix2 = centerX + innerRadius * Math.cos(currentAngle);
      const iy2 = centerY + innerRadius * Math.sin(currentAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
        'Z'
      ].join(' ');

      const color = item.color || '#2563eb';

      slicesSvg += `
        <path d="${pathData}" 
              fill="${color}" 
              stroke="#ffffff" 
              stroke-width="2.5" 
              class="donut-slice"
              data-label="${item.label}" 
              data-value="${this.formatCurrency(item.value)}"
              data-percent="${percent}%"
              style="cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease;"
        ></path>
      `;

      currentAngle = endAngle;
    });

    const totalFormatted = this.formatCurrency(total);

    container.innerHTML = `
      <div class="donut-chart-wrapper" style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="financial-donut-svg">
          <defs>
            <filter id="chart-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15" />
            </filter>
          </defs>
          <g filter="url(#chart-shadow)">
            ${slicesSvg}
          </g>
          <!-- Texto central no meio da rosquinha -->
          <text x="${centerX}" y="${centerY - 8}" text-anchor="middle" fill="#64748b" font-size="12" font-weight="500">Total Despesas</text>
          <text x="${centerX}" y="${centerY + 16}" text-anchor="middle" fill="#1e293b" font-size="16" font-weight="700">${totalFormatted}</text>
        </svg>

        <!-- Tooltip flutuante interativo -->
        <div class="chart-tooltip" style="display: none; position: absolute; background: #0f172a; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>

        <!-- Legenda com cores e percentuais -->
        <div class="donut-legend">
          ${items.map(item => `
            <div class="donut-legend-item">
              <span class="legend-color-dot" style="background-color: ${item.color || '#2563eb'};"></span>
              <span class="legend-name" title="${item.label}">${item.label}</span>
              <span class="legend-val">${this.formatCurrency(item.value)}</span>
              <span class="legend-pct">(${((item.value / total) * 100).toFixed(0)}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Interatividade com Hover no Gráfico de Rosquinha
    const svgEl = container.querySelector('.financial-donut-svg');
    const tooltip = container.querySelector('.chart-tooltip');
    const slices = container.querySelectorAll('.donut-slice');

    slices.forEach(slice => {
      slice.addEventListener('mouseenter', (e) => {
        slice.style.opacity = '0.85';
        slice.style.transform = 'scale(1.03)';
        slice.style.transformOrigin = `${centerX}px ${centerY}px`;

        const label = slice.getAttribute('data-label');
        const val = slice.getAttribute('data-value');
        const pct = slice.getAttribute('data-percent');

        tooltip.innerHTML = `<strong>${label}</strong><br/>${val} (${pct})`;
        tooltip.style.display = 'block';
      });

      slice.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        tooltip.style.left = `${e.clientX - rect.left + 15}px`;
        tooltip.style.top = `${e.clientY - rect.top - 20}px`;
      });

      slice.addEventListener('mouseleave', () => {
        slice.style.opacity = '1';
        slice.style.transform = 'scale(1)';
        tooltip.style.display = 'none';
      });
    });
  },

  // 2. Gráfico de Barras Comparativo (Receitas vs Despesas)
  renderBarChart(containerId, monthlyData, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!monthlyData || monthlyData.length === 0) {
      container.innerHTML = `<div class="empty-chart-state"><p>Sem dados mensais para exibir.</p></div>`;
      return;
    }

    const width = options.width || 540;
    const height = options.height || 260;
    const paddingLeft = 65;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 45;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    // Acha o maior valor para calibrar escala Y
    const maxVal = Math.max(
      ...monthlyData.map(d => Math.max(d.income, d.expense)),
      1000
    ) * 1.15; // 15% de margem no topo

    // Linhas de grade e valores do eixo Y
    const steps = 4;
    let gridLinesSvg = '';
    for (let i = 0; i <= steps; i++) {
      const yVal = (maxVal / steps) * i;
      const yPos = paddingTop + chartH - (i / steps) * chartH;
      const formatted = new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(yVal);

      gridLinesSvg += `
        <line x1="${paddingLeft}" y1="${yPos}" x2="${width - paddingRight}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="3,3" />
        <text x="${paddingLeft - 8}" y="${yPos + 4}" text-anchor="end" fill="#94a3b8" font-size="11">R$ ${formatted}</text>
      `;
    }

    // Barras
    const numGroups = monthlyData.length;
    const groupWidth = chartW / numGroups;
    const barWidth = Math.min(groupWidth * 0.35, 36);
    const gap = 6;

    let barsSvg = '';
    let labelsSvg = '';

    monthlyData.forEach((d, idx) => {
      const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;

      // Alturas calculadas
      const incH = (d.income / maxVal) * chartH;
      const expH = (d.expense / maxVal) * chartH;

      const incX = groupCenterX - barWidth - gap / 2;
      const incY = paddingTop + chartH - incH;

      const expX = groupCenterX + gap / 2;
      const expY = paddingTop + chartH - expH;

      barsSvg += `
        <!-- Barra de Receita (Azul Primário / Esmeralda) -->
        <rect x="${incX}" y="${incY}" width="${barWidth}" height="${incH}" rx="4"
              fill="#2563eb" class="bar-rect"
              data-type="Receita" data-month="${d.monthLabel}" data-val="${this.formatCurrency(d.income)}"
              style="transition: all 0.3s ease; cursor: pointer;">
        </rect>

        <!-- Barra de Despesa (Azul Marinho / Coral) -->
        <rect x="${expX}" y="${expY}" width="${barWidth}" height="${expH}" rx="4"
              fill="#0284c7" class="bar-rect"
              data-type="Despesa" data-month="${d.monthLabel}" data-val="${this.formatCurrency(d.expense)}"
              style="transition: all 0.3s ease; cursor: pointer;">
        </rect>
      `;

      // Rótulo do Mês no eixo X
      labelsSvg += `
        <text x="${groupCenterX}" y="${height - 15}" text-anchor="middle" fill="#475569" font-size="12" font-weight="600">
          ${d.monthLabel}
        </text>
      `;
    });

    container.innerHTML = `
      <div class="barchart-wrapper" style="position: relative; width: 100%;">
        <div class="chart-header-legend" style="display: flex; justify-content: flex-end; gap: 16px; margin-bottom: 8px;">
          <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #334155;">
            <span style="width: 12px; height: 12px; background: #2563eb; border-radius: 3px;"></span> Receitas
          </span>
          <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #334155;">
            <span style="width: 12px; height: 12px; background: #0284c7; border-radius: 3px;"></span> Despesas
          </span>
        </div>
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" class="financial-bar-svg">
          ${gridLinesSvg}
          ${barsSvg}
          ${labelsSvg}
        </svg>
        <div class="bar-tooltip" style="display: none; position: absolute; background: #0f172a; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"></div>
      </div>
    `;

    // Tooltip para barras
    const barTooltip = container.querySelector('.bar-tooltip');
    const barRects = container.querySelectorAll('.bar-rect');

    barRects.forEach(rect => {
      rect.addEventListener('mouseenter', () => {
        rect.style.opacity = '0.85';
        const type = rect.getAttribute('data-type');
        const month = rect.getAttribute('data-month');
        const val = rect.getAttribute('data-val');

        barTooltip.innerHTML = `<strong>${month}</strong><br/>${type}: ${val}`;
        barTooltip.style.display = 'block';
      });

      rect.addEventListener('mousemove', (e) => {
        const cRect = container.getBoundingClientRect();
        barTooltip.style.left = `${e.clientX - cRect.left + 12}px`;
        barTooltip.style.top = `${e.clientY - cRect.top - 20}px`;
      });

      rect.addEventListener('mouseleave', () => {
        rect.style.opacity = '1';
        barTooltip.style.display = 'none';
      });
    });
  },

  // 3. Gráfico de Linha de Evolução do Saldo (Fluxo de Caixa)
  renderLineChart(containerId, dailyPoints, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!dailyPoints || dailyPoints.length === 0) {
      container.innerHTML = `<div class="empty-chart-state"><p>Sem movimentações no período.</p></div>`;
      return;
    }

    const width = options.width || 540;
    const height = options.height || 220;
    const paddingLeft = 65;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const values = dailyPoints.map(p => p.balance);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 1000) * 1.1;
    const valRange = maxVal - minVal || 1;

    // Mapeamento dos pontos
    const points = dailyPoints.map((p, idx) => {
      const x = paddingLeft + (idx / (dailyPoints.length - 1 || 1)) * chartW;
      const y = paddingTop + chartH - ((p.balance - minVal) / valRange) * chartH;
      return { x, y, day: p.day, balance: p.balance };
    });

    // Constrói caminho da curva suave
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Caminho da área preenchida com gradiente
    const lastP = points[points.length - 1];
    const areaD = `${pathD} L ${lastP.x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

    // Pontos clicáveis
    let circlesSvg = '';
    points.forEach(p => {
      circlesSvg += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#1e40af" stroke="#ffffff" stroke-width="2"
                class="line-point" data-day="${p.day}" data-val="${this.formatCurrency(p.balance)}"
                style="cursor: pointer; transition: transform 0.2s ease;">
        </circle>
      `;
    });

    container.innerHTML = `
      <div class="linechart-wrapper" style="position: relative; width: 100%;">
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <line x1="${paddingLeft}" y1="${paddingTop + chartH}" x2="${width - paddingRight}" y2="${paddingTop + chartH}" stroke="#cbd5e1" stroke-width="1.5" />
          <path d="${areaD}" fill="url(#balanceGradient)" />
          <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          ${circlesSvg}
        </svg>
        <div class="line-tooltip" style="display: none; position: absolute; background: #0f172a; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px; pointer-events: none; z-index: 10;"></div>
      </div>
    `;

    const lTooltip = container.querySelector('.line-tooltip');
    const pointCircles = container.querySelectorAll('.line-point');

    pointCircles.forEach(pt => {
      pt.addEventListener('mouseenter', () => {
        pt.setAttribute('r', '7');
        const day = pt.getAttribute('data-day');
        const val = pt.getAttribute('data-val');
        lTooltip.innerHTML = `<strong>Dia ${day}</strong><br/>Saldo: ${val}`;
        lTooltip.style.display = 'block';
      });

      pt.addEventListener('mousemove', (e) => {
        const cRect = container.getBoundingClientRect();
        lTooltip.style.left = `${e.clientX - cRect.left + 12}px`;
        lTooltip.style.top = `${e.clientY - cRect.top - 20}px`;
      });

      pt.addEventListener('mouseleave', () => {
        pt.setAttribute('r', '4');
        lTooltip.style.display = 'none';
      });
    });
  }
};
