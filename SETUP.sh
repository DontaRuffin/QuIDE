# QuIDE — Week 1 Setup Commands
# Run these in order.

# 1. Create Next.js project
npx create-next-app@latest quide \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*"

cd quide

# 2. Install frontend dependencies
npm install \
  zustand \
  quantum-circuit \
  @monaco-editor/react \
  recharts \
  @supabase/supabase-js \
  @supabase/ssr

# 3. Install dev dependencies
npm install -D \
  @types/node

# 4. Set up Python service
mkdir python && cd python
python3 -m venv venv
source venv/bin/activate

pip install \
  fastapi==0.115.0 \
  uvicorn==0.32.0 \
  qiskit==1.3.0 \
  qiskit-aer==0.15.0 \
  python-dotenv==1.0.0 \
  pydantic==2.9.0

pip freeze > requirements.txt
cd ..

# 5. Create folder structure
mkdir -p \
  src/components/ide \
  src/components/templates \
  src/components/ui \
  src/lib/quantum \
  src/lib/supabase \
  src/lib/api \
  src/hooks \
  src/stores \
  src/types \
  python/routes \
  python/services \
  supabase/migrations \
  public/gates

# 6. Test Python service
cd python
uvicorn main:app --reload --port 8000
# Visit http://localhost:8000/health

# 7. Deploy to Vercel
npx vercel --prod

# 8. Deploy Python to Railway
# Set PORT=8000 and SERVICE_API_KEY in Railway env vars
