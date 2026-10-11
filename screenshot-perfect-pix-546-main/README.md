# Loan Approval Prediction System Using Machine Learning — Frontend

Dashboard frontend for a B.Tech CSE mini-project. It talks to a separate Flask backend (`POST /predict`). No ML model runs in the browser and no prediction is ever faked.

Built with React + TypeScript, TanStack Router/Start (file-based routes in `src/routes`), Vite, Tailwind CSS, Lucide icons and Recharts.

## Setup

1. Install **Node.js 20+** from https://nodejs.org.
2. Open this folder in **VS Code** (File → Open Folder).
3. In the terminal: `npm install`
4. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` (default `http://localhost:5000`).
5. `npm run dev`, then open the URL printed in the terminal (e.g. http://localhost:8080).

Production: `npm run build` then `npm run preview`.

## Pages

| Route          | Page                                                        |
| -------------- | ----------------------------------------------------------- |
| `/`            | Dashboard (demo summary, charts, recent demo records)       |
| `/predict`     | Predict Loan form                                           |
| `/performance` | Model metrics, accuracy chart, confusion matrix placeholder |
| `/history`     | Demo prediction history (search, filter, pagination)        |
| `/about`       | About the project                                           |

## Connecting the Flask backend

Request: `POST {VITE_API_BASE_URL}/predict`, `Content-Type: application/json`, exactly these keys (numbers as numbers):

```json
{
  "no_of_dependents": 2,
  "education": "Graduate",
  "self_employed": "No",
  "income_annum": 500000,
  "loan_amount": 1500000,
  "loan_term": 12,
  "cibil_score": 750,
  "residential_assets_value": 1000000,
  "commercial_assets_value": 200000,
  "luxury_assets_value": 300000,
  "bank_asset_value": 250000
}
```

Response:

```json
{
  "prediction": "Approved",
  "approval_probability": 0.92,
  "message": "Prediction generated successfully"
}
```

- `prediction` must be `Approved` or `Rejected` (case-insensitive).
- `approval_probability` (optional) must be a number between **0 and 1**; otherwise it is hidden.
- `message` is optional.
- **Loan term unit is years** (`LOAN_TERM_UNIT` in `src/utils/validation.ts`). It must match the unit used in the training dataset.
- The backend must **enable CORS** for the frontend dev origin, e.g. `pip install flask-cors` then `CORS(app)`.
- Requests time out after 15 seconds.

### Why "Backend not connected" appears

Until the Flask API is running at `VITE_API_BASE_URL`, the Predict page shows a disconnected message. This is intentional: there is no fallback or simulated result.

## Data integrity

- Model metrics in `src/data/metrics.ts` are the real test-run values.
- Everything in `src/data/demoData.ts` is sample data and is labelled "Demo data" in the UI.
- The confusion matrix shows "Not available" until real counts are passed to `<ConfusionMatrix tp tn fp fn />`.
- Real predictions are not saved anywhere.

## Troubleshooting

- **API URL not configured:** create `.env` and restart `npm run dev`.
- **Could not reach the service:** Flask isn't running, the port is wrong, or CORS isn't enabled.
- **Status 4xx/5xx:** check the Flask terminal for errors and the payload keys.
- **Invalid response:** make sure Flask returns JSON with a `prediction` field.

Run tests with `npx vitest run`.
