from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64

app = FastAPI(title="Seed Counter API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

separator = SeedSeparator(min_seed_area=500)

@app.post("/api/v1/analyze")
async def analyze_image(file: UploadFile = File(...), background_color: str = "blue"):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    separator.preprocessor.background_color = background_color
    seeds, labels = separator.process(image)
    
    # 시각화
    vis = visualize(image, seeds)
    _, buffer = cv2.imencode('.png', vis)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "total_count": len(seeds),
        "seeds": [{k: v for k, v in s.items() if k != "contour"} for s in seeds],
        "visualization": f"data:image/png;base64,{img_base64}"
    }

def visualize(image, seeds):
    vis = image.copy()
    np.random.seed(42)
    colors = [tuple(map(int, c)) for c in np.random.randint(50, 255, (len(seeds) + 1, 3))]
    
    overlay = image.copy()
    for seed in seeds:
        cv2.drawContours(overlay, [seed["contour"]], -1, colors[seed["id"] % len(colors)], -1)
    cv2.addWeighted(overlay, 0.35, vis, 0.65, 0, vis)
    
    for seed in seeds:
        cv2.drawContours(vis, [seed["contour"]], -1, (0, 255, 0), 2)
        cx, cy = seed["centroid"]
        cv2.putText(vis, str(seed["id"]), (cx-5, cy+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
        cv2.putText(vis, str(seed["id"]), (cx-5, cy+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 1)
    
    cv2.putText(vis, f"Count: {len(seeds)}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
    return vis
