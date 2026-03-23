from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import base64, io, numpy as np

app = Flask(__name__)
CORS(app, origins='*')

def fix_base64(data):
    if not data:
        raise Exception('Empty image data')
    if ',' in data:
        data = data.split(',')[1]
    data = ''.join(data.split())
    remainder = len(data) % 4
    if remainder:
        data += '=' * (4 - remainder)
    return data

def base64_to_image(data_url):
    b64 = fix_base64(data_url)
    img_bytes = base64.b64decode(b64, validate=False)
    return Image.open(io.BytesIO(img_bytes)).convert('RGBA')

def image_to_base64(image):
    buf = io.BytesIO()
    image.convert('RGB').save(buf, format='JPEG', quality=95)
    return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'

def remove_white_bg(img, threshold=200):
    data = np.array(img.convert('RGBA')).astype(float)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    # Remove white and near-white backgrounds
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    # Also remove light grey backgrounds
    grey_mask = (np.abs(r - g) < 20) & (np.abs(g - b) < 20) & (r > 180)
    bg_mask = white_mask | grey_mask
    data[:,:,3] = np.where(bg_mask, 0, 255)
    return Image.fromarray(data.astype(np.uint8))

def detect_body_region(img_array, category):
    h, w = img_array.shape[:2]
    if category == 'bottom':
        # Lower half of body
        top = int(h * 0.48)
        bottom = int(h * 0.95)
        left = int(w * 0.15)
        right = int(w * 0.85)
    elif category == 'dress':
        # Full body from shoulders down
        top = int(h * 0.18)
        bottom = int(h * 0.95)
        left = int(w * 0.10)
        right = int(w * 0.90)
    elif category == 'outerwear':
        # Slightly larger than top
        top = int(h * 0.16)
        bottom = int(h * 0.62)
        left = int(w * 0.08)
        right = int(w * 0.92)
    else:
        # Top - shoulders to waist
        top = int(h * 0.18)
        bottom = int(h * 0.58)
        left = int(w * 0.10)
        right = int(w * 0.90)
    return left, top, right - left, bottom - top

def soft_blend(base, overlay, x, y, w, h, feather=25):
    # Resize overlay
    overlay_resized = overlay.resize((w, h), Image.LANCZOS)
    overlay_arr = np.array(overlay_resized).astype(float)

    # Create feathered alpha mask
    mask = np.ones((h, w), dtype=float)
    for i in range(feather):
        fade = i / feather
        if i < h: mask[i, :] *= fade
        if h-1-i >= 0: mask[h-1-i, :] *= fade
        if i < w: mask[:, i] *= fade
        if w-1-i >= 0: mask[:, w-1-i] *= fade

    # Apply mask to overlay alpha
    overlay_arr[:,:,3] = overlay_arr[:,:,3] * mask
    overlay_final = Image.fromarray(overlay_arr.astype(np.uint8))

    result = base.copy()
    result.paste(overlay_final, (x, y), overlay_final)
    return result

def composite_tryon(person, garment, category):
    pw, ph = person.size
    person_arr = np.array(person)

    # Get placement region
    x, y, w, h = detect_body_region(person_arr, category)

    print(f'Placing garment at x={x}, y={y}, w={w}, h={h} on {pw}x{ph} image')

    # Remove background from garment
    garment_clean = remove_white_bg(garment)

    # Blend onto person
    result = soft_blend(person, garment_clean, x, y, w, h, feather=30)
    result = result.convert('RGB')

    # Slight enhancement for realism
    result = ImageEnhance.Contrast(result).enhance(1.03)
    result = ImageEnhance.Color(result).enhance(1.05)

    return result

@app.route('/health')
def health():
    return jsonify({'ok': True})

@app.route('/api/tryon', methods=['POST'])
def tryon():
    try:
        print('--- Try-on request ---')
        data = request.get_json(force=True)
        person = base64_to_image(data['modelImage'])
        garment = base64_to_image(data['garmentImage'])
        category = data.get('category', 'top')
        print(f'Person: {person.size}, Garment: {garment.size}, Category: {category}')
        result = composite_tryon(person, garment, category)
        print('✅ Done!')
        return jsonify({'output': image_to_base64(result)})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('✅ Server on http://localhost:3002')
    app.run(host='0.0.0.0', port=3002, debug=False)
