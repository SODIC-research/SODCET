import { useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import statisticsRaw from '../../output/combined_statistics.json';
import euCategoriesRaw from '../../output/eu-categories.json';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, ArcElement, Tooltip, Legend);

const SODCET_FOOTER_SUMMARY = [
  'SODCET führt für alle 16 Bundesländer modulare Python-Skripte aus, die CKAN-, ArcGIS- und Webportale nach offenen Metadaten durchsuchen.',
  'Die Ergebnisse werden in ein einheitliches Statistikformat überführt und in combined_statistics.json aggregiert.',
  'Das Dashboard macht diese harmonisierten Kennzahlen sichtbar und zeigt häufige sowie seltene Kategorien im föderalen Vergleich.'
];

const FooterNote = ({ summaryLines, repoLink }) => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer glass">
      <p>
        © {currentYear} SODIC (Semantic Open Data Innovation Chemnitz) Research Group, TU Chemnitz ·{' '}
        <a href="https://github.com/SODIC-research" target="_blank" rel="noreferrer">SODIC GitHub</a> ·{' '}
        <a href={repoLink} target="_blank" rel="noreferrer">Projekt-Repository</a>
      </p>
      {summaryLines.map((line, idx) => (
        <p key={`summary-${idx}`}>{line}</p>
      ))}
      <p>
        Diese Visualisierung entstand im Rahmen wissenschaftlicher Arbeiten der SODIC-Gruppe und dient ausschließlich der Diskussion von Methoden und Datenqualität.
      </p>
      <p>
        Haftungsausschluss: Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
      </p>
      <p>
        Alle Inhalte werden „wie gesehen“ ausschließlich zu Demonstrations- und Forschungszwecken bereitgestellt. Es besteht kein Anspruch auf Vollständigkeit, Richtigkeit, Zuverlässigkeit, Eignung oder Verfügbarkeit. Durch die Nutzung dieser Seite entsteht kein Vertragsverhältnis.
      </p>
    </footer>
  );
};

const normalizeStateData = (name, categories = [], index, totalEuCategories = 0, euReference = []) => {
  const normalized = categories
    .map((entry) => ({
      name: entry.category || 'Unbenannte Kategorie',
      datasetCount: entry.datasetCount || 0
    }))
    .sort((a, b) => b.datasetCount - a.datasetCount);
  const categoryNames = new Set(normalized.map((entry) => entry.name));
  const euCovered = euReference.length
    ? euReference.reduce((acc, category) => acc + (categoryNames.has(category) ? 1 : 0), 0)
    : 0;

  return {
    id: name,
    code: String(index + 1).padStart(2, '0'),
    name,
    categories: normalized,
    euTotals: {
      covered: euCovered,
      total: totalEuCategories
    },
    totals: {
      datasets: normalized.reduce((sum, entry) => sum + entry.datasetCount, 0),
      categories: normalized.length
    }
  };
};

const aggregateCategories = (stateList) => {
  const map = new Map();
  stateList.forEach((state) => {
    state.categories.forEach((entry) => {
      const current = map.get(entry.name) || 0;
      map.set(entry.name, current + (entry.datasetCount || 0));
    });
  });
  return Array.from(map.entries())
    .map(([name, datasetCount]) => ({ name, datasetCount }))
    .sort((a, b) => b.datasetCount - a.datasetCount);
};

const InfoCard = ({ title, value, subtitle }) => (
  <div className="info-card glass">
    <span className="info-card__title">{title}</span>
    <strong className="info-card__value">{value}</strong>
    {subtitle && <span className="info-card__subtitle">{subtitle}</span>}
  </div>
);

const StateCard = ({ state, isActive, onSelect, euCategoryCount, euCategoryTotal }) => {
  const euCoverage = typeof euCategoryCount === 'number' && typeof euCategoryTotal === 'number'
    ? `${euCategoryCount}/${euCategoryTotal}`
    : null;
  const topCategory = state.categories[0]?.name || '–';
  const leastCategory = state.categories[state.categories.length - 1]?.name || '–';
  return (
    <button type="button" className={`state-card ${isActive ? 'active' : ''}`} onClick={() => onSelect(state.id)}>
      <div className="state-card__header">
        <span className="state-card__label">{state.name}</span>
        <span className="state-card__code">{state.code}</span>
      </div>
      <div className="state-card__body">
        <p className="metric">
          {state.totals.categories.toLocaleString('de-DE')}
          <span>Kategorien</span>
        </p>
        <p className="metric">
          {state.totals.datasets.toLocaleString('de-DE')}
          <span>Datensätze</span>
        </p>
        {euCoverage ? (
          <p className="metric">
            {euCoverage}
            <span>EU-Kategorien</span>
          </p>
        ) : null}
      </div>
      <div className="state-card__footer">
        <span>Top Kategorie: {topCategory}</span>
        <br />
        <span>Selten: {leastCategory}</span>
      </div>
    </button>
  );
};

const CategoryTable = ({ categories }) => (
  <div className="table-wrapper glass">
    <table>
      <thead>
        <tr>
          <th>Kategorie</th>
          <th>Datensätze</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((entry) => (
          <tr key={entry.name}>
            <td>{entry.name}</td>
            <td>{entry.datasetCount.toLocaleString('de-DE')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CoverageMatrix = ({ categories, stateCoverage }) => (
  <div className="matrix-scroll">
    <div className="matrix-grid">
      <div className="matrix-row matrix-row--header">
        <div className="matrix-cell matrix-cell--corner">Kategorie</div>
        {stateCoverage.map((state) => (
          <div key={`matrix-col-${state.id}`} className="matrix-cell matrix-cell--column">
            {state.name}
          </div>
        ))}
      </div>
      {categories.map((category) => (
        <div key={`matrix-row-${category}`} className="matrix-row">
          <div className="matrix-cell matrix-cell--row">{category}</div>
          {stateCoverage.map((state) => {
            const covered = state.coverageSet.has(category);
            return (
              <div
                key={`${category}-${state.id}`}
                className={`matrix-cell matrix-cell--value ${covered ? 'is-covered' : 'is-missing'}`}
                aria-label={`${category} – ${state.name}: ${covered ? 'Kategorie vorhanden' : 'Kategorie nicht vorhanden'}`}
              >
                <span aria-hidden="true">{covered ? '✔' : '✖'}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

const buildChartData = (items, label) => ({
  labels: items.map((entry) => entry.name),
  datasets: [
    {
      label,
      data: items.map((entry) => entry.datasetCount),
      backgroundColor: 'rgba(0, 85, 153, 0.6)',
      borderColor: 'rgba(0, 85, 153, 1)',
      borderRadius: 12,
      borderWidth: 1.5
    }
  ]
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.formattedValue} Datensätze`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#003366' }
    },
    y: {
      grid: { color: 'rgba(0,51,102,0.1)' },
      ticks: { color: '#003366' }
    }
  }
};

function App() {
  const stats = statisticsRaw.statistics || {};
  const euCategories = euCategoriesRaw.categoriesDe || [];
  const totalEuCategories = euCategories.length;
  const statesSource = statisticsRaw.States_categories || {};
  const states = useMemo(
    () =>
      Object.entries(statesSource).map(([name, categories], index) =>
        normalizeStateData(name, categories, index, totalEuCategories, euCategories)
      ),
    [statesSource, totalEuCategories, euCategories]
  );

  const germanyCategories = useMemo(() => aggregateCategories(states), [states]);
  const germanyTotals = {
    categories: germanyCategories.length,
    datasets: germanyCategories.reduce((sum, entry) => sum + entry.datasetCount, 0)
  };
  const germanyEuCovered = useMemo(() => {
    if (!totalEuCategories) return 0;
    const categorySet = new Set(germanyCategories.map((entry) => entry.name));
    return euCategories.reduce((count, category) => count + (categorySet.has(category) ? 1 : 0), 0);
  }, [germanyCategories, euCategories, totalEuCategories]);

  const germanyState = {
    id: 'ALL',
    code: 'ALL',
    name: 'Deutschland',
    categories: germanyCategories,
    totals: germanyTotals,
    euTotals: {
      covered: germanyEuCovered,
      total: totalEuCategories
    }
  };

  const [selectedStateId, setSelectedStateId] = useState('ALL');
  const selectedState =
    selectedStateId === 'ALL' ? germanyState : states.find((state) => state.id === selectedStateId) || germanyState;

  const totalStates = states.length;
  const uniqueCategories = Object.keys(stats.category_usage_counts || {}).length;
  const dominantCategory = selectedState.categories[0]?.name || '–';
  const leastCategoryEntry = selectedState.categories[selectedState.categories.length - 1];
  const leastCategoryCount = leastCategoryEntry?.datasetCount ?? null;
  const leastCategoryNames = leastCategoryCount === null
    ? []
    : selectedState.categories
      .filter((entry) => entry.datasetCount === leastCategoryCount)
      .map((entry) => entry.name);
  const leastCategoryLabel = leastCategoryNames.length
    ? `${leastCategoryNames[0]}${leastCategoryNames.length > 1 ? ` +${leastCategoryNames.length - 1}` : ''}`
    : '–';

  const focusCategories = selectedState.categories.slice(0, 22);
  const coverageEntries = Object.entries(stats.category_usage_counts || {})
    .map(([name, count]) => ({ name, datasetCount: count }))
    .sort((a, b) => b.datasetCount - a.datasetCount);
  const matrixCategories = useMemo(
    () => Array.from(new Set(coverageEntries.map((entry) => entry.name))),
    [coverageEntries]
  );
  const matrixStateCoverage = useMemo(
    () => states.map((state) => ({
      id: state.id,
      name: state.name,
      coverageSet: new Set(state.categories.map((entry) => entry.name))
    })),
    [states]
  );
  const matrixCategoryLabel = 'deutschen Kategorien';
  const matrixHasData = matrixCategories.length > 0 && matrixStateCoverage.length > 0;

  const coverageChartData = {
    labels: coverageEntries.map((entry) => entry.name),
    datasets: [
      {
        label: 'Bundesländer mit Kategorie',
        data: coverageEntries.map((entry) => entry.datasetCount),
        backgroundColor: 'rgba(0, 85, 153, 0.6)',
        borderColor: 'rgba(0, 85, 153, 1)',
        borderRadius: 12,
        borderWidth: 1.5
      }
    ]
  };

  const coverageDistribution = {
    labels: ['Top Kategorien', 'Nischenkategorien'],
    datasets: [
      {
        data: [
          Object.values(stats['most_used_categories (≥13)'] || {}).length,
          Object.values(stats['least_used_categories (≤2)'] || {}).length
        ],
        backgroundColor: ['rgba(0, 85, 153, 0.8)', 'rgba(0, 51, 102, 0.25)'],
        borderColor: ['rgba(0, 85, 153, 1)', 'rgba(0, 51, 102, 0.4)'],
        borderWidth: 1
      }
    ]
  };

  const euCoverageOptions = useMemo(() => ({
    ...chartOptions,
    scales: {
      x: { ...chartOptions.scales.x, stacked: true },
      y: {
        ...chartOptions.scales.y,
        stacked: true,
        max: totalEuCategories || chartOptions.scales.y.max,
        suggestedMax: totalEuCategories || chartOptions.scales.y.suggestedMax
      }
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          ...chartOptions.plugins.tooltip.callbacks,
          label: (ctx) => {
            const base = chartOptions.plugins.tooltip.callbacks.label(ctx);
            return totalEuCategories ? `${base} / ${totalEuCategories}` : base;
          }
        }
      }
    }
  }), [totalEuCategories]);

  const stateCards = [germanyState, ...states];

  const euCoverageByState = useMemo(() => {
    if (!totalEuCategories) return [];
    return states.map((state) => ({
      name: state.name,
      covered: state.euTotals?.covered ?? 0,
      missing: Math.max(totalEuCategories - (state.euTotals?.covered ?? 0), 0)
    })).sort((a, b) => b.covered - a.covered || a.name.localeCompare(b.name, 'de'));
  }, [states, totalEuCategories]);

  const euCoverageChartData = {
    labels: euCoverageByState.map((entry) => entry.name),
    datasets: [
      {
        label: 'EU-Kategorien vorhanden',
        data: euCoverageByState.map((entry) => entry.covered),
        backgroundColor: 'rgba(0, 102, 153, 0.85)',
        borderColor: 'rgba(0, 102, 153, 1)',
        borderWidth: 1,
        borderRadius: 8,
        stack: 'coverage'
      },
      {
        label: 'EU-Kategorien fehlend',
        data: euCoverageByState.map((entry) => entry.missing),
        backgroundColor: 'rgba(0, 51, 102, 0.25)',
        borderColor: 'rgba(0, 51, 102, 0.4)',
        borderWidth: 1,
        borderRadius: 8,
        stack: 'coverage'
      }
    ]
  };

  return (
    <main className="dashboard">
      <header>
        <div className="header-column">
          <p className="eyebrow">SODCET Analytics - <span>Zuletzt aktualisiert am {new Date(stats.createdAt || Date.now()).toLocaleDateString('de-DE')}</span></p>
          <h1>Kategorien-Abdeckung</h1>
          <p>Vergleichbare Kategorieabdeckung in deutschen Open Data Portalen</p>
        </div>
        <div className="header-meta glass">
          <span>Bundesländer</span>
          <strong>{totalStates}</strong>
        </div>
      </header>

      <section className="metrics-grid">
        <InfoCard
          title="Gesamte Datensätze"
          value={germanyTotals.datasets.toLocaleString('de-DE')}
          subtitle="Aggregiert über alle Bundesländer"
        />
        <InfoCard
          title="Kategorien Gesamt"
          value={uniqueCategories.toLocaleString('de-DE')}
          subtitle="Eindeutige Kategorien in der Analyse"
        />
        <InfoCard title="Aktiver Fokus" value={selectedState.name} subtitle={`Top Kategorie: ${dominantCategory}`} />
        <InfoCard
          title="Kategorien im Fokus"
          value={selectedState.totals.categories.toLocaleString('de-DE')}
          subtitle={`Wenigste Kategorie: ${leastCategoryLabel}`}
        />
      </section>

      <section className="content-grid">
        <div className="glass state-panel">
          <div className="panel-header">
            <h2>Bundesländer</h2>
            <p>Wähle ein Bundesland, um seine Kategorien im Detail zu sehen.</p>
          </div>
          <div className="state-grid">
            {stateCards.map((state) => (
              <StateCard
                key={state.id}
                state={state}
                isActive={state.id === selectedStateId}
                onSelect={setSelectedStateId}
                euCategoryCount={state.euTotals?.covered}
                euCategoryTotal={state.euTotals?.total}
              />
            ))}
          </div>
        </div>
        <div className="glass chart-panel top-chart">
          <div className="panel-header">
            <h2>Top Kategorien – {selectedState.name}</h2>
            <p>Datensatzvolumen pro Kategorie im aktuellen Fokus.</p>
          </div>
          {focusCategories.length ? (
            <Bar data={buildChartData(focusCategories, 'Datensätze')} options={chartOptions} />
          ) : (
            <p>Keine Kategorien vorhanden.</p>
          )}
        </div>
      </section>

            {totalEuCategories ? (
        <section className="glass chart-panel">
          <div className="panel-header">
            <h2>EU Kategorien pro Bundesland</h2>
            <p>Abdeckung der {totalEuCategories} EU-Referenzkategorien (categoriesDe) je Bundesland.</p>
          </div>
          {euCoverageByState.length ? (
            <Bar data={euCoverageChartData} options={euCoverageOptions} />
          ) : (
            <p>Noch keine Abdeckung vorhanden.</p>
          )}
        </section>
      ) : null}

      <section className="glass chart-panel">
        <div className="panel-header">
          <h2>Kategorie-Abdeckung</h2>
          <p>Wie viele Bundesländer bedienen welche Themenbereiche?</p>
        </div>
        <Bar data={coverageChartData} options={chartOptions} />
      </section>

      <section className="glass chart-panel">
        <div className="panel-header">
          <h2>Nationale Perspektive</h2>
          <p>Verhältnis stark genutzter zu seltenen Kategorien.</p>
        </div>
        <div className="chart-row">
          <div className="doughnut-wrapper">
            <Doughnut data={coverageDistribution} />
          </div>
          <div className="coverage-list">
            {Object.entries(stats['most_used_categories (≥13)'] || {}).map(([name, count]) => (
              <div key={name} className="coverage-item">
                <span>{name}</span>
                <strong>{count}/16</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="table-section glass">
        <div className="panel-header">
          <h2>Kategorie-Tabelle – {selectedState.name}</h2>
          <p>Alle Kategorien mit Datensatzvolumen im Fokusgebiet.</p>
        </div>
        <div className="panel-wrapper">
          <CategoryTable categories={selectedState.categories} />
        </div>
      </section>

      {matrixHasData ? (
        <section className="glass chart-panel matrix-panel">
          <div className="panel-header">
            <h2>Abdeckungsmatrix</h2>
            <p>Matrix der {matrixCategories.length} {matrixCategoryLabel} (Y-Achse) über {matrixStateCoverage.length} Bundesländer (X-Achse) mit grünem Haken oder rotem X.</p>
          </div>
          <div className="matrix-legend">
            <span><span className="legend-icon legend-icon--check">✔</span>Abdeckung vorhanden</span>
            <span><span className="legend-icon legend-icon--cross">✖</span>Keine Abdeckung</span>
          </div>
          <CoverageMatrix categories={matrixCategories} stateCoverage={matrixStateCoverage} />
        </section>
      ) : null}

      <FooterNote summaryLines={SODCET_FOOTER_SUMMARY} repoLink="https://github.com/SODIC-research/SODCET" />
    </main>
  );
}

export default App;
