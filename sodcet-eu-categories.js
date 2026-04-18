const fs = require("node:fs/promises");
const path = require("node:path");
const fetchFn = globalThis.fetch;

if (typeof fetchFn !== "function") {
  throw new Error("Dieser Node.js-Laufzeit stellt kein globales fetch bereit.");
}

const SOURCE_URI = "http://publications.europa.eu/resource/authority/data-theme";
const SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql";
const DATASET_PAGE = "https://op.europa.eu/web/eu-vocabularies/concept-scheme/-/resource?uri=http://publications.europa.eu/resource/authority/data-theme";

const REQUESTS = [
  {
    description: "publications.europa.eu SPARQL endpoint",
    handler: fetchViaSparql
  },
  {
    description: "op.europa.eu distribution download (RDF)",
    handler: fetchViaDistributionRdf
  },
  {
    description: "opportal RDF API (rdf+xml)",
    url: "https://op.europa.eu/o/opportal-service/datasets/data-theme?type=SKOS&format=application/rdf+xml",
    parser: parseRdfXml
  },
  {
    description: "direct resource (rdf+xml)",
    url: SOURCE_URI,
    requestInit: { headers: { Accept: "application/rdf+xml" } },
    parser: parseRdfXml
  },
  {
    description: "direct resource (turtle)",
    url: SOURCE_URI,
    requestInit: { headers: { Accept: "text/turtle" } },
    parser: parseTurtle
  }
];

async function fetchCategories(language) {
  let lastError;
  for (const attempt of REQUESTS) {
    try {
      let labels = [];
      if (attempt.handler) {
        labels = await attempt.handler(language);
      } else {
        const res = await fetchFn(attempt.url, attempt.requestInit);
        if (!res.ok) {
          const snippet = (await res.text()).slice(0, 140).replace(/\s+/g, " ");
          throw new Error(`HTTP ${res.status} ${res.statusText}: ${snippet}`);
        }
        const body = await res.text();
        labels = attempt.parser(body, language);
      }

      if (labels.length) {
        return dedupeAndSort(labels, language);
      }
      throw new Error(`Keine ${language}-Labels im Antwortdokument gefunden.`);
    } catch (err) {
      lastError = err;
      console.warn(`[SODCET] ${attempt.description} fehlgeschlagen: ${err.message}`);
    }
  }
  throw lastError ?? new Error("Alle Abrufversuche sind fehlgeschlagen.");
}

function parseRdfXml(xml, language = "de") {
  const labels = [];
  const regex = /<([a-z0-9._:-]+)\b([^>]*?)>([\s\S]*?)<\/\1\s*>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const tagName = match[1] || "";
    if (!/prefLabel$/i.test(tagName)) continue;
    const attrs = match[2] || "";
    const langRegex = buildLangRegex(language);
    if (!langRegex.test(attrs)) continue;
    const rawValue = match[3] ?? "";
    const cleaned = rawValue.replace(/<\/?[^>]+>/g, "").trim();
    if (cleaned) {
      labels.push(decodeBasicEntities(cleaned));
    }
  }
  return labels;
}

function parseTurtle(ttl, language = "de") {
  const labels = [];
  const regex = new RegExp(`([\\w.-]+:)?prefLabel\\s+("""([\\s\\S]*?)"""|"([^"]+?)")@${language}`, "gi");
  let match;
  while ((match = regex.exec(ttl)) !== null) {
    const tripleQuoteValue = match[3];
    const singleQuoteValue = match[4];
    const value = tripleQuoteValue ?? singleQuoteValue;
    if (value) labels.push(value.trim());
  }
  return labels;
}

function decodeBasicEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function dedupeAndSort(values, language = "de") {
  const locale = language === "en" ? "en" : "de";
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, locale));
}

async function fetchViaSparql(language = "de") {
  const query = `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT DISTINCT ?label WHERE {
      ?concept skos:inScheme <${SOURCE_URI}> ;
               skos:prefLabel ?label .
      FILTER(LANGMATCHES(LANG(?label), "${language}"))
    }
    ORDER BY ?label
  `;

  const params = new URLSearchParams({
    query,
    format: "application/sparql-results+json"
  });

  const res = await fetchFn(`${SPARQL_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/sparql-results+json"
    }
  });

  if (!res.ok) {
    const snippet = (await res.text()).slice(0, 140).replace(/\s+/g, " ");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${snippet}`);
  }

  const data = await res.json();
  const entries = data?.results?.bindings ?? [];
  return entries
    .map((binding) => binding?.label?.value)
    .filter(Boolean);
}

async function fetchViaDistributionRdf(language = "de") {
  const pageRes = await fetchFn(DATASET_PAGE);
  if (!pageRes.ok) {
    const snippet = (await pageRes.text()).slice(0, 140).replace(/\s+/g, " ");
    throw new Error(`HTML HTTP ${pageRes.status} ${pageRes.statusText}: ${snippet}`);
  }
  const html = await pageRes.text();
  const match = html.match(/href="([^"]*euvoc-download-handler[^"]+data-theme[^"]+\.rdf[^"]*)"/i);
  if (!match) {
    throw new Error("Keine RDF-Download-URL auf der Datensatzseite gefunden.");
  }
  const rawUrl = match[1];
  const absoluteUrl = rawUrl.startsWith("http") ? rawUrl : `https://op.europa.eu${rawUrl}`;

  const rdfRes = await fetchFn(absoluteUrl, {
    headers: { Accept: "application/rdf+xml" }
  });
  if (!rdfRes.ok) {
    const snippet = (await rdfRes.text()).slice(0, 140).replace(/\s+/g, " ");
    throw new Error(`RDF HTTP ${rdfRes.status} ${rdfRes.statusText}: ${snippet}`);
  }
  const rdfBody = await rdfRes.text();
  return parseRdfXml(rdfBody, language);
}

function buildLangRegex(language) {
  const normalized = language.toLowerCase();
  const variants = normalized === "en" ? ["en", "eng"] : normalized === "de" ? ["de", "deu"] : [normalized];
  return new RegExp(`xml:lang\\s*=\\s*"(?:${variants.join("|")})"`, "i");
}

(async () => {
  try {
    const categoriesDe = await fetchCategories("de");
    const categoriesEn = await fetchCategories("en");
    const statistics = {
      generatedAt: new Date().toISOString(),
      affiliate: "TU Chemnitz - Professorship Data Management",
      contributorCatalogVersion: "20241211-0",
      sources: {
        conceptScheme: DATASET_PAGE,
        sparqlEndpoint: SPARQL_ENDPOINT,
        opportalRdfApi: "https://op.europa.eu/o/opportal-service/datasets/data-theme?type=SKOS&format=application/rdf+xml",
        datasetRdf: SOURCE_URI,
        datasetTurtle: `${SOURCE_URI}?format=text/turtle`
      }
    };

    const payload = {
      statistics,
      categoriesDe,
      categoriesEn
    };

    const outputPath = path.join(__dirname, "output", "eu-categories.json");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`Kategorie-Datei aktualisiert: ${outputPath}`);
  } catch (err) {
    console.error("Konnte Kategorien nicht abrufen:", err.message);
    process.exitCode = 1;
  }
})();
