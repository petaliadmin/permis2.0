import os
import cv2
import numpy as np
from pathlib import Path

SLIDES_DIR = Path("doc/export/slides")
OUTPUT_DIR = Path("doc/export/panneaux")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def detect_and_crop_signs(image_path, output_prefix):
    img = cv2.imread(str(image_path))
    if img is None:
        return []
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = np.ones((3,3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)
    eroded = cv2.erode(dilated, kernel, iterations=1)
    
    contours, _ = cv2.findContours(eroded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    signs = []
    min_area = 5000
    max_area = img.shape[0] * img.shape[1] * 0.4
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area or area > max_area:
            continue
        
        x, y, w, h = cv2.boundingRect(cnt)
        
        sign_img = img[y:y+h, x:x+w]
        
        pad = 10
        y1 = max(0, y - pad)
        y2 = min(img.shape[0], y + h + pad)
        x1 = max(0, x - pad)
        x2 = min(img.shape[1], x + w + pad)
        sign_crop = img[y1:y2, x1:x2]
        
        h_ratio = sign_crop.shape[0] / sign_crop.shape[1]
        if h_ratio < 0.3 or h_ratio > 3.0:
            continue
        
        signs.append(sign_crop)
    
    signs.sort(key=lambda s: -s.shape[0] * s.shape[1])
    
    saved = []
    for i, sign in enumerate(signs[:5]):
        out_path = OUTPUT_DIR / f"{output_prefix}_sign{i+1}.png"
        cv2.imwrite(str(out_path), sign)
        saved.append(str(out_path))
    
    return saved

pdf_files = sorted([f for f in SLIDES_DIR.parent.parent.iterdir() if f.name.endswith('.pdf')])
total_signs = 0

for pdf_file in pdf_files:
    pdf_name = pdf_file.stem
    slide_files = sorted(SLIDES_DIR.glob(f"{pdf_name}_p*.png"))
    
    for slide_file in slide_files:
        saved = detect_and_crop_signs(slide_file, f"{pdf_name}_{slide_file.stem}")
        if saved:
            print(f"Extracted {len(saved)} signs from {slide_file.name}")
            total_signs += len(saved)

print(f"\nTotal signs extracted: {total_signs}")
