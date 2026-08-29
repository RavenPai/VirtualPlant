from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.plant import router as plant_router

app = FastAPI(title="Virtual Plant Python API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plant_router)


@app.get("/health")
def health():
    from app.services.dataset_ml import dataset_status

    return {"ok": True, "service": "virtual-plant-python", "datasets": dataset_status()}
