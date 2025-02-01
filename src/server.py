from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import json
import os

class Addition(BaseModel):
    name: str
    amount: int

app_root = os.path.join(os.path.dirname(os.path.dirname(__file__)))
app = FastAPI()
app.mount("/home", StaticFiles(directory=os.path.join(app_root, 'web'), html=True), name="index")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO when running on always on server, will want to configure router to give static ip to server mac address

@app.get("/data")
async def root():
    data_path = os.path.join(os.path.dirname(__file__), "data.json")
    with open(data_path, 'r') as j_ptr:
        data = json.load(j_ptr)

    return data

@app.post("/add")
async def root(addition: Addition):
    data_path = os.path.join(os.path.dirname(__file__), "data.json")
    with open(data_path, 'r') as j_ptr:
        data = json.load(j_ptr)

    if addition.name not in data:
        raise HTTPException(status_code=404, detail=f"User {addition.name} not found")
    else:
        data[addition.name] += addition.amount
    
    with open(data_path, 'w') as j_ptr:
        json.dump(data, j_ptr)
        j_ptr.flush()
    
