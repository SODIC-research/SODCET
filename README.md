# 🧠 SODCET – Semantic Open Data Category Extraction Tools

## Hinweis: Letzte Benutzung dauerte 2:00 Laufzeit!

This Python-based research tool executes and aggregates data extraction scripts for **all 16 German federal states**. Each script targets specific Open Data sources (e.g. state portals, ArcGIS endpoints) and parses region-specific datasets. The result is a unified metadata corpus that can be used for further semantic analysis, statistical evaluation, or integration into RDF graphs.

> 🧪 Developed as part of the research work by Florian Hahn, TU Chemnitz (SODIC Research Group)

---

## 🔍 Research Question

> Can a federated execution model for heterogeneous regional Open Data sources support the creation of semantically annotated and statistically normalized metadata corpora across Germany?

---

## 📦 Features

- 🗂️ Modular architecture with one Python file per German state
- ⚙️ Automated execution of all regional scripts from a central controller
- 🧪 Support for web scraping (Selenium), REST APIs, and JSON extraction
- 📊 Aggregation into a combined JSON result file
- 🧭 Referenz auf die 13 von der EU empfohlenen `data-theme`-Kategorien samt Coverage-Visualisierung
- 🧼 Easy-to-extend with additional states or specialized parsers and
- ⚙️ Simple React Dashboard to display the most and least used categories

---

## 🏗️ Setup

```bash
git clone https://github.com/SODIC-research/SODCET.git
cd SODCET

# Optional: Create and activate a virtual environment
sudo apt install python3.12-venv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# OR install dependencies by pip
pip install selenium webdriver-manager beautifulsoup4 requests

# EU Categories scraper
node sodcet-eu-categories.js
```

---

## 🚀 Usage Tool

To run the complete extraction process:

```bash
python3 main.py
```

This will:

- Automatically execute each script in `sources/`
- Parse regional Open Data portals
- Write results to `sources/combined_statistics.json`

## 🚀 Usage Dashboard

To run:

- cd dashboard
- npm install
- npm run dev

This will:

- Open the dashboard with the generated data from before with React.js

---

## 📁 Output

The output JSON file includes structured metadata fragments from each federal state, such as:

```json
outpu/combined_statistics.json
```

---

## 🧠 Methodology

- Each script is tailored to state-specific portal structures (e.g., CKAN, ArcGIS, custom HTML)
- Results are standardized into a unified intermediate JSON format
- Dashboard with most and least used categories with React.js
- The tool supports future extensions for semantic annotation, DCAT mapping, and RDF generation

---

## 🇪🇺 EU-Referenzkategorien

- Das Skript `sodcet-eu-categories.js` lädt die 13 offiziellen `data-theme`-Kategorien der Europäischen Union (z. B. *Wirtschaft und Finanzen*, *Bildung und Kommunikation* usw.) in Deutsch und Englisch über mehrere Fallback-Pfade (SPARQL, RDF/XML, Turtle) herunter.
- Beim Lauf entsteht `output/eu-categories.json` mit Metadaten, Quellenangaben sowie zwei Arrays `categoriesDe` und `categoriesEn`, die im Dashboard als Referenz dienen.
- Das Dashboard vergleicht jede Landesliste mit dieser EU-Vorgabe, zeigt die Anzahl erfüllter Kategorien direkt auf den Bundesland-Karten und rendert ein gestapeltes Balkendiagramm „EU Kategorien pro Bundesland“, um die nationale Abdeckung transparent zu machen.

---

## 📚 References

- [DCAT-AP 3.0.0 - European Commission](https://interoperable-europe.ec.europa.eu/collection/semic-support-centre/solution/dcat-application-profile-data-portals-europe/release/300)
- [GeoDCAT-AP 3.0.0](https://semiceu.github.io/GeoDCAT-AP/releases/3.0.0/)
- [CKAN Documentation](https://docs.ckan.org/en/latest/)
- [Selenium Documentation](https://www.selenium.dev/documentation/)

---

## 📖 Citation

If you use **SODCET** in your research, please cite:

```
@misc{SODCET2025,
  title        = {SODCET: Semantic Open Data Category Extraction Tool},
  author       = {Florian Hahn in the SODIC Research Group},
  year         = {2025},
  howpublished = {\url{https://github.com/SODIC-research/SODCET}},
  note         = {Accessed: July 8, 2025}
}
```

---

## ⚖️ License

Released under the MIT License. See `LICENSE` for details.

## 👩‍🔬 Maintainer

**Florian Hahn**
SODIC Research Group, TU Chemnitz
[Website](https://www.tu-chemnitz.de/informatik/dm/team/fh.php) — Contact: `florian.hahn@informatik.tu-chemnitz.de`
