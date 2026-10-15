# LabelLens — AI-powered alcohol label verification

A standalone take-home prototype that extracts text from alcohol-label images using Tesseract's neural OCR model and compares it against application details. No API key, external AI endpoint, database or COLA integration is required. Built with AI coding assistance; review and understand the implementation before submitting it as an assessment.

## Run locally

Requires Python 3 for the local server. Node 18+ is needed only for tests. All browser runtime dependencies and English model data are vendored in `dist/vendor`; there is no install or build step.

```sh
python3 -m http.server 8080 --directory dist
# open http://localhost:8080
```

Do not open `index.html` through `file://`: Web Workers and model fetching require an HTTP origin. Use a modern browser with WebAssembly and Web Workers enabled. Deployment: serve `dist/` from any static host, retaining the folder structure. This source includes a Sites hosting manifest; remove `.openai/` if deploying elsewhere.

## Use

1. Click **Try a sample**, then **Read & compare label** to run actual OCR. No fabricated OCR results are used.
2. Upload PNG, JPEG or WebP images (15 MB/file, 60 megapixel image limit, 300 images/batch).
3. Enter each image's application data. Required fields: brand, class/type, net contents, producer and address; imported products also require origin. An omitted ABV always becomes a manual review item because rules vary by beverage.
4. For batch work, import application JSON with exact, unique image filenames. Download the example from the app or use `dist/samples/applications.json`. Sample PNGs are included in `dist/samples/`. Records can be imported before or after images. Process batch runs sequentially, reusing one OCR worker to control memory use. Cancel preserves completed results.
5. Review every finding against the original image. Rotate images as needed. Correct OCR text if necessary; the report retains original text, edited text, correction status, timing, confidence, visual review checkbox and reviewer notes.
6. Export batch JSON or print the selected review. Clearing the workspace discards all in-memory records. Refreshing or closing the page also discards work; export first.

## Architecture and decisions

- **Frontend:** buildless HTML, responsive CSS and native JavaScript modules. Large, clearly labeled controls, keyboard focus, live status updates, text status badges, print layout and narrow-screen layouts support reviewers with varied technical experience.
- **AI image reading:** self-hosted Tesseract.js 6.0.1, tesseract.js-core 6.x WebAssembly and English `4.0.0_best_int` traineddata from `@tesseract.js-data/eng` 1.0.0. The neural OCR model extracts text; deterministic rules perform comparison. No LLM is represented as being present.
- **Network:** all application and OCR assets load from the same origin. No CDN, telemetry, external model calls or label upload. The model warms during idle time and is reused. Browser caching may retain app/model assets, but application code does not persist label images, OCR text or application records.
- **Comparison:** case, whitespace and curly apostrophes are normalized for names. Matching uses word boundaries; ABV is parsed only from percentage expressions, and volumes are converted to mL. Brand/type/producer/address are searched as contiguous normalized word sequences. Not-found means review, not proof of noncompliance. Origin is compared when supplied or marked imported.
- **Warning:** exact wording and punctuation after whitespace/case normalization, with a separate all-caps heading check. OCR cannot verify bold versus regular type, real-world millimeter font size, contrast, paragraph placement or physical label attachment; the app keeps these as explicit visual checks. The standard warning text follows 27 CFR 16.21, including the comma after “machinery”.
- **No sensitive storage:** uploads are decoded locally, object URLs revoked on clear, and no images embedded in exported reports. Reports contain entered application details and OCR text; manage them accordingly.
- **Untrusted input:** rendered values are escaped or assigned via textContent. Images, JSON size, record types, duplicate filenames, required data and numeric inputs are validated. No user content is executed.

## Scope and limitations

- This is a comparison aid, not an automated approval or rejection system or a complete alcohol-label regulatory validator. Beverage-specific exceptions and other obligations remain with the reviewer. The visual checkbox is an acknowledgment, not a pass decision.
- English OCR only. Flat, sharp artwork is preferred. Stylized lettering, curved bottles, glare, poor lighting, small text and unusual layouts can cause omissions. Rotation and size reduction are available; perspective correction, deglare, region cropping and multilingual OCR are not implemented.
- OCR confidence is an engine estimate, not a calibrated probability. Below 80 adds a review item. High confidence does not establish correctness.
- Matching is deliberately conservative. It does not automatically accept abbreviations, reordered addresses, implied locations, alternate producer-role phrases, or fuzzy brand names. A name found elsewhere in the image can match the application; mandatory-field positioning/role must be reviewed visually.
- The approximate 5-second target is not guaranteed, especially on cold model downloads, large images or phones. The app displays actual elapsed time (initialization if needed, preprocessing, recognition, comparison). No artificial delay or fake speed claim is used. A batch is sequential, not 300 labels in five seconds.
- Image reading runs locally but downloading the app/model still requires access to the hosting origin. It is not an installed offline application.
- Batch upload maps one image to one application. Front and back images for one application must be combined into one clear image externally. PDFs, CSV, ZIP intake, authentication for a production review workflow, queues shared between agents and persistent case storage are not implemented.
- Browser end-to-end interaction and mobile timing were not verified in the build environment because the supported browser QA capability was unavailable. Node syntax, comparison rules and real OCR sample extraction were verified.

## Validation

```sh
npm test
node --check dist/app.js
```

Twelve automated comparison tests cover expected matching, capitalization, apostrophes, incorrect ABV, avoiding proof-number confusion, word boundaries, unit conversion, exact warning punctuation, missing warnings, poor OCR, origin and invalid input. `OCR_VALIDATION.json` contains measured real OCR results for the three generated PNGs: matching text, incorrect ABV, and title-case warning heading. These are local Node measurements, not a browser performance guarantee.

`scripts/make-samples.py` reproduces the fictional test images (requires Pillow). `scripts/check-ocr.cjs` reproduces OCR validation after running `npm install --no-save tesseract.js@6.0.1 @tesseract.js-data/eng@1.0.0` in this checkout, then `node scripts/check-ocr.cjs`. Sample artwork is generated programmatically for precise, readable typography.

## Submission links

- Source repository: https://github.com/taylormarienye/Treasury-take-home
- Public deployed prototype: https://labellens-verification.prettygiant256.chatgpt.site

The repository includes the application, self-hosted OCR dependencies, sample labels, tests, and setup documentation. The deployed application is public; no API key is needed to try it. A packaged source copy is available at `dist/downloads/labellens-source.zip`.

## References and licenses

- Assignment: https://github.com/treasurytakehome-rgb/instructions
- TTB warning guidance: https://www.ttb.gov/regulated-commodities/beverage-alcohol/distilled-spirits/ds-labeling-home/ds-health-warning
- Warning regulation: https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-16
- Tesseract.js: https://github.com/naptha/tesseract.js (Apache-2.0)
- Tesseract core: https://github.com/naptha/tesseract.js-core (Apache-2.0; included license)
- English model: https://github.com/naptha/tessdata (model distribution package declares MIT; underlying Tesseract traineddata is Apache-2.0)

LabelLens is an independent prototype and has no agency affiliation.
