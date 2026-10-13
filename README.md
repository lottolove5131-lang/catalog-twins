# Catalog Twins

Compare similar English product descriptions before merging or removing a listing. MiniLM embeddings run in the browser through Transformers.js. The app shows both descriptions, shared terms, a word-overlap baseline and cosine similarity. It never deletes inventory or decides that two physical objects are identical.

Built from a new Muse-generated prototype on October 13, 2026, then reviewed and corrected with Codex assistance for the DEV Hacktoberfest Week 2: Side Hustle challenge. No Frost Window or Crowd Pleaser source was reused. No customer, sale or revenue is claimed.

## Run

Serve this folder with a static HTTP server, for example `python -m http.server 8795 --bind 127.0.0.1`, and open `http://127.0.0.1:8795`. The deployed demo needs no installation. Do not assume opening the file directly will work: ES module imports require a suitable browser origin.

Use the eight fictional sample listings or paste two to 100 short English rows in `id|title|description` format. IDs must be unique. The first run downloads library, runtime and model assets from jsDelivr and Hugging Face. The app itself sends no listing text to a server and performs inference in the browser; those external sites receive normal download requests and connection metadata. It does not promise a completely offline first run or that browser caches are permanent.

The model is `Xenova/all-MiniLM-L6-v2`, explicitly q8, mean pooled and normalized. The library is pinned to `@huggingface/transformers@3.8.1`. Model revision: 751bff37182d3f1213fa05d7196b954e230abad9. Short descriptions matter: the model has a finite token window and may truncate long inputs. The 60/200/700 character limits and 100-listing batch limit reduce accidental truncation and memory stalls; they are not a guarantee of perfect retrieval.

Cosine thresholds are review controls, not calibrated duplicate probabilities. Text variants in size, color, quantity or condition can score highly; read both descriptions before acting. Exact normalized text and semantic similarity are shown separately. No heuristic is presented as AI if model loading fails.

## Checks

`node --test test.mjs` verifies strict input handling, resource limits, cosine normalization, invalid model responses, escaping and distinct Unicode titles. Live model and deployed-browser checks are recorded separately; unit tests do not prove model quality on real inventory.

## Third-party components

- Transformers.js, Apache-2.0: https://github.com/huggingface/transformers.js
- MiniLM ONNX model, Apache-2.0: https://huggingface.co/Xenova/all-MiniLM-L6-v2
- Model authorship and training details: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2

The app source is MIT. Third-party code and weights retain their own licenses. Model names and APIs are attributed; this project does not claim authorship of those components.

## Submission

Challenge: https://dev.to/challenges/hacktoberfest-week2-2026-10-12 . Build window October12–18, 2026; deadline October18 23:59 PDT / October19 15:59 KST. Overall award USD250. One submission can win one prize. This app uses MiniLM, not Gemma, and claims no Gemma partner category.
