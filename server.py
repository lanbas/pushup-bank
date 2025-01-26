from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

class Addition(BaseModel):
    name: str
    amount: int

app = FastAPI()
app.mount("/home", StaticFiles(directory=".", html=True), name="index")

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
    with open("data.json", 'r') as j_ptr:
        data = json.load(j_ptr)

    return data

@app.post("/add")
async def root(addition: Addition):
    with open("data.json", 'r') as j_ptr:
        data = json.load(j_ptr)

    if addition.name not in data:
        raise HTTPException(status_code=404, detail=f"User {addition.name} not found")
    else:
        data[addition.name] += addition.amount
    
    with open("data.json", 'w') as j_ptr:
        json.dump(data, j_ptr)
        j_ptr.flush()
    
