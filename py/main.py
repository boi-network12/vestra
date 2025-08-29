# this py is just only for ai
from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import pipeline

app = FastAPI()


# Load AI model (example: text generation)

generator = pipeline("text-generation", model="gpt2")

class RequestData(BaseModel):
    prompt: str

@app.post("/generate")
def generate_text(data: RequestData):
    result = generator(data.prompt, max_length=50, num_return_sequences=1)
    return {"generated_text": result[0]["generated_text"]}