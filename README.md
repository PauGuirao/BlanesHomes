# 🏠 BlanesHomes

**BlanesHomes** is a smart real estate web app that helps users discover, evaluate, and compare properties in the coastal town of Blanes, Spain. With AI-assisted pricing, zone analytics, and interactive filters, it's designed for both buyers and real estate agents.

---

## 🚀 Features

### 🔎 Property Search
- Interactive map with Leaflet.js
- Advanced filters by price, size, extras, and zone
- Toggle view: map/list

### 📊 Smart Property Evaluation
- AI-predicted property prices
- Real-time scoring: "Ganga", "Justo", "Caro"
- Comparison between real price vs estimated price

### 📍 Zone Insights
- Price/m² by zone
- Average size and sale time
- Price trend over time (6 months)
- Property type distribution
- Activity chart: new listings per month

### 🧠 AI Features
- Auto-generated descriptions (mt5-small finetuned) - TODO
- Smart recommendations based on preferences
- Gangas detection and score

### 🔁 Compare Properties
- Select 2 or more listings to compare
- View side-by-side pricing, size, extras, and valuation

---

## 🧱 Stack

- **Frontend:** React + Vite + Leaflet + Recharts
- **Backend:** FastAPI + Pandas + Scikit-learn + XGBoost
- **ML Models:**
  - Price/m² predictor (XGBoost)
  - Final price predictor (XGBoost)
  - Description generator (mt5-small finetuned)
- **Hosting:**
  - Frontend: Vercel (planned)
  - Backend: Render.com or custom VPS

---

## 📂 Project Structure

```
BlanesHomes/
├── frontend/        # React app (map, filters, UI)
├── backend/         # FastAPI app + ML models
├── notebook/        # File used to train and evaluate the models
├── models/          # Trained ML models
└── data/            # Processed Idealista dataset
```
---

## 📂 Dataset

This project uses a cleaned and enriched real estate dataset:

- **📄 File:** `data/idealista_procesado.csv`  
- **📍 Focus area:** Blanes (Girona, Spain)  
- **🔢 Rows:** ~500 properties  
- **🧩 Fields include:**  
  - `precio`, `metros`, `zona`, `tipo`, `habitaciones`, `baños`  
  - Calculated fields: `precio_m2`, `valoracion_score`, `categoria_valor`, `antiguedad_dias`  
  - Extras: `terraza`, `garaje`, `ascensor`, etc.  

### 🔍 Sample preview:

| id  | zona     | tipo  | precio | metros | precio_m2 | habitaciones | baños | terraza | garaje | categoria_valor |
|-----|----------|--------|--------|--------|-----------|--------------|-------|---------|--------|------------------|
| 1   | Centre   | piso   | 240000 | 80     | 3000.0    | 3            | 2     | 1       | 0      | justo            |
| 2   | Els Pins | ático  | 215000 | 70     | 3071.4    | 2            | 1     | 1       | 1      | ganga            |
| 3   | Centre   | piso   | 270000 | 95     | 2842.1    | 4            | 2     | 1       | 1      | caro             |

---

## ⚙️ Setup (Local)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload #Start the backend server
```

### Frontend
```bash
cd frontend
npm install
npm run dev  #Start the frontend
```

---

## 📈 TODO (Next steps)
- [x] Add trend graph to zone view
- [x] Add monthly activity graph per zone
- [ ] Implement comparison table view
- [ ] Export comparison as PDF
- [ ] Add shareable zone pages
- [ ] Full deploy to Vercel + Render

---