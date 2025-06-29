# Multi-stage build using Debian base for better C++ support
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
  gcc \
  g++ \
  libpq-dev \
  python3-dev \
  libffi-dev \
  build-essential \
  libclang-dev \
  cmake \
  ninja-build \
  pkg-config \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production image
FROM python:3.11-slim AS production

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
  libpq5 \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 cvanalyzer && \
  useradd -u 1001 -g cvanalyzer -s /bin/bash -m cvanalyzer

# Set working directory
WORKDIR /app

# Copy Python packages from builder stage
COPY --from=builder /root/.local /home/cvanalyzer/.local

# Copy application code
COPY --chown=cvanalyzer:cvanalyzer . .

# Make sure user can access local packages
ENV PATH=/home/cvanalyzer/.local/bin:$PATH
ENV PYTHONPATH=/home/cvanalyzer/.local/lib/python3.11/site-packages:$PYTHONPATH

# Switch to non-root user
USER cvanalyzer

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import sys; sys.exit(0)" || exit 1

# Run the worker
CMD ["python", "worker.py"] 
