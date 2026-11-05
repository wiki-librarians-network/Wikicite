/**
 * WikiCite 1.1.3 — build citation templates from Wikidata.
 *
 * Search Wikidata for books, journal articles and other publications and insert
 * {{cite book}}, {{cite journal}}, {{sfn}}, {{rp}} or {{Cite Q}} with page numbers.
 *
 * Maintained by Wiki Librarians Network
 *   Source, issues and documentation: https://github.com/wiki-librarians-network/wikicite
 *
 * DO NOT EDIT THIS PAGE ON-WIKI. It is generated from the GitHub repository
 * (scripts/build.mjs) and any on-wiki change will be overwritten on the next
 * release. Please open an issue or pull request on GitHub instead.
 *
 * License: MIT (code). Wikidata content is CC0.
 */
// <nowiki>
mw.loader.using(['mediawiki.util', 'mediawiki.api', 'mediawiki.ForeignApi', 'jquery.textSelection']).then(function () {
'use strict';

mw.util.addCSS("/* WikiCite user-script styles. Uses Codex design tokens when the skin\n   provides them (Vector 2022, Minerva), so light/dark mode follow the wiki. */\n.wikicite {\n  --wc-bg: var(--background-color-base, #fff);\n  --wc-bg2: var(--background-color-interactive-subtle, #f8f9fa);\n  --wc-bg3: var(--background-color-interactive, #eaecf0);\n  --wc-border: var(--border-color-base, #a2a9b1);\n  --wc-border-soft: var(--border-color-subtle, #c8ccd1);\n  --wc-text: var(--color-base, #202122);\n  --wc-muted: var(--color-subtle, #54595d);\n  --wc-accent: var(--color-progressive, #36c);\n  --wc-accent-hover: var(--color-progressive--hover, #3056a9);\n  --wc-accent-soft: var(--background-color-progressive-subtle, #f1f4fd);\n  --wc-on-accent: var(--color-inverted-fixed, #fff);\n  --wc-warn-bg: var(--background-color-warning-subtle, #fdf2d5);\n  --wc-warn-border: var(--border-color-warning, #ab7f2a);\n  --wc-error: var(--color-error, #bf3c2c);\n  --wc-ok: var(--color-success, #177860);\n  --wc-mono: Menlo, Consolas, \"Liberation Mono\", \"Courier New\", monospace;\n  --wc-sans: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Lato, \"Helvetica Neue\", Arial, sans-serif;\n  border: 1px solid var(--wc-border-soft); border-radius: 8px; padding: 0;\n  width: min(1180px, calc(100vw - 24px)); max-height: calc(100vh - 24px); max-width: none;\n  background: var(--wc-bg); color: var(--wc-text); box-shadow: 0 20px 60px rgba(0,0,0,.3);\n  font: 14px/1.5 var(--wc-sans);\n}\n.wikicite::backdrop { background: rgba(32, 33, 34, .55); }\n.wikicite *, .wikicite *::before, .wikicite *::after { box-sizing: border-box; }\n.wikicite [hidden] { display: none !important; }\n.wikicite a { color: var(--wc-accent); }\n.wikicite code, .wikicite kbd { font-family: var(--wc-mono); font-size: .9em; background: var(--wc-bg3); padding: 0 .3em; border-radius: 2px; color: var(--wc-text); }\n.wikicite h2, .wikicite h3, .wikicite h4 { font-family: var(--wc-sans); border: 0; padding: 0; margin: 0; color: var(--wc-text); }\n.wikicite h3 { font-size: 14px; font-weight: 700; }\n\n.wc-shell { display: flex; flex-direction: column; max-height: calc(100vh - 26px); }\n.wc-head { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px 10px; border-bottom: 1px solid var(--wc-border-soft); }\n.wc-titles { flex: 1; min-width: 0; }\n.wc-title { font-family: \"Linux Libertine\", Georgia, Times, serif !important; font-weight: normal; font-size: 21px !important; line-height: 1.25; }\n.wc-sub { display: flex; gap: 6px 8px; flex-wrap: wrap; align-items: center; color: var(--wc-muted); font-size: 13px; margin-top: 2px; }\n.wc-pane { overflow: auto; flex: 1; }\n.wc-search-pane { padding: 14px 16px; }\n.wc-foot { border-top: 1px solid var(--wc-border-soft); padding: 6px 16px; font-size: 12px; color: var(--wc-muted); }\n\n.wc-btn {\n  appearance: none; font: inherit; font-weight: 700; font-size: 14px; line-height: 1.3; cursor: pointer;\n  border: 1px solid var(--wc-border); background: var(--wc-bg2); color: var(--wc-text);\n  padding: 6px 12px; border-radius: 2px; min-height: 32px; white-space: nowrap;\n}\n.wc-btn:hover { background: var(--wc-bg); border-color: var(--wc-muted); }\n.wc-btn:disabled { opacity: .5; cursor: default; }\n.wc-primary { background: var(--wc-accent); border-color: var(--wc-accent); color: var(--wc-on-accent); }\n.wc-primary:hover { background: var(--wc-accent-hover); border-color: var(--wc-accent-hover); }\n.wc-quiet { background: transparent; border-color: transparent; color: var(--wc-accent); }\n.wc-quiet:hover { background: var(--wc-accent-soft); border-color: transparent; }\n.wc-sm { font-size: 13px; padding: 2px 8px; min-height: 26px; }\n.wc-done { color: var(--wc-ok) !important; background: transparent !important; border-color: transparent !important; }\n.wc-link { background: none; border: 0; padding: 0 0 0 6px; color: var(--wc-accent); cursor: pointer; font: inherit; font-size: 12px; }\n.wc-icon { background: none; border: 0; padding: 6px; border-radius: 2px; cursor: pointer; color: var(--wc-muted); line-height: 0; }\n.wc-icon:hover { background: var(--wc-bg3); color: var(--wc-text); }\n.wc-icon svg { width: 20px; height: 20px; fill: currentColor; }\n.wc-icon-sm { padding: 3px; }\n.wc-icon-sm svg { width: 14px; height: 14px; }\n.wikicite :focus-visible { outline: 2px solid var(--wc-accent); outline-offset: 1px; }\n.wc-pill { display: inline-block; padding: 0 6px; border-radius: 9px; background: var(--wc-accent-soft); font-size: 12px; }\n.wc-muted { color: var(--wc-muted); font-weight: normal; }\n.wc-hint { margin: 4px 0 0; font-size: 12.5px; color: var(--wc-muted); }\n.wc-error { color: var(--wc-error); }\n.wc-center { text-align: center; margin-top: 12px; }\n.wc-row-between { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin: 8px 0 6px; }\n\n.wikicite input:not([type=checkbox]):not([type=radio]), .wikicite select, .wikicite textarea {\n  font: inherit; font-size: 14px; color: var(--wc-text); background: var(--wc-bg);\n  border: 1px solid var(--wc-border); border-radius: 2px; padding: 5px 8px; width: 100%; min-height: 32px; margin: 0;\n}\n.wikicite textarea { resize: vertical; min-height: 0; }\n.wikicite input:focus, .wikicite select:focus, .wikicite textarea:focus { border-color: var(--wc-accent); box-shadow: inset 0 0 0 1px var(--wc-accent); outline: 0; }\n\n.wc-search { display: flex; gap: 8px; }\n.wc-search .wc-q { font-size: 16px !important; }\n.wc-status { color: var(--wc-muted); font-size: 13.5px; display: inline-flex; align-items: center; gap: 6px; }\n.wc-types { border: 1px solid var(--wc-border-soft); border-radius: 2px; padding: 8px 12px; background: var(--wc-bg2); }\n.wc-types p { margin: 0; }\n.wc-type-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px 16px; margin-top: 6px; }\n.wc-type-group h4 { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--wc-muted); margin-bottom: 2px; }\n.wc-type-group label { display: block; font-size: 13.5px; cursor: pointer; }\n.wc-qid { font-family: var(--wc-mono); font-size: 12px; color: var(--wc-muted); }\na.wc-qid { color: var(--wc-accent); }\n.wc-custom-type { display: flex; gap: 8px; align-items: flex-end; margin-top: 8px; font-size: 13px; }\n.wc-custom-type label { display: flex; gap: 8px; align-items: center; }\n.wc-custom-type input { width: 130px !important; }\n\n.wc-results { list-style: none; margin: 8px 0 0 !important; padding: 0; display: grid; gap: 8px; }\n.wc-result { margin: 0 !important; display: flex; gap: 12px; border: 1px solid var(--wc-border-soft); border-radius: 2px; padding: 10px 12px; cursor: pointer; background: var(--wc-bg); }\n.wc-result:hover { border-color: var(--wc-accent); background: var(--wc-accent-soft); }\n.wc-result-main { flex: 1; min-width: 0; }\n.wc-result-title { font-family: \"Linux Libertine\", Georgia, Times, serif; font-size: 17px; line-height: 1.3; }\n.wc-result-meta { color: var(--wc-muted); font-size: 13.5px; }\n.wc-result-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }\n.wc-chips { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; margin-top: 4px; }\n.wc-chip { font-size: 12px; background: var(--wc-bg3); color: var(--wc-muted); border-radius: 9px; padding: 0 8px; }\n.wc-kind { background: var(--wc-accent-soft); color: var(--wc-accent); font-weight: 700; }\n.wc-ids { font-family: var(--wc-mono); font-size: 12px; color: var(--wc-muted); margin-left: 4px; white-space: pre-wrap; }\n\n.wc-loading { padding: 40px; text-align: center; color: var(--wc-muted); }\n.wc-cite-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); }\n.wc-col { padding: 12px 16px 16px; min-width: 0; }\n.wc-col-data { background: var(--wc-bg2); border-right: 1px solid var(--wc-border-soft); }\n@media (max-width: 860px) {\n  .wc-cite-body { grid-template-columns: 1fr; }\n  .wc-col-data { border-right: 0; border-bottom: 1px solid var(--wc-border-soft); }\n  .wc-result { flex-direction: column; }\n  .wc-result-side { flex-direction: row; justify-content: space-between; align-items: center; }\n}\n.wc-field { margin-bottom: 10px; }\n.wc-field label { display: block; font-weight: 700; font-size: 13px; }\n.wc-field label > input, .wc-field label > select, .wc-field label > textarea { margin-top: 3px !important; font-weight: normal; }\n.wc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }\n.wc-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0 12px; }\n.wc-check { display: flex; gap: 6px; align-items: baseline; font-size: 13px; margin: 3px 0; cursor: pointer; }\n.wc-inline { display: inline-flex; margin: 0 6px 0 0; }\n\n.wc-params { display: grid; gap: 3px; }\n.wc-param, .wc-add-param { display: grid; grid-template-columns: minmax(80px, 34%) 1fr auto; gap: 4px; align-items: center; }\n.wc-add-param { margin-top: 8px; }\n.wikicite .wc-param input, .wikicite .wc-add-param input { font-family: var(--wc-mono); font-size: 12.5px; padding: 3px 6px; min-height: 28px; }\n.wikicite .wc-pkey { text-align: right; color: var(--wc-muted); background: transparent !important; border-color: transparent !important; box-shadow: none !important; }\n.wikicite .wc-pkey:focus { border-color: var(--wc-accent) !important; background: var(--wc-bg) !important; }\n.wikicite .wc-pkey:hover { border-color: var(--wc-border-soft) !important; }\n.wikicite .wc-edited .wc-pval { border-color: var(--wc-accent); background: var(--wc-accent-soft); }\n\n.wc-box { border: 1px solid var(--wc-border-soft); border-radius: 2px; padding: 6px 12px 4px; margin: 0 0 12px; }\n.wc-box legend { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--wc-muted); padding: 0 4px; }\n.wc-seg { display: flex; flex-wrap: wrap; border: 1px solid var(--wc-border); border-radius: 2px; overflow: hidden; }\n.wc-seg label { flex: 1; cursor: pointer; margin: 0; }\n.wc-seg input { position: absolute; opacity: 0; pointer-events: none; }\n.wc-seg span { display: block; text-align: center; padding: 5px 8px; font-family: var(--wc-mono); font-size: 13px; border-right: 1px solid var(--wc-border); white-space: nowrap; background: var(--wc-bg); }\n.wc-seg label:last-child span { border-right: 0; font-family: var(--wc-sans); }\n.wc-seg input:checked + span { background: var(--wc-accent); color: var(--wc-on-accent); }\n.wc-seg input:focus-visible + span { outline: 2px solid var(--wc-accent); outline-offset: -2px; }\n.wc-placement-hint { margin: 6px 0 8px; }\n.wc-options summary { cursor: pointer; color: var(--wc-accent); font-weight: 700; font-size: 13px; margin-bottom: 6px; }\n\n.wc-warnings { display: grid; gap: 6px; margin-bottom: 8px; }\n.wc-warning { background: var(--wc-warn-bg); border-left: 3px solid var(--wc-warn-border); padding: 5px 10px; font-size: 13px; }\n.wc-snippets { display: grid; gap: 8px; }\n.wc-snippet { border: 1px solid var(--wc-border-soft); border-radius: 2px; overflow: hidden; }\n.wc-snippet-head { display: flex; justify-content: space-between; align-items: center; gap: 6px; padding: 3px 4px 3px 10px; background: var(--wc-bg2); font-size: 12.5px; color: var(--wc-muted); font-weight: 700; }\n.wc-snippet-head > span:last-child { display: flex; gap: 4px; }\n.wikicite .wc-snippet pre {\n  margin: 0; padding: 8px 10px; border: 0; border-radius: 0; background: var(--wc-bg); color: var(--wc-text);\n  font-family: var(--wc-mono); font-size: 12.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; max-height: 260px; overflow: auto;\n}\n.wc-preview-head { margin-top: 14px; }\n.wc-preview { border: 1px dashed var(--wc-border); border-radius: 2px; padding: 8px 10px; min-height: 40px; overflow-wrap: anywhere; }\n.wc-preview p { margin: 0; }\n\n.wc-spinner { width: 14px; height: 14px; border: 2px solid var(--wc-border-soft); border-top-color: var(--wc-accent); border-radius: 50%; display: inline-block; animation: wc-spin .7s linear infinite; vertical-align: middle; }\n@keyframes wc-spin { to { transform: rotate(360deg); } }\n");

var CiteEngine = (function () {
  var module = { exports: {} };
/*!
 * citation.js — turns Wikidata entities into Wikipedia citation templates.
 * Pure functions, no DOM and no network: works in the browser (window.CiteEngine)
 * and in Node (module.exports) so it can be unit-tested.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CiteEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. Configuration
   * ------------------------------------------------------------------ */

  // Wikidata classes (values of P31 "instance of") treated as citable.
  // kind = how the item is cited; group = how it is shown in the filter panel.
  var TYPES = [
    { qid: 'Q571',      label: 'book',                         group: 'Books',             kind: 'book' },
    { qid: 'Q3331189',  label: 'version, edition or translation', group: 'Books',          kind: 'book' },
    { qid: 'Q7725634',  label: 'literary work',                group: 'Books',             kind: 'book' },
    { qid: 'Q47461344', label: 'written work',                 group: 'Books',             kind: 'book' },
    { qid: 'Q8261',     label: 'novel',                        group: 'Books',             kind: 'book' },
    { qid: 'Q193495',   label: 'monograph',                    group: 'Books',             kind: 'book' },
    { qid: 'Q83790',    label: 'textbook',                     group: 'Books',             kind: 'book' },
    { qid: 'Q1279564',  label: 'edited volume',                group: 'Books',             kind: 'book' },
    { qid: 'Q105420',   label: 'anthology',                    group: 'Books',             kind: 'book' },
    { qid: 'Q5292',     label: 'encyclopedia',                 group: 'Books',             kind: 'book' },
    { qid: 'Q23622',    label: 'dictionary',                   group: 'Books',             kind: 'book' },
    { qid: 'Q1980247',  label: 'chapter',                      group: 'Books',             kind: 'chapter' },

    { qid: 'Q13442814', label: 'scholarly article',            group: 'Journal articles',  kind: 'article' },
    { qid: 'Q18918145', label: 'academic journal article',     group: 'Journal articles',  kind: 'article' },
    { qid: 'Q7318358',  label: 'review article',               group: 'Journal articles',  kind: 'article' },
    { qid: 'Q2782326',  label: 'case report',                  group: 'Journal articles',  kind: 'article' },
    { qid: 'Q871232',   label: 'editorial',                    group: 'Journal articles',  kind: 'article' },
    { qid: 'Q45182324', label: 'retracted article',            group: 'Journal articles',  kind: 'article' },
    { qid: 'Q580922',   label: 'preprint',                     group: 'Journal articles',  kind: 'preprint' },
    { qid: 'Q191067',   label: 'article',                      group: 'Journal articles',  kind: 'article' },

    { qid: 'Q5707594',  label: 'news article',                 group: 'News & magazines',  kind: 'news' },
    { qid: 'Q30070590', label: 'magazine article',             group: 'News & magazines',  kind: 'magazine' },
    { qid: 'Q17928402', label: 'blog post',                    group: 'News & magazines',  kind: 'web' },

    { qid: 'Q13433827', label: 'encyclopedia article',         group: 'Other publications', kind: 'encyclopedia' },
    { qid: 'Q17329259', label: 'encyclopedic entry',           group: 'Other publications', kind: 'encyclopedia' },
    { qid: 'Q23927052', label: 'conference paper',             group: 'Other publications', kind: 'conference' },
    { qid: 'Q187685',   label: 'doctoral thesis',              group: 'Other publications', kind: 'thesis', degree: 'PhD' },
    { qid: 'Q1907875',  label: "master's thesis",              group: 'Other publications', kind: 'thesis', degree: "Master's" },
    { qid: 'Q1266946',  label: 'thesis',                       group: 'Other publications', kind: 'thesis' },
    { qid: 'Q10870555', label: 'report',                       group: 'Other publications', kind: 'report' },
    { qid: 'Q732577',   label: 'publication',                  group: 'Other publications', kind: 'generic' },
    { qid: 'Q49848',    label: 'document',                     group: 'Other publications', kind: 'generic' }
  ];

  // P31 of the "published in" (P1433) container → how its contents are cited.
  var CONTAINER_KIND = {
    Q11032: 'news', Q1110794: 'news',                                   // newspaper, daily newspaper
    Q41298: 'magazine',                                                  // magazine
    Q737498: 'journal', Q5633421: 'journal', Q1002697: 'journal',       // academic / scientific journal, periodical
    Q5292: 'encyclopedia', Q23622: 'encyclopedia', Q13136: 'encyclopedia', // encyclopedia, dictionary, reference work
    Q35127: 'web', Q30849: 'web',                                        // website, blog
    Q1143604: 'conference',                                              // proceedings
    Q571: 'book', Q3331189: 'book', Q47461344: 'book', Q7725634: 'book', Q1279564: 'book', Q105420: 'book'
  };

  var TEMPLATES = [
    'cite book', 'cite journal', 'cite news', 'cite magazine', 'cite encyclopedia',
    'cite conference', 'cite thesis', 'cite report', 'cite web', 'cite arXiv', 'Citation', 'Cite Q'
  ];

  var KIND_TEMPLATE = {
    book: 'cite book', chapter: 'cite book', journal: 'cite journal', news: 'cite news',
    magazine: 'cite magazine', encyclopedia: 'cite encyclopedia', conference: 'cite conference',
    thesis: 'cite thesis', report: 'cite report', web: 'cite web', arxiv: 'cite arXiv', generic: 'Citation'
  };

  var KIND_PRIORITY = ['chapter', 'news', 'magazine', 'encyclopedia', 'conference', 'thesis',
    'report', 'web', 'article', 'preprint', 'book', 'generic'];

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];

  // Properties needing a label (or a sitelink) to be fetched separately.
  var REF_PROPS = ['P31', 'P50', 'P98', 'P655', 'P123', 'P291', 'P1433', 'P407', 'P179', 'P4101', 'P629'];

  /* ------------------------------------------------------------------ *
   * 2. Small helpers for reading Wikidata JSON
   * ------------------------------------------------------------------ */

  function statementsRaw(e, pid) {
    var arr = (e && e.claims && e.claims[pid]) || [];
    return arr.filter(function (s) {
      return s.rank !== 'deprecated' && s.mainsnak && s.mainsnak.snaktype === 'value' && s.mainsnak.datavalue;
    });
  }
  // preferred-rank statements first
  function statements(e, pid) {
    var ok = statementsRaw(e, pid);
    return ok.filter(function (s) { return s.rank === 'preferred'; })
      .concat(ok.filter(function (s) { return s.rank !== 'preferred'; }));
  }
  function dv(s) { return s.mainsnak.datavalue.value; }
  function idOf(v) { return v && (v.id || (v['numeric-id'] != null ? 'Q' + v['numeric-id'] : null)); }
  function qualVal(s, pid) {
    var q = s.qualifiers && s.qualifiers[pid];
    if (!q || !q.length || !q[0].datavalue) return null;
    return q[0].datavalue.value;
  }
  function first(e, pid) { var s = statements(e, pid)[0]; return s ? dv(s) : null; }
  function firstString(e, pid) {
    var v = first(e, pid);
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (v.text) return v.text;
    if (v.amount) return String(v.amount).replace(/^\+/, '');
    return '';
  }
  function itemIds(e, pid) { return statementsRaw(e, pid).map(function (s) { return idOf(dv(s)); }).filter(Boolean); }

  // Which wiki the citation is for: sitelinks become wikilinks only when an
  // article exists there, and labels prefer that wiki's language.
  var CONFIG = { wiki: 'enwiki', lang: 'en' };
  function configure(o) {
    if (o && o.wiki) CONFIG.wiki = o.wiki;
    if (o && o.lang) CONFIG.lang = o.lang;
    return CONFIG;
  }

  function labelOf(e, lang) {
    if (!e || !e.labels) return e && e.id ? e.id : '';
    lang = lang || CONFIG.lang;
    if (e.labels[lang]) return e.labels[lang].value;
    if (e.labels.mul) return e.labels.mul.value;
    if (e.labels.en) return e.labels.en.value;
    var k = Object.keys(e.labels)[0];
    return k ? e.labels[k].value : e.id;
  }
  function descriptionOf(e, lang) {
    if (!e || !e.descriptions) return '';
    var d = e.descriptions[lang || CONFIG.lang] || e.descriptions.en || e.descriptions.mul;
    return d ? d.value : '';
  }
  /** English label only (no fallback), used for ref names. */
  function enLabel(e) {
    return e && e.labels && e.labels.en ? e.labels.en.value : '';
  }
  function enwikiTitle(e) {
    return e && e.sitelinks && e.sitelinks[CONFIG.wiki] ? e.sitelinks[CONFIG.wiki].title : '';
  }

  /** All entity ids referenced by an item that we need labels for. */
  function referencedIds(e, opts) {
    var ids = [];
    var props = (opts && opts.props) || REF_PROPS;
    props.forEach(function (p) {
      statementsRaw(e, p).forEach(function (s) {
        var id = idOf(dv(s));
        if (id && ids.indexOf(id) < 0) ids.push(id);
      });
    });
    return ids;
  }

  /* ------------------------------------------------------------------ *
   * 3. Dates and names
   * ------------------------------------------------------------------ */

  function parseTime(v) {
    if (!v || !v.time) return null;
    var m = /^([+-])(\d+)-(\d\d)-(\d\d)/.exec(v.time);
    if (!m) return null;
    return {
      bce: m[1] === '-', year: parseInt(m[2], 10), month: parseInt(m[3], 10),
      day: parseInt(m[4], 10), precision: v.precision || 9
    };
  }

  function formatDate(d, style) {
    if (!d) return '';
    if (d.bce) return d.year + ' BC';
    var y = String(d.year);
    if (d.precision <= 9 || !d.month || style === 'year') return y;
    var mon = MONTHS[d.month - 1];
    if (d.precision === 10 || !d.day) return mon + ' ' + y; // CS1 forbids YYYY-MM
    if (style === 'iso') return y.padStart(4, '0') + '-' + String(d.month).padStart(2, '0') + '-' + String(d.day).padStart(2, '0');
    if (style === 'mdy') return mon + ' ' + d.day + ', ' + y;
    return d.day + ' ' + mon + ' ' + y;
  }

  function todayDate(now) {
    now = now || new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), precision: 11 };
  }

  var PARTICLES = /^(van|von|der|den|de|del|della|des|di|da|du|dos|das|la|le|bin|ibn|al|el|ter|ten|zu|af|av|y)$/;
  var SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv)$/i;

  /** "J. R. R. Tolkien" → {first:"J. R. R.", last:"Tolkien"}; "Ludwig van Beethoven" → last "van Beethoven". */
  function splitName(full) {
    full = String(full || '').trim().replace(/\s+/g, ' ');
    if (!full) return { first: '', last: '' };
    if (full.indexOf(',') > 0) {
      var c = full.indexOf(',');
      return { last: full.slice(0, c).trim(), first: full.slice(c + 1).trim() };
    }
    var parts = full.split(' ');
    if (parts.length === 1) return { first: '', last: full };
    var suffix = '';
    if (parts.length > 2 && SUFFIX.test(parts[parts.length - 1])) suffix = parts.pop();
    var i = parts.length - 1;
    while (i > 1 && PARTICLES.test(parts[i - 1])) i--;
    var res = { first: parts.slice(0, i).join(' '), last: parts.slice(i).join(' ') };
    if (suffix) res.first += ' ' + suffix;
    return res;
  }

  /* ------------------------------------------------------------------ *
   * 4. Wikidata item → normalised record
   * ------------------------------------------------------------------ */

  function typeInfo(qid) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].qid === qid) return TYPES[i];
    return null;
  }

  function containerKindOf(ce) {
    if (!ce) return '';
    var t = itemIds(ce, 'P31');
    for (var i = 0; i < t.length; i++) if (CONTAINER_KIND[t[i]]) return CONTAINER_KIND[t[i]];
    return '';
  }

  /**
   * @param item  full entity (claims, labels, sitelinks)
   * @param ents  Map or object: id → entity (labels + sitelinks; claims for containers if available)
   */
  function buildRecord(item, ents, depth) {
    depth = depth || 0;
    var get = function (id) { return ents && (ents.get ? ents.get(id) : ents[id]); };
    var label = function (id) { var e = get(id); return e ? labelOf(e) : id; };
    var link = function (id) { return enwikiTitle(get(id)); };
    var ref = function (id) { return id ? { qid: id, label: label(id), link: link(id) } : null; };

    var rec = { qid: item.id, label: labelOf(item), enLabel: enLabel(item), description: descriptionOf(item) };
    rec.types = itemIds(item, 'P31');
    rec.typeLabels = rec.types.map(function (q) { var t = typeInfo(q); return get(q) ? label(q) : (t ? t.label : q); });

    // title
    var t = first(item, 'P1476');
    rec.title = (t && t.text) || rec.label || '';
    var sub = firstString(item, 'P1680');
    if (sub && rec.title.indexOf(sub) < 0) rec.title += ': ' + sub;

    // people (ordered by "series ordinal" qualifier P1545 when present)
    function people(pidItem, pidString) {
      var list = [];
      statementsRaw(item, pidItem).forEach(function (s, idx) {
        var id = idOf(dv(s));
        var stated = qualVal(s, 'P1932');
        var ord = parseInt(qualVal(s, 'P1545'), 10);
        list.push({ qid: id, name: stated || label(id), enName: enLabel(get(id)), link: link(id), ord: isNaN(ord) ? null : ord, idx: idx });
      });
      if (pidString) statementsRaw(item, pidString).forEach(function (s, idx) {
        var ord = parseInt(qualVal(s, 'P1545'), 10);
        list.push({ qid: null, name: dv(s), link: '', ord: isNaN(ord) ? null : ord, idx: 10000 + idx });
      });
      list.sort(function (a, b) {
        var ao = a.ord == null ? Infinity : a.ord, bo = b.ord == null ? Infinity : b.ord;
        return (ao === bo ? 0 : ao - bo) || a.idx - b.idx;
      });
      return list.map(function (p) { var n = splitName(p.name); return { name: p.name, first: n.first, last: n.last, enName: p.enName || '', link: p.link, qid: p.qid }; });
    }
    rec.authors = people('P50', 'P2093');
    rec.editors = people('P98');
    rec.translators = people('P655');

    var pubIds = itemIds(item, 'P123');
    rec.publisher = pubIds.length ? ref(pubIds[0]) : null;
    if (pubIds.length > 1) rec.publisher.label = pubIds.map(label).join(' / '), rec.publisher.link = '';
    var placeIds = itemIds(item, 'P291');
    rec.place = placeIds.map(label).join(', ');
    rec.date = parseTime(first(item, 'P577'));
    rec.origDate = null;
    rec.edition = firstString(item, 'P393');
    rec.volume = firstString(item, 'P478');
    rec.issue = firstString(item, 'P433');
    rec.pages = firstString(item, 'P304');
    rec.numPages = firstString(item, 'P1104');

    var seriesSt = statements(item, 'P179')[0];
    rec.series = seriesSt ? ref(idOf(dv(seriesSt))) : null;
    rec.seriesNumber = seriesSt ? (qualVal(seriesSt, 'P1545') || '') : '';

    var langIds = itemIds(item, 'P407');
    rec.language = langIds.length ? label(langIds[0]) : '';
    rec.languageQid = langIds[0] || '';
    // Wikimedia language code (P424) of the language item, e.g. "de": CS1 renders
    // codes in the reader's wiki language, so they work on every wiki.
    rec.languageCode = langIds.length ? firstString(get(langIds[0]), 'P424') : '';

    var inst = itemIds(item, 'P4101');
    rec.institution = inst.length ? ref(inst[0]) : null;

    var cont = itemIds(item, 'P1433');
    rec.container = cont.length ? ref(cont[0]) : null;
    var contEnt = cont.length ? get(cont[0]) : null;
    if (rec.container) rec.container.kind = containerKindOf(contEnt);

    rec.url = firstString(item, 'P953') || firstString(item, 'P856') || firstString(item, 'P2699');

    rec.ids = {
      doi: firstString(item, 'P356'),
      isbn: firstString(item, 'P212') || firstString(item, 'P957'),
      issn: contEnt ? firstString(contEnt, 'P236') : '',
      oclc: firstString(item, 'P243'),
      lccn: firstString(item, 'P1144'),
      ol: firstString(item, 'P648').replace(/^OL/i, ''),
      pmid: firstString(item, 'P698'),
      pmc: firstString(item, 'P932').replace(/^PMC/i, ''),
      jstor: firstString(item, 'P888'),
      arxiv: firstString(item, 'P818'),
      zbl: firstString(item, 'P894'),
      hdl: firstString(item, 'P1184')
    };

    // thesis degree
    rec.degree = '';
    rec.types.forEach(function (q) { var ti = typeInfo(q); if (ti && ti.degree && !rec.degree) rec.degree = ti.degree; });

    rec.editionOf = itemIds(item, 'P629')[0] || '';
    rec.hasEditions = itemIds(item, 'P747');

    rec.kind = inferKind(rec);

    // A chapter / encyclopedia entry / conference paper usually keeps its
    // publisher, date and ISBN on the containing book: borrow what is missing.
    if (depth === 0 && contEnt && contEnt.claims && ['chapter', 'encyclopedia', 'conference'].indexOf(rec.kind) >= 0) {
      var c = buildRecord(contEnt, ents, depth + 1);
      fillMissing(rec, c, ['publisher', 'place', 'date', 'edition', 'volume', 'series', 'seriesNumber', 'editors', 'language']);
      if (!rec.ids.isbn) rec.ids.isbn = c.ids.isbn;
      if (!rec.ids.oclc) rec.ids.oclc = c.ids.oclc;
    }
    return rec;
  }

  function isEmpty(v) {
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  }

  /** Copy fields from `other` into `rec` where `rec` has nothing. */
  function fillMissing(rec, other, fields) {
    fields.forEach(function (f) { if (isEmpty(rec[f]) && !isEmpty(other[f])) rec[f] = other[f]; });
    return rec;
  }

  /** Merge an edition (more specific) with its work (has the authors / first date). */
  function mergeEditionWork(edition, work) {
    var r = JSON.parse(JSON.stringify(edition));
    fillMissing(r, work, ['authors', 'editors', 'translators', 'title', 'series', 'language']);
    if (work.date && r.date && work.date.year !== r.date.year) r.origDate = work.date;
    if (!r.date && work.date) r.date = work.date;
    Object.keys(work.ids || {}).forEach(function (k) { if (!r.ids[k] && work.ids[k] && k !== 'isbn') r.ids[k] = work.ids[k]; });
    r.kind = edition.kind === 'generic' ? work.kind : edition.kind;
    return r;
  }

  function inferKind(rec) {
    var kinds = rec.types.map(function (q) { var t = typeInfo(q); return t && t.kind; }).filter(Boolean);
    var ck = rec.container && rec.container.kind;
    var best = null;
    for (var i = 0; i < KIND_PRIORITY.length; i++) if (kinds.indexOf(KIND_PRIORITY[i]) >= 0) { best = KIND_PRIORITY[i]; break; }
    if (best === 'chapter') return (ck === 'encyclopedia' || ck === 'conference') ? ck : 'chapter';
    if (best === 'article') {
      if (ck === 'book') return 'chapter';
      if (ck && ck !== 'journal') return ck;
      return 'journal';
    }
    if (best === 'preprint') return rec.ids.arxiv ? 'arxiv' : 'journal';
    if (best && best !== 'generic') return best;
    if (ck) return ck === 'book' ? 'chapter' : ck;
    if (rec.ids.isbn) return 'book';
    if (rec.ids.doi || rec.volume || rec.issue) return 'journal';
    if (best === 'generic') return 'generic';
    return rec.url ? 'web' : 'book';
  }

  function defaultTemplate(rec) { return KIND_TEMPLATE[rec.kind] || 'Citation'; }

  /* ------------------------------------------------------------------ *
   * 5. Record → template parameters
   * ------------------------------------------------------------------ */

  function escVal(s) {
    return String(s == null ? '' : s).replace(/\s*\n\s*/g, ' ').replace(/\}\}/g, '}&#125;').replace(/\|/g, '{{!}}').trim();
  }
  function escTitle(s) { return escVal(s).replace(/\[/g, '&#91;').replace(/\]/g, '&#93;'); }

  function wl(obj, opts) {
    if (!obj) return '';
    var lab = escVal(obj.label);
    if (opts.wikilinks && obj.link) return obj.link === obj.label ? '[[' + obj.link + ']]' : '[[' + obj.link + '|' + lab + ']]';
    return lab;
  }

  function paramKind(template, rec) {
    switch (template) {
      case 'cite book':
        return (rec.container && ['chapter', 'encyclopedia', 'conference'].indexOf(rec.kind) >= 0) ? 'chapter' : 'book';
      case 'cite journal': return 'journal';
      case 'cite news': return 'news';
      case 'cite magazine': return 'magazine';
      case 'cite encyclopedia': return 'encyclopedia';
      case 'cite conference': return 'conference';
      case 'cite thesis': return 'thesis';
      case 'cite report': return 'report';
      case 'cite web': return 'web';
      case 'cite arXiv': return 'arxiv';
      default: return rec.kind === 'generic' ? 'book' : rec.kind;
    }
  }

  var DEFAULT_OPTS = {
    nameMode: 'split',      // 'split' → last/first, 'full' → author
    maxAuthors: 8,
    authorLinks: true,
    wikilinks: true,
    dateFormat: 'dmy',      // 'dmy' | 'mdy' | 'iso'
    accessDate: true,
    includeLanguage: true,
    allIds: true,
    wikidataId: true,       // |id=Wikidata [[d:Q…|Q…]]
    now: null
  };

  function withDefaults(opts) {
    var o = {};
    Object.keys(DEFAULT_OPTS).forEach(function (k) { o[k] = opts && opts[k] !== undefined ? opts[k] : DEFAULT_OPTS[k]; });
    return o;
  }

  function peopleParams(list, role, opts, max) {
    var out = [];
    var shown = max ? list.slice(0, max) : list;
    var single = shown.length === 1;
    shown.forEach(function (p, i) {
      var n = single ? '' : String(i + 1);
      var keys = {
        author: { last: 'last' + n, first: 'first' + n, full: 'author' + n, link: 'author-link' + n },
        editor: { last: 'editor-last' + n, first: 'editor-first' + n, full: 'editor' + n, link: 'editor-link' + n },
        translator: { last: 'translator-last' + n, first: 'translator-first' + n, full: 'translator' + n, link: 'translator-link' + n }
      }[role];
      if (opts.nameMode === 'full' || !p.last) {
        out.push([keys.full, escVal(p.name)]);
      } else {
        out.push([keys.last, escVal(p.last)]);
        if (p.first) out.push([keys.first, escVal(p.first)]);
      }
      if (opts.authorLinks && p.link) out.push([keys.link, p.link]);
    });
    if (max && list.length > max) out.push([role === 'author' ? 'display-authors' : 'display-' + role + 's', 'etal']);
    return out;
  }

  /**
   * Returns an ordered array of [name, value] pairs for the full citation.
   * Page/location handling for the specific citation is added later by generate().
   */
  function buildParams(rec, template, opts) {
    opts = withDefaults(opts);
    if (template === 'Cite Q') return [[null, rec.qid]];

    var pk = paramKind(template, rec);
    var P = [];
    var add = function (k, v) { if (v != null && String(v).trim() !== '') P.push([k, String(v)]); };
    var c = rec.container;
    var cLabel = c ? wl(c, opts) : '';
    var date = formatDate(rec.date, opts.dateFormat);

    P = P.concat(peopleParams(rec.authors, 'author', opts, opts.maxAuthors));

    // titles and containers
    if (pk === 'chapter') {
      add('chapter', escTitle(rec.title));
      add('title', c ? escTitle(c.label) : '');
      if (c && opts.wikilinks && c.link) add('title-link', c.link);
    } else {
      add('title', escTitle(rec.title));
      if (pk === 'journal') add('journal', cLabel);
      else if (pk === 'news') add(c && c.kind === 'web' ? 'work' : 'newspaper', cLabel);
      else if (pk === 'magazine') add('magazine', cLabel);
      else if (pk === 'web') add('website', cLabel);
      else if (pk === 'encyclopedia') add('encyclopedia', cLabel);
      else if (pk === 'conference') add('book-title', c ? escVal(c.label) : '');
      else if (c && pk !== 'thesis' && pk !== 'arxiv') add('work', cLabel);
    }

    if (pk === 'arxiv') {
      add('eprint', rec.ids.arxiv);
      add('date', date);
      return P;
    }

    P = P.concat(peopleParams(rec.editors, 'editor', opts, 0));
    P = P.concat(peopleParams(rec.translators, 'translator', opts, 0));

    if (pk === 'book' || pk === 'chapter' || pk === 'encyclopedia' || pk === 'report') {
      if (rec.series) add('series', wl(rec.series, opts));
      add('edition', escVal(rec.edition));
    }
    var volume = rec.volume || (rec.series ? rec.seriesNumber : '');
    add('volume', escVal(volume));
    if (pk === 'journal' || pk === 'magazine' || pk === 'news' || pk === 'web') add('issue', escVal(rec.issue));

    if (pk === 'thesis') {
      add('degree', rec.degree);
      add('publisher', wl(rec.institution || rec.publisher, opts));
    } else if (['journal', 'news', 'magazine', 'web'].indexOf(pk) < 0 || !c) {
      add('publisher', wl(rec.publisher, opts));
    }
    if (['book', 'chapter', 'encyclopedia', 'conference', 'report', 'thesis'].indexOf(pk) >= 0) add('location', escVal(rec.place));

    add('date', date);
    if (rec.origDate) add('orig-date', formatDate(rec.origDate, opts.dateFormat));

    // page range of the item inside its container (articles, chapters, entries)
    if (rec.pages && pk !== 'book') add(/[-–,]/.test(rec.pages) ? 'pages' : 'page', normalisePages(rec.pages));

    if (opts.includeLanguage) {
      var code = rec.languageCode;
      var isEnglish = code ? /^en(-|$)/i.test(code) : (rec.languageQid === 'Q1860' || /^english$/i.test(rec.language));
      if (!isEnglish && (code || rec.language)) add('language', escVal(code || rec.language));
    }

    var ids = rec.ids, all = opts.allIds;
    add('doi', ids.doi);
    add('isbn', ids.isbn);
    if (all) {
      if (pk === 'journal' || pk === 'magazine') add('issn', ids.issn);
      add('oclc', ids.oclc);
      add('lccn', ids.lccn);
      add('ol', ids.ol);
      add('pmid', ids.pmid);
      add('pmc', ids.pmc);
      add('jstor', ids.jstor);
      add('arxiv', ids.arxiv);
      add('zbl', ids.zbl);
      add('hdl', ids.hdl);
    }
    // CS1 has no |wikidata= parameter; |id= is its slot for other identifiers
    // and renders like {{Cite Q}}: "Wikidata Q42" linked to the item.
    if (opts.wikidataId && /^Q\d+$/.test(rec.qid || '')) add('id', 'Wikidata [[d:' + rec.qid + '|' + rec.qid + ']]');
    if (rec.url) {
      add('url', rec.url);
      if (opts.accessDate) add('access-date', formatDate(todayDate(opts.now), opts.dateFormat === 'year' ? 'iso' : opts.dateFormat));
    }
    return P;
  }

  /* ------------------------------------------------------------------ *
   * 6. Rendering and page-specific output
   * ------------------------------------------------------------------ */

  function normalisePages(p) {
    return String(p).trim()
      .replace(/(\w)\s*[-‐‑‒—]\s*(\w)/g, '$1–$2')
      .replace(/\s*–\s*/g, '–')
      .replace(/\s*,\s*/g, ', ');
  }

  /** Parse "12; 45-47; xii" into location objects. */
  function parseLocations(pagesInput, atInput) {
    var locs = String(pagesInput || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean)
      .map(function (s) {
        var v = normalisePages(s);
        return /[–,]/.test(v) ? { pages: v } : { page: v };
      });
    var at = String(atInput || '').trim();
    if (!locs.length && at) locs = [{ at: at }];
    return locs;
  }

  function locParams(loc) {
    if (!loc) return [];
    if (loc.page) return [['page', escVal(loc.page)]];
    if (loc.pages) return [['pages', escVal(loc.pages)]];
    if (loc.at) return [['at', escVal(loc.at)]];
    return [];
  }

  function renderTemplate(name, params, layout) {
    var ps = params.filter(function (p) { return p[1] != null && String(p[1]).trim() !== ''; });
    if (layout === 'vertical') {
      var w = 0;
      ps.forEach(function (p) { if (p[0] && p[0].length > w) w = p[0].length; });
      var lines = ps.map(function (p) { return p[0] === null ? '| ' + p[1] : '| ' + (p[0] + ' '.repeat(w)).slice(0, w) + ' = ' + p[1]; });
      return '{{' + name + '\n' + lines.join('\n') + '\n}}';
    }
    return '{{' + name + ps.map(function (p) { return p[0] === null ? ' |' + p[1] : ' |' + p[0] + '=' + p[1]; }).join('') + '}}';
  }

  // Keep letters, marks and digits of every script (Malayalam vowel signs are
  // marks; ZWNJ/ZWJ U+200C/U+200D are part of Indic spellings). Quotes, <, >,
  // / and spaces are dropped. MediaWiki rejects names that are only digits.
  var REF_NAME_DROP = /[^\p{L}\p{M}\p{N}\u200C\u200D_\-.]+/gu;
  function sanitizeRefName(s) {
    return Array.from(String(s || '').normalize('NFC').replace(REF_NAME_DROP, '')).slice(0, 40).join('');
  }
  function validRefName(s) { return !!s && !/^\d+$/.test(s); }

  /**
   * Default ref name, preferring English so names are easy to type and reuse
   * on any wiki: English surname of the first author (from the author item's
   * English label) + year; else the first words of the English title + year;
   * else the native-script surname or title; else the Q-number.
   */
  function defaultRefName(rec) {
    var a = rec.authors[0];
    var y = rec.date && !rec.date.bce ? rec.date.year : '';
    var words = function (t) { return String(t || '').split(':')[0].split(/\s+/).slice(0, 3).join(''); };
    var candidates = [
      a && a.enName ? splitName(a.enName).last : '',
      !a || !a.enName ? words(rec.enLabel) : '',
      a ? (a.last || a.name) : words(rec.title)
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (!sanitizeRefName(candidates[i])) continue;
      var name = sanitizeRefName(candidates[i] + y);
      if (validRefName(name)) return name;
    }
    return rec.qid || 'ref' + y;
  }

  function shortTitle(rec) {
    var t = (rec.title || rec.label || '').split(':')[0].trim();
    return t.length > 60 ? t.slice(0, 60).trim() : t;
  }

  /** {{sfn}} anchor: up to four surnames + year (falls back to a {{sfnref}} when no authors). */
  function sfnAnchor(rec, params) {
    var names = [];
    var hasLast = params.some(function (p) { return p[0] === 'last' || p[0] === 'last1'; });
    if (hasLast) {
      for (var i = 0; i < params.length && names.length < 4; i++) {
        if (/^last\d*$/.test(params[i][0])) names.push(params[i][1]);
      }
    } else {
      rec.authors.slice(0, 4).forEach(function (a) { names.push(escVal(a.last || a.name)); });
    }
    var year = rec.date ? (rec.date.bce ? rec.date.year + ' BC' : String(rec.date.year)) : 'n.d.';
    return { names: names, year: year };
  }

  /**
   * Build the final snippets.
   * cite = { template, params (array, possibly user-edited), pages, at, quote,
   *          placement: 'ref'|'bare'|'rp'|'sfn', refName, layout: 'inline'|'vertical' }
   */
  function generate(rec, cite) {
    var tpl = cite.template;
    var base = cite.params.slice();
    var layout = cite.layout || 'inline';
    var locs = parseLocations(cite.pages, cite.at);
    var quote = String(cite.quote || '').trim();
    var refName = sanitizeRefName(cite.refName);
    if (refName && !validRefName(refName)) refName = (rec.qid || 'ref') + '-' + refName;
    refName = refName || defaultRefName(rec);
    var placement = cite.placement || 'ref';
    var snippets = [];
    var warnings = [];

    var stripLoc = function (ps) { return ps.filter(function (p) { return ['page', 'pages', 'at'].indexOf(p[0]) < 0; }); };
    var withExtra = function (ps, extra) {
      var out = ps.concat(extra || []);
      if (quote) out.push(['quote', escVal(quote)]);
      return out;
    };
    var nameAttr = function (n) { return n ? ' name="' + n + '"' : ''; };

    var hasPageRange = base.some(function (p) { return p[0] === 'pages' || p[0] === 'page'; });

    if (placement === 'rp') {
      var full = renderTemplate(tpl, withExtra(base), layout);
      var refOpen = '<ref' + nameAttr(refName) + '>' + full + '</ref>';
      if (!locs.length) snippets.push({ label: 'Reference', text: refOpen });
      locs.forEach(function (l, i) {
        var v = l.page || l.pages || l.at;
        snippets.push({
          label: i === 0 ? 'First use (defines the reference)' : 'Reuse #' + (i + 1),
          text: (i === 0 ? refOpen : '<ref' + nameAttr(refName) + ' />') + '{{rp|' + escVal(v) + '}}'
        });
      });
      return { snippets: snippets, citation: full, warnings: warnings, refName: refName };
    }

    if (placement === 'sfn') {
      var ps = base.slice();
      var anchor = sfnAnchor(rec, ps);
      var hasDate = ps.some(function (p) { return p[0] === 'date' || p[0] === 'year'; });
      if (!anchor.names.length) {
        var st = escVal(shortTitle(rec));
        anchor.names = [st];
        ps.push(['ref', '{{sfnref|' + st + '|' + anchor.year + '}}']);
        warnings.push('No author: the citation gets |ref={{sfnref}} so {{sfn}} can link to it.');
      }
      if (!hasDate) warnings.push('No date: {{sfn}} needs |date= or |year= in the full citation to link.');
      if (tpl === 'Cite Q') warnings.push('{{Cite Q}} does not reliably produce {{sfn}} anchors; prefer a CS1 template here.');
      var fullS = renderTemplate(tpl, withExtra(ps), layout);
      snippets.push({ label: 'Full citation (for the References / Bibliography section)', text: '* ' + fullS });
      var head = '{{sfn|' + anchor.names.join('|') + '|' + anchor.year;
      if (!locs.length) snippets.push({ label: 'Short footnote (in article text)', text: head + '}}' });
      locs.forEach(function (l, i) {
        var lp = l.page ? '|p=' + escVal(l.page) : l.pages ? '|pp=' + escVal(l.pages) : '|loc=' + escVal(l.at);
        snippets.push({ label: 'Short footnote' + (locs.length > 1 ? ' #' + (i + 1) : '') + ' (in article text)', text: head + lp + '}}' });
      });
      return { snippets: snippets, citation: fullS, warnings: warnings, refName: refName };
    }

    // 'ref' or 'bare': page goes inside the citation itself
    if (locs.length && hasPageRange && tpl !== 'Cite Q') {
      warnings.push('The source\'s own page range was replaced by the page(s) you are citing. Use {{rp}} or {{sfn}} to keep both.');
    }
    var variants = locs.length ? locs : [null];
    var firstCitation = '';
    variants.forEach(function (l, i) {
      var ps2 = l ? stripLoc(base).concat(locParams(l)) : base;
      var t = renderTemplate(tpl, withExtra(ps2), layout);
      if (i === 0) firstCitation = t;
      var text = placement === 'bare' ? t : '<ref' + nameAttr(variants.length === 1 ? refName : refName + '-' + (i + 1)) + '>' + t + '</ref>';
      var where = l ? (l.page ? 'p. ' + l.page : l.pages ? 'pp. ' + l.pages : l.at) : '';
      snippets.push({ label: variants.length > 1 ? 'Citation for ' + where : (placement === 'bare' ? 'Citation' : 'Reference'), text: text });
    });
    if (variants.length > 1 && placement === 'ref') {
      warnings.push('Several different pages from one source: consider {{rp}} or {{sfn}} so the full citation appears only once.');
    }
    return { snippets: snippets, citation: firstCitation, warnings: warnings, refName: refName };
  }

  /* ------------------------------------------------------------------ *
   * 7. Search helpers
   * ------------------------------------------------------------------ */

  /** Detect identifier-style queries. Returns {kind, value} or null. */
  function detectIdentifier(q) {
    q = String(q || '').trim();
    var m;
    if ((m = /^(?:https?:\/\/(?:www\.)?wikidata\.org\/(?:wiki|entity)\/)?(Q\d+)$/i.exec(q))) return { kind: 'qid', value: m[1].toUpperCase() };
    if ((m = /^(?:doi:\s*|https?:\/\/(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/\S+)$/i.exec(q))) return { kind: 'doi', prop: 'P356', value: m[1].toUpperCase() };
    if ((m = /^pmid:?\s*(\d+)$/i.exec(q))) return { kind: 'pmid', prop: 'P698', value: m[1] };
    if ((m = /^pmc:?\s*(?:PMC)?(\d+)$/i.exec(q)) || (m = /^PMC(\d+)$/i.exec(q))) return { kind: 'pmc', prop: 'P932', value: m[1] };
    if ((m = /^arxiv:\s*(\S+)$/i.exec(q))) return { kind: 'arxiv', prop: 'P818', value: m[1] };
    if ((m = /^oclc:?\s*(\d+)$/i.exec(q))) return { kind: 'oclc', prop: 'P243', value: m[1] };
    if ((m = /^(?:isbn:?\s*)?((?:97[89][-\s]?)?\d{1,5}[-\s]?\d+[-\s]?\d+[-\s]?[\dX])$/i.exec(q))) {
      var digits = m[1].replace(/[-\s]/g, '');
      if (digits.length === 10 || digits.length === 13) return { kind: 'isbn', value: m[1].replace(/\s/g, '-'), digits: digits };
    }
    return null;
  }

  /** Split the type list into chunks so each CirrusSearch query stays short. */
  function haswbstatementChunks(qids, size) {
    size = size || 6;
    var out = [];
    for (var i = 0; i < qids.length; i += size) {
      out.push('haswbstatement:' + qids.slice(i, i + size).map(function (q) { return 'P31=' + q; }).join('|'));
    }
    return out;
  }

  return {
    TYPES: TYPES, TEMPLATES: TEMPLATES, KIND_TEMPLATE: KIND_TEMPLATE, CONTAINER_KIND: CONTAINER_KIND,
    REF_PROPS: REF_PROPS, MONTHS: MONTHS,
    statements: statements, statementsRaw: statementsRaw, itemIds: itemIds, firstString: firstString,
    configure: configure, CONFIG: CONFIG,
    labelOf: labelOf, descriptionOf: descriptionOf, enwikiTitle: enwikiTitle, referencedIds: referencedIds,
    parseTime: parseTime, formatDate: formatDate, splitName: splitName,
    buildRecord: buildRecord, mergeEditionWork: mergeEditionWork, inferKind: inferKind,
    defaultTemplate: defaultTemplate, buildParams: buildParams, renderTemplate: renderTemplate,
    parseLocations: parseLocations, normalisePages: normalisePages, generate: generate,
    defaultRefName: defaultRefName, sanitizeRefName: sanitizeRefName,
    detectIdentifier: detectIdentifier, haswbstatementChunks: haswbstatementChunks, typeInfo: typeInfo,
    escVal: escVal
  };
});
  return module.exports;
})();

/*
 * WikiCite user-script UI. Concatenated after citation.js by build.mjs;
 * `CiteEngine`, `mw` and `$` are in scope.
 */
/* global CiteEngine, mw, $ */
(function (C) {
  'use strict';

  if (window.wikiciteLoaded) return;
  window.wikiciteLoaded = true;

  var VERSION = '1.1.3';
  var REPO = 'https://github.com/wiki-librarians-network/wikicite';
  var WD_API = 'https://www.wikidata.org/w/api.php';
  var PAGE_SIZE = 20;
  var STORE = 'wikicite-settings';
  var userConf = window.wikiciteConfig || {};

  C.configure({ wiki: mw.config.get('wgDBname') || 'enwiki', lang: mw.config.get('wgContentLanguage') || 'en' });

  /* ------------------------------------------------------------------ *
   * Settings (per browser; window.wikiciteConfig overrides defaults)
   * ------------------------------------------------------------------ */
  var defaults = {
    types: C.TYPES.map(function (t) { return t.qid; }),
    customTypes: [],
    opts: { nameMode: 'split', maxAuthors: 8, authorLinks: true, wikilinks: true, dateFormat: 'dmy', accessDate: true, includeLanguage: true, allIds: true, wikidataId: true },
    placement: 'ref',
    layout: 'inline',
    livePreview: true,
    summaryTag: false
  };
  ['placement', 'layout', 'livePreview', 'summaryTag'].forEach(function (k) { if (userConf[k] !== undefined) defaults[k] = userConf[k]; });
  ['nameMode', 'maxAuthors', 'authorLinks', 'wikilinks', 'dateFormat', 'accessDate', 'includeLanguage', 'allIds', 'wikidataId'].forEach(function (k) {
    if (userConf[k] !== undefined) defaults.opts[k] = userConf[k];
  });

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var settings = (function () {
    var out = clone(defaults);
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (s) Object.keys(s).forEach(function (k) { out[k] = k === 'opts' ? Object.assign(out.opts, s.opts) : s[k]; });
    } catch (e) { /* ignore */ }
    return out;
  })();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  var root; // the <dialog>
  function q(s) { return root.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (children || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function esc(s) { return mw.html.escape(String(s == null ? '' : s)); }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }
  var X_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.3 3 5.7 5.7L15.7 3 17 4.3 11.3 10l5.7 5.7-1.3 1.3-5.7-5.7L4.3 17 3 15.7 8.7 10 3 4.3z"/></svg>';

  function flash(btn, txt) {
    var o = btn.textContent;
    btn.textContent = txt;
    btn.classList.add('wc-done');
    setTimeout(function () { btn.textContent = o; btn.classList.remove('wc-done'); }, 1300);
  }
  function copyText(text, btn) {
    var done = function () { if (btn) flash(btn, 'Copied'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
    } else { legacyCopy(text); done(); }
  }
  function legacyCopy(text) {
    var ta = el('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text; root.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  /* ------------------------------------------------------------------ *
   * APIs
   * ------------------------------------------------------------------ */
  var wd = new mw.ForeignApi(WD_API, { anonymous: true });
  var local = new mw.Api();
  function wdGet(params) {
    return new Promise(function (resolve, reject) {
      wd.get(Object.assign({ formatversion: 1 }, params)).then(resolve, function (code, data) {
        reject(new Error((data && data.error && data.error.info) || code || 'Wikidata request failed'));
      });
    });
  }

  var fullCache = new Map(), liteCache = new Map();
  function getEntity(id) { return fullCache.get(id) || liteCache.get(id); }
  var ents = { get: getEntity };

  // Language items are large; fetch only their P424 (Wikimedia language code)
  // and attach it to the cached entity so the engine can read it.
  var langDone = new Set();
  function fetchLanguageCodes(ids) {
    var need = ids.filter(function (id) { return id && !langDone.has(id); });
    return Promise.all(need.map(function (id) {
      langDone.add(id);
      return wdGet({ action: 'wbgetclaims', entity: id, property: 'P424' }).then(function (j) {
        var e = getEntity(id);
        if (e && j.claims) { e.claims = e.claims || {}; e.claims.P424 = j.claims.P424 || []; }
      }, function () { /* the language name is used instead */ });
    }));
  }

  function fetchEntities(ids, full) {
    var need = [];
    ids.forEach(function (id) {
      if (!id || need.indexOf(id) >= 0 || fullCache.has(id) || (!full && liteCache.has(id))) return;
      need.push(id);
    });
    var batches = [];
    for (var i = 0; i < need.length; i += 50) batches.push(need.slice(i, i + 50));
    return Promise.all(batches.map(function (b) {
      return wdGet({
        action: 'wbgetentities', ids: b.join('|'),
        props: full ? 'labels|descriptions|claims|sitelinks' : 'labels|sitelinks',
        languages: C.CONFIG.lang === 'en' ? 'en|mul' : C.CONFIG.lang + '|en|mul', sitefilter: C.CONFIG.wiki
      }).then(function (j) {
        Object.keys(j.entities || {}).forEach(function (k) {
          var e = j.entities[k];
          if (e.missing !== undefined) return;
          (full ? fullCache : liteCache).set(e.id || k, e);
          if (e.redirects && e.redirects.from) (full ? fullCache : liteCache).set(e.redirects.from, e);
        });
      });
    }));
  }

  /* ------------------------------------------------------------------ *
   * Edit box integration
   * ------------------------------------------------------------------ */
  function textbox() {
    var $t = $('#wpTextbox1');
    return $t.length && !$t.prop('readonly') ? $t : null;
  }
  function canInsert() { return !!textbox(); }
  function selectedText() {
    var $t = textbox();
    if (!$t) return '';
    try { return String($t.textSelection('getSelection') || '').trim(); } catch (e) { return ''; }
  }
  function insertText(text) {
    var $t = textbox();
    if (!$t) return false;
    // Insert after any selected text (the claim being supported), or at the cursor.
    $t.textSelection('encapsulateSelection', { pre: '', peri: '', post: text });
    if (settings.summaryTag) {
      var $s = $('#wpSummary');
      if ($s.length && !/WikiCite/.test($s.val())) $s.val(($s.val() ? $s.val().replace(/\s+$/, '') + ' ' : '') + '(citation via WikiCite)');
    }
    return true;
  }
  function existingRefNames() {
    var $t = textbox();
    var names = {};
    if (!$t) return names;
    var txt = $t.textSelection('getContents') || '';
    var re = /<ref\s[^>]*?name\s*=\s*["']?([^"'>\/]+?)["']?\s*\/?>/gi, m;
    while ((m = re.exec(txt))) names[m[1].trim()] = true;
    return names;
  }

  /* ------------------------------------------------------------------ *
   * Dialog markup
   * ------------------------------------------------------------------ */
  function build() {
    root = el('dialog', { class: 'wikicite', 'aria-label': 'WikiCite' });
    root.innerHTML = [
      '<div class="wc-shell">',
      '<header class="wc-head">',
      '  <button type="button" class="wc-icon wc-back" title="Back to results" aria-label="Back to results" hidden><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 3 1 10l7 7 1.4-1.4L4.8 11H19V9H4.8l4.6-4.6z"/></svg></button>',
      '  <div class="wc-titles"><h2 class="wc-title">WikiCite</h2><div class="wc-sub"></div></div>',
      '  <button type="button" class="wc-icon wc-close" title="Close (Esc)" aria-label="Close">' + X_ICON + '</button>',
      '</header>',

      '<section class="wc-pane wc-search-pane">',
      '  <form class="wc-search" role="search" autocomplete="off">',
      '    <input class="wc-q" type="search" placeholder="Title, author, DOI, ISBN, PMID or Q-number" aria-label="Search Wikidata">',
      '    <button type="submit" class="wc-btn wc-primary">Search</button>',
      '  </form>',
      '  <div class="wc-row-between">',
      '    <span class="wc-status" aria-live="polite"></span>',
      '    <button type="button" class="wc-btn wc-quiet wc-sm wc-toggle-types" aria-expanded="false">Publication types <span class="wc-pill wc-type-count"></span></button>',
      '  </div>',
      '  <div class="wc-types" hidden>',
      '    <div class="wc-row-between"><p class="wc-hint">Only Wikidata items that are an <i>instance of</i> (P31) one of these classes are listed.</p>',
      '      <span><button type="button" class="wc-btn wc-quiet wc-sm" data-sel="all">All</button><button type="button" class="wc-btn wc-quiet wc-sm" data-sel="none">None</button><button type="button" class="wc-btn wc-quiet wc-sm" data-sel="reset">Reset</button></span></div>',
      '    <div class="wc-type-groups"></div>',
      '    <form class="wc-custom-type"><label>Add another class <input class="wc-custom-q" placeholder="e.g. Q1555508"></label><button class="wc-btn wc-sm" type="submit">Add</button></form>',
      '  </div>',
      '  <ol class="wc-results"></ol>',
      '  <div class="wc-center"><button type="button" class="wc-btn wc-more" hidden>Load more results</button></div>',
      '</section>',

      '<section class="wc-pane wc-cite-pane" hidden>',
      '  <div class="wc-loading"><span class="wc-spinner"></span> Fetching data from Wikidata…</div>',
      '  <div class="wc-cite-body" hidden>',
      '    <div class="wc-col wc-col-data">',
      '      <div class="wc-field wc-edition-row" hidden><label>Edition<select class="wc-edition"></select></label>',
      '        <p class="wc-hint">This is a work with several editions on Wikidata. Choose the one you used.</p></div>',
      '      <div class="wc-field"><label>Template<select class="wc-template"></select></label></div>',
      '      <div class="wc-row-between"><h3>Fields</h3><button type="button" class="wc-btn wc-quiet wc-sm wc-refill" title="Discard your edits and refill from Wikidata">Refill from Wikidata</button></div>',
      '      <div class="wc-params"></div>',
      '      <form class="wc-add-param"><input class="wc-add-key" list="wikicite-params" placeholder="parameter" aria-label="New parameter name"><input class="wc-add-val" placeholder="value" aria-label="New parameter value"><button class="wc-btn wc-sm" type="submit">Add</button></form>',
      '      <datalist id="wikicite-params"></datalist>',
      '    </div>',
      '    <div class="wc-col">',
      '      <fieldset class="wc-box"><legend>What you are citing</legend>',
      '        <div class="wc-field"><label>Page(s)<input class="wc-pages" placeholder="e.g. 198  ·  198–203  ·  12; 45–47"></label><p class="wc-hint wc-pages-hint"></p></div>',
      '        <div class="wc-field"><label>Other location <span class="wc-muted">(used when no page is given)</span><input class="wc-at" placeholder="e.g. chap. 3 · § 4.2 · col. 2"></label></div>',
      '        <div class="wc-field"><label>Quote <span class="wc-muted">(optional, short)</span><textarea class="wc-quote" rows="2"></textarea></label></div>',
      '      </fieldset>',
      '      <fieldset class="wc-box"><legend>Output</legend>',
      '        <div class="wc-seg" role="radiogroup" aria-label="Citation style">',
      '          <label><input type="radio" name="wc-placement" value="ref"><span>&lt;ref&gt;</span></label>',
      '          <label><input type="radio" name="wc-placement" value="rp"><span>{{rp}}</span></label>',
      '          <label><input type="radio" name="wc-placement" value="sfn"><span>{{sfn}}</span></label>',
      '          <label><input type="radio" name="wc-placement" value="bare"><span>Template only</span></label>',
      '        </div>',
      '        <p class="wc-hint wc-placement-hint"></p>',
      '        <div class="wc-grid2">',
      '          <div class="wc-field wc-refname-field"><label>Ref name<input class="wc-refname" placeholder="auto"></label></div>',
      '          <div class="wc-field"><label>Layout<select class="wc-layout"><option value="inline">Single line</option><option value="vertical">One field per line</option></select></label></div>',
      '        </div>',
      '        <details class="wc-options"><summary>Formatting options</summary>',
      '          <div class="wc-grid3">',
      '            <div class="wc-field"><label>Date format<select class="wc-o-date"><option value="dmy">25 June 1997</option><option value="mdy">June 25, 1997</option><option value="iso">1997-06-25</option><option value="year">Year only</option></select></label></div>',
      '            <div class="wc-field"><label>Author names<select class="wc-o-names"><option value="split">last= / first=</option><option value="full">author=</option></select></label></div>',
      '            <div class="wc-field"><label>Authors to list<input class="wc-o-max" type="number" min="1" max="200"></label></div>',
      '          </div>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-authorlinks"> Link authors to their articles (<code>author-link</code>)</label>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-wikilinks"> Wikilink publisher, journal and series</label>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-access"> Add <code>access-date</code> when there is a URL</label>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-lang"> Add <code>language</code> when not English</label>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-ids"> Include all identifiers (OCLC, PMID, JSTOR…)</label>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-wdid"> Add the Wikidata item (<code>id=Wikidata Q…</code>)</label>',
      '          <label class="wc-check"><input type="checkbox" class="wc-o-summary"> Add “(citation via WikiCite)” to the edit summary</label>',
      '        </details>',
      '      </fieldset>',
      '      <div class="wc-row-between"><h3>Result</h3><span class="wc-insert-note wc-hint"></span></div>',
      '      <div class="wc-warnings"></div>',
      '      <div class="wc-snippets"></div>',
      '      <div class="wc-row-between wc-preview-head"><h3>Preview</h3><span><label class="wc-check wc-inline"><input type="checkbox" class="wc-live"> Live</label> <button type="button" class="wc-btn wc-quiet wc-sm wc-refresh">Refresh</button></span></div>',
      '      <div class="wc-preview"><span class="wc-muted">The rendered citation appears here.</span></div>',
      '    </div>',
      '  </div>',
      '</section>',

      '<footer class="wc-foot">WikiCite ' + VERSION + ' · data from <a href="https://www.wikidata.org/" target="_blank" rel="noopener">Wikidata</a> (CC0) · ',
      'maintained by <a href="https://github.com/wiki-librarians-network" target="_blank" rel="noopener">Wiki Librarians Network</a> · ',
      '<a href="' + REPO + '/issues" target="_blank" rel="noopener">report a problem</a></footer>',
      '</div>'
    ].join('\n');
    document.body.appendChild(root);
    bind();
    renderTypeFilters();
    optsToForm();
  }

  /* ------------------------------------------------------------------ *
   * Publication-type filter
   * ------------------------------------------------------------------ */
  function allTypes() {
    return C.TYPES.concat(settings.customTypes.map(function (t) { return { qid: t.qid, label: t.label, group: 'Added by you', kind: 'generic', custom: true }; }));
  }
  function selectedTypes() {
    var known = allTypes().map(function (t) { return t.qid; });
    return settings.types.filter(function (x) { return known.indexOf(x) >= 0; });
  }
  function renderTypeFilters() {
    var groups = {};
    allTypes().forEach(function (t) { (groups[t.group] = groups[t.group] || []).push(t); });
    var box = q('.wc-type-groups');
    box.innerHTML = '';
    Object.keys(groups).forEach(function (g) {
      var div = el('div', { class: 'wc-type-group' }, [el('h4', { text: g })]);
      groups[g].forEach(function (t) {
        var cb = el('input', { type: 'checkbox' });
        cb.checked = settings.types.indexOf(t.qid) >= 0;
        cb.addEventListener('change', function () {
          var i = settings.types.indexOf(t.qid);
          if (cb.checked && i < 0) settings.types.push(t.qid);
          if (!cb.checked && i >= 0) settings.types.splice(i, 1);
          save(); updateTypeCount();
        });
        var lab = el('label', null, [cb, ' ' + t.label + ' ', el('span', { class: 'wc-qid', text: t.qid })]);
        if (t.custom) lab.appendChild(el('button', {
          type: 'button', class: 'wc-link', text: 'remove', onclick: function (ev) {
            ev.preventDefault();
            settings.customTypes = settings.customTypes.filter(function (c) { return c.qid !== t.qid; });
            settings.types = settings.types.filter(function (x) { return x !== t.qid; });
            save(); renderTypeFilters();
          }
        }));
        div.appendChild(lab);
      });
      box.appendChild(div);
    });
    updateTypeCount();
  }
  function updateTypeCount() { q('.wc-type-count').textContent = selectedTypes().length + '/' + allTypes().length; }

  /* ------------------------------------------------------------------ *
   * Search
   * ------------------------------------------------------------------ */
  var st = null;
  function status(html, err) { var s = q('.wc-status'); s.innerHTML = html; s.classList.toggle('wc-error', !!err); }

  function startSearch(text) {
    text = String(text || '').trim();
    if (!text) return;
    showPane('search');
    var types = selectedTypes();
    if (!types.length) { status('Select at least one publication type.', true); return; }
    var idq = C.detectIdentifier(text);
    var queries;
    if (idq && idq.kind === 'qid') queries = null;
    else if (idq && idq.kind === 'isbn') queries = ['haswbstatement:P212=' + idq.value + '|P957=' + idq.value, text.replace(/^isbn:?\s*/i, '')];
    else if (idq && idq.prop) queries = ['haswbstatement:' + idq.prop + '=' + idq.value];
    else queries = C.haswbstatementChunks(types, 6).map(function (c) { return text + ' ' + c; });
    st = {
      text: text, idq: idq, types: types, seen: new Set(), shown: 0, filteredOut: [],
      chunks: queries ? queries.map(function (s) { return { srsearch: s, offset: 0, done: false, total: 0 }; }) : null
    };
    q('.wc-results').innerHTML = '';
    q('.wc-more').hidden = true;
    status('<span class="wc-spinner"></span> Searching Wikidata…');
    var s0 = st;
    (idq && idq.kind === 'qid' ? Promise.resolve([idq.value]) : nextPage(s0))
      .then(function (ids) { return showResults(s0, ids, true); })
      .catch(function (err) { if (s0 === st) status('Search failed: ' + esc(err.message), true); });
  }

  function nextPage(s) {
    return Promise.all(s.chunks.filter(function (c) { return !c.done; }).map(function (c) {
      return wdGet({ action: 'query', list: 'search', srsearch: c.srsearch, srnamespace: 0, srlimit: PAGE_SIZE, sroffset: c.offset, srinfo: 'totalhits', srprop: '' })
        .then(function (j) {
          c.total = (j.query && j.query.searchinfo && j.query.searchinfo.totalhits) || c.total;
          if (j['continue'] && j['continue'].sroffset) c.offset = j['continue'].sroffset; else c.done = true;
          return ((j.query && j.query.search) || []).map(function (r) { return r.title; });
        })
        .catch(function () { c.done = true; return []; });
    })).then(function (lists) {
      var out = [], max = Math.max.apply(null, lists.map(function (l) { return l.length; }).concat(0));
      for (var i = 0; i < max; i++) lists.forEach(function (l) {
        if (l[i] && !s.seen.has(l[i]) && /^Q\d+$/.test(l[i])) { s.seen.add(l[i]); out.push(l[i]); }
      });
      return out;
    });
  }

  function isCitable(e, types) { return C.itemIds(e, 'P31').some(function (x) { return types.indexOf(x) >= 0; }); }

  function showResults(s, ids, first) {
    if (s !== st) return;
    return fetchEntities(ids, true).then(function () {
      var items = ids.map(function (id) { return fullCache.get(id); }).filter(Boolean);
      var good = items.filter(function (e) { return isCitable(e, s.types); });
      items.forEach(function (e) { if (!isCitable(e, s.types)) s.filteredOut.push(e); });
      var refs = [];
      good.forEach(function (e) {
        refs = refs.concat(C.itemIds(e, 'P31'), C.itemIds(e, 'P50').slice(0, 3), C.itemIds(e, 'P1433').slice(0, 1), C.itemIds(e, 'P123').slice(0, 1));
      });
      return fetchEntities(refs, false).then(function () { return good; });
    }).then(function (good) {
      if (s !== st) return;
      var list = q('.wc-results');
      good.forEach(function (e) { list.appendChild(resultCard(e)); });
      s.shown += good.length;
      var more = s.chunks && s.chunks.some(function (c) { return !c.done; });
      q('.wc-more').hidden = !more;
      var total = s.chunks ? s.chunks.reduce(function (a, c) { return a + (c.total || 0); }, 0) : s.shown;
      if (!s.shown) {
        var msg = 'No citable publications found for “' + esc(s.text) + '”.';
        if (s.filteredOut.length) {
          var f = s.filteredOut[0];
          msg += ' <a href="#" class="wc-open-anyway">' + esc(C.labelOf(f)) + ' (' + f.id + ')</a> exists but is not one of the selected publication types — open it anyway?';
        } else if (s.idq && s.idq.kind !== 'qid') msg += ' No Wikidata item has this identifier yet.';
        else msg += ' Try fewer words, the original title, or check the publication types.';
        status(msg);
        var oa = q('.wc-open-anyway');
        if (oa) oa.addEventListener('click', function (ev) { ev.preventDefault(); openCite(s.filteredOut[0].id); });
      } else {
        status(s.shown + ' result' + (s.shown === 1 ? '' : 's') + (total > s.shown ? ' of about ' + total.toLocaleString() : ''));
      }
      if (first && s.idq && s.shown === 1) openCite(good[0].id);
      if (!good.length && more && s.shown === 0) return nextPage(s).then(function (more2) { return showResults(s, more2, false); });
    });
  }

  var KIND_LABEL = { book: 'Book', chapter: 'Chapter', journal: 'Journal article', news: 'News', magazine: 'Magazine', encyclopedia: 'Encyclopedia', conference: 'Conference', thesis: 'Thesis', report: 'Report', web: 'Web', arxiv: 'Preprint', generic: 'Publication' };

  function resultCard(e) {
    var rec = C.buildRecord(e, ents);
    var authors = rec.authors.slice(0, 3).map(function (a) { return a.name; }).join(', ') + (rec.authors.length > 3 ? ' et al.' : '');
    var bits = [];
    if (rec.date) bits.push(C.formatDate(rec.date, 'year'));
    if (rec.container) bits.push(rec.container.label); else if (rec.publisher) bits.push(rec.publisher.label);
    if (rec.volume) bits.push('vol. ' + rec.volume);
    var ids = [];
    if (rec.ids.doi) ids.push('doi:' + rec.ids.doi.toLowerCase());
    if (rec.ids.isbn) ids.push('ISBN ' + rec.ids.isbn);
    if (rec.ids.pmid) ids.push('PMID ' + rec.ids.pmid);
    if (rec.hasEditions.length) ids.push(rec.hasEditions.length + ' edition' + (rec.hasEditions.length > 1 ? 's' : ''));
    var meta = [authors, bits.join(' · ')].filter(Boolean).join(' · ') || rec.description;
    var li = el('li', { class: 'wc-result', tabindex: '0', role: 'button' }, [
      el('div', { class: 'wc-result-main' }, [
        el('div', { class: 'wc-result-title', text: rec.title || rec.label || e.id }),
        el('div', { class: 'wc-result-meta', text: meta }),
        el('div', { class: 'wc-chips' }, [el('span', { class: 'wc-chip wc-kind', text: KIND_LABEL[rec.kind] || rec.kind })]
          .concat(rec.typeLabels.slice(0, 2).map(function (t) { return el('span', { class: 'wc-chip', text: t }); }))
          .concat(ids.length ? [el('span', { class: 'wc-ids', text: ids.join('  ') })] : []))
      ]),
      el('div', { class: 'wc-result-side' }, [
        el('a', { class: 'wc-qid', href: 'https://www.wikidata.org/wiki/' + e.id, target: '_blank', rel: 'noopener', text: e.id, onclick: function (ev) { ev.stopPropagation(); } }),
        el('button', { type: 'button', class: 'wc-btn wc-primary wc-sm', text: 'Cite' })
      ])
    ]);
    li.addEventListener('click', function () { openCite(e.id); });
    li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openCite(e.id); } });
    return li;
  }

  /* ------------------------------------------------------------------ *
   * Citation form
   * ------------------------------------------------------------------ */
  var cur = null;

  function showPane(which) {
    q('.wc-search-pane').hidden = which !== 'search';
    q('.wc-cite-pane').hidden = which !== 'cite';
    q('.wc-back').hidden = which !== 'cite' || !st;
    if (which === 'search') {
      q('.wc-title').textContent = 'WikiCite';
      q('.wc-sub').textContent = canInsert() ? 'Find a source on Wikidata; the citation is inserted at your cursor.' : 'Find a source on Wikidata and copy its citation.';
    }
  }

  function loadItem(qid) {
    return fetchEntities([qid], true).then(function () {
      var item = fullCache.get(qid);
      if (!item) throw new Error(qid + ' was not found on Wikidata');
      var lite = C.referencedIds(item, { props: C.REF_PROPS.filter(function (p) { return p !== 'P50'; }) }).concat(C.itemIds(item, 'P50').slice(0, 200));
      var full = [];
      var cont = C.itemIds(item, 'P1433')[0], work = C.itemIds(item, 'P629')[0];
      if (cont) full.push(cont);
      if (work) full.push(work);
      full = full.concat(C.itemIds(item, 'P747').slice(0, 50));
      return Promise.all([fetchEntities(lite, false), fetchEntities(full, true)]).then(function () {
        var more = [];
        full.forEach(function (id) {
          var e = fullCache.get(id);
          if (e) more = more.concat(C.referencedIds(e, { props: ['P31', 'P123', 'P291', 'P98', 'P407', 'P179'] }), id === work ? C.itemIds(e, 'P50').slice(0, 200) : []);
        });
        return fetchEntities(more, false);
      }).then(function () {
        var langs = [item].concat(full.map(function (id) { return fullCache.get(id); }).filter(Boolean))
          .reduce(function (a, e) { return a.concat(C.itemIds(e, 'P407')); }, []);
        return fetchLanguageCodes(langs);
      }).then(function () { return item; });
    });
  }

  function openCite(qid) {
    showPane('cite');
    q('.wc-title').textContent = 'Loading ' + qid + '…';
    q('.wc-sub').innerHTML = '';
    q('.wc-loading').hidden = false;
    q('.wc-loading').innerHTML = '<span class="wc-spinner"></span> Fetching data from Wikidata…';
    q('.wc-cite-body').hidden = true;
    loadItem(qid).then(function (item) {
      var rec = C.buildRecord(item, ents);
      var workId = C.itemIds(item, 'P629')[0];
      if (workId && fullCache.get(workId)) rec = C.mergeEditionWork(rec, C.buildRecord(fullCache.get(workId), ents));
      cur = { qid: qid, item: item, workRec: rec, rec: rec, template: C.defaultTemplate(rec), rows: [], inserted: {} };
      setupCite();
    }).catch(function (err) {
      q('.wc-loading').innerHTML = '<span class="wc-error">Could not load ' + esc(qid) + ': ' + esc(err.message) + '</span>';
    });
  }

  function setupCite() {
    var rec = cur.rec;
    q('.wc-title').textContent = rec.title || rec.label || cur.qid;
    var sub = q('.wc-sub');
    sub.innerHTML = '';
    sub.appendChild(el('a', { class: 'wc-qid', href: 'https://www.wikidata.org/wiki/' + cur.qid, target: '_blank', rel: 'noopener', text: cur.qid + ' on Wikidata ↗' }));
    rec.typeLabels.forEach(function (t) { sub.appendChild(el('span', { class: 'wc-chip', text: t })); });
    if (rec.description) sub.appendChild(el('span', { text: rec.description }));

    var sel = q('.wc-edition');
    var eds = C.itemIds(cur.item, 'P747').map(function (id) { return fullCache.get(id); }).filter(Boolean);
    sel.innerHTML = '';
    if (eds.length) {
      sel.appendChild(el('option', { value: '', text: 'The work itself (' + cur.qid + ')' }));
      eds.map(function (e) { return { e: e, r: C.buildRecord(e, ents) }; })
        .sort(function (a, b) { return (a.r.date ? a.r.date.year : 9999) - (b.r.date ? b.r.date.year : 9999); })
        .forEach(function (x) {
          var r = x.r;
          var parts = [r.date ? C.formatDate(r.date, 'year') : 'n.d.', r.publisher && r.publisher.label, r.language, r.edition && r.edition + ' ed.', r.ids.isbn && 'ISBN ' + r.ids.isbn].filter(Boolean);
          sel.appendChild(el('option', { value: x.e.id, text: parts.join(' · ') + ' — ' + x.e.id }));
        });
    }
    q('.wc-edition-row').hidden = !eds.length;

    var ts = q('.wc-template');
    ts.innerHTML = '';
    C.TEMPLATES.forEach(function (t) { ts.appendChild(el('option', { value: t, text: '{{' + t + '}}' + (t === C.defaultTemplate(rec) ? '  (suggested)' : '') })); });
    ts.value = cur.template;

    q('.wc-pages').value = '';
    q('.wc-at').value = '';
    q('.wc-quote').value = '';
    q('.wc-refname').value = '';
    q('.wc-refname').placeholder = C.defaultRefName(rec);
    q('.wc-preview').innerHTML = '<span class="wc-muted">The rendered citation appears here.</span>';
    lastPreview = '';
    regenerate(false);
    q('.wc-loading').hidden = true;
    q('.wc-cite-body').hidden = false;
    q('.wc-pages').focus();
  }

  function optsFromForm() {
    return {
      nameMode: q('.wc-o-names').value,
      maxAuthors: Math.max(1, parseInt(q('.wc-o-max').value, 10) || 8),
      authorLinks: q('.wc-o-authorlinks').checked,
      wikilinks: q('.wc-o-wikilinks').checked,
      dateFormat: q('.wc-o-date').value,
      accessDate: q('.wc-o-access').checked,
      includeLanguage: q('.wc-o-lang').checked,
      allIds: q('.wc-o-ids').checked,
      wikidataId: q('.wc-o-wdid').checked
    };
  }
  function optsToForm() {
    var o = settings.opts;
    q('.wc-o-names').value = o.nameMode;
    q('.wc-o-max').value = o.maxAuthors;
    q('.wc-o-authorlinks').checked = o.authorLinks;
    q('.wc-o-wikilinks').checked = o.wikilinks;
    q('.wc-o-date').value = o.dateFormat;
    q('.wc-o-access').checked = o.accessDate;
    q('.wc-o-lang').checked = o.includeLanguage;
    q('.wc-o-ids').checked = o.allIds;
    q('.wc-o-wdid').checked = o.wikidataId !== false;
    q('.wc-o-summary').checked = settings.summaryTag;
    q('.wc-layout').value = settings.layout;
    q('.wc-live').checked = settings.livePreview;
    var r = q('input[name=wc-placement][value="' + settings.placement + '"]') || q('input[name=wc-placement]');
    r.checked = true;
  }

  function regenerate(keep) {
    var params = C.buildParams(cur.rec, cur.template, optsFromForm());
    var old = cur.rows;
    var rows = params.map(function (p) { return { key: p[0], value: p[1], orig: p[1], edited: false, added: false, removed: false }; });
    if (keep) old.forEach(function (o) {
      var m = rows.filter(function (r) { return r.key === o.key; })[0];
      if (o.added) { if (!m) rows.push(o); else { m.value = o.value; m.edited = true; } }
      else if (m && o.edited) { m.value = o.value; m.edited = true; }
      else if (m && o.removed) m.removed = true;
    });
    cur.rows = rows;
    renderRows();
    update();
  }

  function renderRows() {
    var box = q('.wc-params');
    box.innerHTML = '';
    cur.rows.forEach(function (r) {
      if (r.removed) return;
      var pos = r.key === null;
      var k = el('input', { class: 'wc-pkey', value: pos ? '(id)' : r.key, 'aria-label': 'Parameter name', spellcheck: 'false' });
      if (pos) k.readOnly = true;
      var v = el('input', { class: 'wc-pval', value: r.value, 'aria-label': (r.key || 'id') + ' value', spellcheck: 'false' });
      var rm = el('button', { type: 'button', class: 'wc-icon wc-icon-sm', title: 'Remove', 'aria-label': 'Remove ' + (r.key || 'id'), onclick: function () { r.removed = true; renderRows(); update(); } });
      rm.innerHTML = X_ICON;
      var row = el('div', { class: 'wc-param' + (r.edited || r.added ? ' wc-edited' : '') }, [k, v, rm]);
      k.addEventListener('input', function () { r.key = k.value.trim(); r.edited = true; row.classList.add('wc-edited'); updateSoon(); });
      v.addEventListener('input', function () { r.value = v.value; r.edited = r.added || v.value !== r.orig; row.classList.toggle('wc-edited', r.edited); updateSoon(); });
      box.appendChild(row);
    });
  }

  function currentParams() {
    return cur.rows.filter(function (r) { return !r.removed && (r.key === null || r.key) && String(r.value).trim() !== ''; })
      .map(function (r) { return [r.key, String(r.value).trim()]; });
  }

  var PLACEMENT_HINT = {
    ref: 'A footnote, <code>&lt;ref&gt;{{cite …}}&lt;/ref&gt;</code>, with the page inside the citation.',
    rp: 'One full reference reused with <code>&lt;ref name=… /&gt;</code>; each page shown with <code>{{rp}}</code>.',
    sfn: '<code>{{sfn}}</code> in the text; the full citation goes once in the Bibliography / Works cited section.',
    bare: 'Just the template, e.g. for a bibliography list.'
  };

  function update() {
    if (!cur) return;
    var placement = (q('input[name=wc-placement]:checked') || {}).value || 'ref';
    q('.wc-placement-hint').innerHTML = PLACEMENT_HINT[placement];
    q('.wc-refname-field').style.visibility = placement === 'sfn' || placement === 'bare' ? 'hidden' : '';
    var range = cur.rows.filter(function (r) { return !r.removed && (r.key === 'pages' || r.key === 'page') && r.value; })[0];
    q('.wc-pages-hint').innerHTML = range && cur.template !== 'Cite Q'
      ? 'The source spans <b>' + esc(range.value) + '</b>. Enter the page you are citing; separate several with <kbd>;</kbd>.'
      : 'Separate several page references with <kbd>;</kbd>.';

    var out = C.generate(cur.rec, {
      template: cur.template, params: currentParams(),
      pages: q('.wc-pages').value, at: q('.wc-at').value, quote: q('.wc-quote').value,
      placement: placement, refName: q('.wc-refname').value, layout: q('.wc-layout').value
    });
    cur.out = out;

    var w = q('.wc-warnings');
    w.innerHTML = '';
    var keys = currentParams().map(function (p) { return p[0]; });
    var missing = [];
    if (cur.template !== 'Cite Q') {
      if (keys.indexOf('title') < 0) missing.push('title');
      if (cur.template === 'cite web' && keys.indexOf('url') < 0) missing.push('url');
      if (cur.template === 'cite journal' && keys.indexOf('journal') < 0) missing.push('journal');
      if (cur.template === 'cite arXiv' && keys.indexOf('eprint') < 0) missing.push('eprint');
      if (!keys.some(function (k) { return k === 'date' || k === 'year'; })) missing.push('date');
    }
    var warn = function (t) { w.appendChild(el('div', { class: 'wc-warning', text: t })); };
    if (missing.length) warn('Missing on Wikidata: ' + missing.join(', ') + '. Add it in the fields — and ideally to the Wikidata item.');
    if ((placement === 'ref' || placement === 'rp') && existingRefNames()[out.refName]) {
      warn('This page already has a reference named “' + out.refName + '”. If it is the same source, reuse it with <ref name="' + out.refName + '" />; otherwise change the ref name.');
    }
    out.warnings.forEach(warn);

    var ins = canInsert();
    q('.wc-insert-note').textContent = ins ? (placement === 'sfn' ? 'Insert the {{sfn}} at the cursor; put the full citation in the bibliography.' : 'Insert puts the snippet at the cursor.') : 'Open the source editor to insert directly.';
    var box = q('.wc-snippets');
    box.innerHTML = '';
    out.snippets.forEach(function (s, i) {
      var copyBtn = el('button', { type: 'button', class: 'wc-btn wc-quiet wc-sm', text: 'Copy' });
      copyBtn.addEventListener('click', function () { copyText(s.text, copyBtn); });
      var actions = [copyBtn];
      if (ins) {
        var done = cur.inserted[s.text];
        var insBtn = el('button', { type: 'button', class: 'wc-btn wc-sm ' + (done ? 'wc-done' : 'wc-primary'), text: done ? 'Inserted ✓' : 'Insert' });
        insBtn.addEventListener('click', function () {
          if (!insertText(s.text)) return;
          cur.inserted[s.text] = true;
          var remaining = out.snippets.filter(function (x) { return !cur.inserted[x.text]; });
          // single snippet, or everything inserted → done
          if (!remaining.length || (out.snippets.length === 1)) { mw.notify('Citation inserted.', { tag: 'wikicite', type: 'success' }); close(); }
          else update();
        });
        actions.push(insBtn);
      }
      box.appendChild(el('div', { class: 'wc-snippet' }, [
        el('div', { class: 'wc-snippet-head' }, [el('span', { text: s.label }), el('span', null, actions)]),
        el('pre', { text: s.text })
      ]));
    });
    if (q('.wc-live').checked) previewSoon();
  }
  var updateSoon = debounce(update, 150);

  var lastPreview = '', seq = 0;
  function preview(force) {
    if (!cur || !cur.out) return;
    var text = cur.out.citation;
    if (!text || (!force && text === lastPreview)) return;
    lastPreview = text;
    var my = ++seq;
    var box = q('.wc-preview');
    box.style.opacity = '.55';
    local.post({
      action: 'parse', formatversion: 2, contentmodel: 'wikitext', prop: 'text', disablelimitreport: 1,
      disableeditsection: 1, title: mw.config.get('wgPageName') || 'WikiCite', text: text, pst: 1
    }).then(function (j) {
      if (my !== seq) return;
      box.style.opacity = '';
      // same-origin parser output from this wiki
      box.innerHTML = (j.parse && j.parse.text) || '';
      $(box).find('a').attr('target', '_blank');
    }, function (code) {
      if (my !== seq) return;
      box.style.opacity = '';
      box.innerHTML = '<span class="wc-muted">Preview unavailable (' + esc(code) + ').</span>';
    });
  }
  var previewSoon = debounce(preview, 700);

  /* ------------------------------------------------------------------ *
   * Events
   * ------------------------------------------------------------------ */
  var KNOWN = ['last', 'first', 'author', 'author-link', 'title', 'trans-title', 'chapter', 'url', 'chapter-url', 'work', 'journal', 'newspaper',
    'magazine', 'website', 'encyclopedia', 'publisher', 'location', 'date', 'year', 'orig-date', 'edition', 'series', 'volume', 'issue', 'page',
    'pages', 'at', 'language', 'doi', 'isbn', 'issn', 'oclc', 'pmid', 'pmc', 'jstor', 'arxiv', 'lccn', 'ol', 'zbl', 'mr', 'hdl', 'bibcode',
    's2cid', 'id', 'access-date', 'archive-url', 'archive-date', 'url-status', 'url-access', 'via', 'editor-last', 'editor-first', 'others',
    'quote', 'trans-quote', 'df', 'mode', 'ref', 'display-authors', 'type', 'degree', 'format', 'agency', 'book-title', 'conference'];

  function bind() {
    q('.wc-close').addEventListener('click', close);
    q('.wc-back').addEventListener('click', function () { showPane('search'); q('.wc-q').focus(); });
    root.addEventListener('click', function (ev) { if (ev.target === root) close(); });
    root.addEventListener('cancel', function (ev) { ev.preventDefault(); close(); });

    q('.wc-search').addEventListener('submit', function (ev) { ev.preventDefault(); startSearch(q('.wc-q').value); });
    q('.wc-more').addEventListener('click', function () {
      var s = st, b = q('.wc-more');
      b.disabled = true;
      nextPage(s).then(function (ids) { return showResults(s, ids, false); }).then(function () { b.disabled = false; }, function () { b.disabled = false; });
    });
    q('.wc-toggle-types').addEventListener('click', function () {
      var t = q('.wc-types');
      t.hidden = !t.hidden;
      this.setAttribute('aria-expanded', String(!t.hidden));
    });
    qa('[data-sel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = b.getAttribute('data-sel');
        if (m === 'all') settings.types = allTypes().map(function (t) { return t.qid; });
        if (m === 'none') settings.types = [];
        if (m === 'reset') { settings.types = defaults.types.slice(); settings.customTypes = []; }
        save(); renderTypeFilters();
      });
    });
    q('.wc-custom-type').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var x = q('.wc-custom-q').value.trim().toUpperCase();
      if (!/^Q\d+$/.test(x)) { mw.notify('Enter a Q-number, e.g. Q1555508', { tag: 'wikicite' }); return; }
      if (allTypes().some(function (t) { return t.qid === x; })) return;
      fetchEntities([x], false).then(function () {
        var e = getEntity(x);
        if (!e) { mw.notify(x + ' not found', { tag: 'wikicite', type: 'error' }); return; }
        settings.customTypes.push({ qid: x, label: C.labelOf(e) });
        settings.types.push(x);
        save(); renderTypeFilters();
        q('.wc-custom-q').value = '';
      });
    });

    q('.wc-template').addEventListener('change', function () { cur.template = this.value; regenerate(true); });
    q('.wc-edition').addEventListener('change', function () {
      var id = this.value;
      cur.rec = id ? C.mergeEditionWork(C.buildRecord(fullCache.get(id), ents), cur.workRec) : cur.workRec;
      if (C.defaultTemplate(cur.rec) !== 'Citation') cur.template = C.defaultTemplate(cur.rec);
      q('.wc-template').value = cur.template;
      q('.wc-refname').placeholder = C.defaultRefName(cur.rec);
      regenerate(false);
    });
    q('.wc-refill').addEventListener('click', function () { regenerate(false); });
    q('.wc-add-param').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var k = q('.wc-add-key').value.trim(), v = q('.wc-add-val').value;
      if (!k) return;
      var ex = cur.rows.filter(function (r) { return r.key === k && !r.removed; })[0];
      if (ex) { ex.value = v; ex.edited = true; } else cur.rows.push({ key: k, value: v, orig: '', edited: true, added: true, removed: false });
      q('.wc-add-key').value = ''; q('.wc-add-val').value = '';
      renderRows(); update(); q('.wc-add-key').focus();
    });
    var dl = root.querySelector('#wikicite-params');
    KNOWN.forEach(function (p) { dl.appendChild(el('option', { value: p })); });

    ['.wc-pages', '.wc-at', '.wc-quote', '.wc-refname'].forEach(function (s) { q(s).addEventListener('input', updateSoon); });
    q('.wc-layout').addEventListener('change', function () { settings.layout = this.value; save(); update(); });
    qa('input[name=wc-placement]').forEach(function (r) { r.addEventListener('change', function () { settings.placement = r.value; save(); update(); }); });
    ['.wc-o-names', '.wc-o-max', '.wc-o-authorlinks', '.wc-o-wikilinks', '.wc-o-date', '.wc-o-access', '.wc-o-lang', '.wc-o-ids', '.wc-o-wdid'].forEach(function (s) {
      q(s).addEventListener('change', function () { settings.opts = optsFromForm(); save(); if (cur) regenerate(true); });
    });
    q('.wc-o-summary').addEventListener('change', function () { settings.summaryTag = this.checked; save(); });
    q('.wc-live').addEventListener('change', function () { settings.livePreview = this.checked; save(); if (this.checked) preview(true); });
    q('.wc-refresh').addEventListener('click', function () { preview(true); });
  }

  /* ------------------------------------------------------------------ *
   * Open / close and entry points
   * ------------------------------------------------------------------ */
  function open(prefill) {
    if (!root) build();
    if (!root.open) root.showModal();
    var text = prefill != null ? prefill : selectedText();
    if (text && text.length < 300 && text.indexOf('\n') < 0) {
      q('.wc-q').value = text.replace(/^[\s"'“”‘’]+|[\s"'“”‘’.,;:]+$/g, '');
      startSearch(q('.wc-q').value);
    } else showPane(cur && !q('.wc-cite-body').hidden && q('.wc-search-pane').hidden ? 'cite' : 'search');
    if (!q('.wc-search-pane').hidden) q('.wc-q').focus();
  }
  function close() {
    if (root && root.open) root.close();
    var $t = textbox();
    if ($t) $t.trigger('focus');
  }

  var ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><text x="10" y="14.5" font-family="Georgia,serif" font-size="11" text-anchor="middle" fill="#202122">{{}}</text></svg>');

  function addWikiEditorButton($textarea) {
    $textarea.wikiEditor('addToToolbar', {
      section: 'main',
      group: 'insert',
      tools: {
        wikicite: {
          label: 'Cite from Wikidata (WikiCite)',
          type: 'button',
          icon: ICON,
          action: { type: 'callback', execute: function () { open(); } }
        }
      }
    });
  }

  // 1. Tools menu link — works on every page (copy mode outside the editor)
  var link = mw.util.addPortletLink('p-tb', '#', 'WikiCite', 't-wikicite', 'Build a citation from Wikidata (WikiCite)');
  if (link) $(link).on('click', function (ev) { ev.preventDefault(); open(); });

  // 2. Toolbar button in the 2010 WikiEditor
  mw.hook('wikiEditor.toolbarReady').add(function ($textarea) {
    if ($textarea.attr('id') === 'wpTextbox1') addWikiEditorButton($textarea);
  });

  // Public API for other scripts / the console
  window.WikiCite = { version: VERSION, open: open, engine: C };
  mw.hook('wikicite.ready').fire(window.WikiCite);
})(CiteEngine);
});
// </nowiki>
