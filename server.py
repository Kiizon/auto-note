from fastapi import FastAPI
from pydantic import BaseModel
import openai

app = FastAPI()

class Req(BaseModel):
    transcript: str
    prompt: str

@app.post("/summarize")
def summarize(req: Req):
    