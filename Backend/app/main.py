from fastapi import FastAPI

app = FastAPI(title="FastAPI Docker Template")

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI running in Docker!"}
