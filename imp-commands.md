# Stop current one
pkill -f mock-api

# Start mock API manually (won't auto-generate)
cd /workspaces/anthropic-hackathon-proj/go-mock-api
./mock-api &

pkill -9 -f "uvicorn main:app"; sleep 3; cd /workspaces/anthropic-hackathon-proj/python-backend && source venv/bin/activate && nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/python-backend-restart.log 2>&1 & echo "Restarted PID: $!"

cd /workspaces/anthropic-hackathon-proj/python-backend && ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/python-backend-fresh.log 2>&1 &