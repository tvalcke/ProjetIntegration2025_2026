# Base image
FROM python:3.11-slim

# Set working directory
WORKDIR /code

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY ./app /code/app

# Copy secrets ONLY if directory exists
# (Works locally, silently ignored on Render)
RUN mkdir -p /etc/secrets && \
    if [ -d "./etc/secrets" ]; then \
        cp -r ./etc/secrets/* /etc/secrets/; \
    else \
        echo "No local secrets found, skipping"; \
    fi

# Run FastAPI with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
