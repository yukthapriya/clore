from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import base64, io
from gradio_client import Client, handle_file

app = Flask(__name__)
CORS(app, origins='*')

def fix_base64(data):
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
    return Image.open(io.BytesIO(img_bytes)).convert('RGB')

def image_to_base64(image):
    buf = io.BytesIO()
    image.save(buf, format='JPEG', quality=95)
    return f'data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}'

def save_temp_image(image, path):
    image.save(path, format='JPEG', quality=95)
    return path

print('Connecting to IDM-VTON space...')
client = Client("yisol/IDM-VTON")
print('✅ Connected!')

@app.route('/health')
def health():
    return jsonify({'ok': True})

@app.route('/api/tryon', methods=['POST'])
def tryon():
    try:
        print('--- Try-on request ---')
        data = request.get_json(force=True)
        
        person_img = base64_to_image(data['modelImage'])
        garment_img = base64_to_image(data['garmentImage'])
        category = data.get('category', 'top')
        print(f'Person: {person_img.size}, Garment: {garment_img.size}')
        
        # Save to temp files
        person_img.save('/tmp/person.jpg', 'JPEG')
        garment_img.save('/tmp/garment.jpg', 'JPEG')
        
        print('Running IDM-VTON...')
        result = client.predict(
            dict={"background": handle_file('/tmp/person.jpg'), "layers": [], "composite": None},
            garm_img=handle_file('/tmp/garment.jpg'),
            garment_des="a clothing item",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )
        
        print('Result:', result)
        
        # Result is a tuple (image_path, masked_image_path)
        result_image_path = result[0]
        result_image = Image.open(result_image_path).convert('RGB')
        
        print('✅ Done!')
        return jsonify({'output': image_to_base64(result_image)})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('✅ VTON server on http://localhost:3002')
    app.run(host='0.0.0.0', port=3002, debug=False)
