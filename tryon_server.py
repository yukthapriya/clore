from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import json
import time
import io

app = Flask(__name__)
CORS(app)

def base64_to_bytes(data_url):
    base64_data = data_url.split(',')[1] if ',' in data_url else data_url
    return base64.b64decode(base64_data)

@app.route('/api/tryon', methods=['POST'])
def tryon():
    try:
        data = request.json
        model_image = data['modelImage']
        garment_image = data['garmentImage']
        category = data.get('category', 'top')
        
        print('Try-on request received...')
        
        # Try multiple working spaces
        spaces = [
            'https://represents-virtual-try-on.hf.space',
            'https://fakezeta-i2vton.hf.space',
            'https://yisol-idm-vton.hf.space',
        ]
        
        person_bytes = base64_to_bytes(model_image)
        garment_bytes = base64_to_bytes(garment_image)
        
        for space in spaces:
            try:
                print(f'Trying {space}...')
                
                # Upload person image
                files1 = {'files': ('person.jpg', person_bytes, 'image/jpeg')}
                r1 = requests.post(f'{space}/upload', files=files1, timeout=30)
                if not r1.ok:
                    print(f'Upload failed: {r1.status_code}')
                    continue
                person_path = r1.json()[0]
                
                # Upload garment image  
                files2 = {'files': ('garment.jpg', garment_bytes, 'image/jpeg')}
                r2 = requests.post(f'{space}/upload', files=files2, timeout=30)
                if not r2.ok:
                    print(f'Upload failed: {r2.status_code}')
                    continue
                garment_path = r2.json()[0]
                
                print(f'Uploaded to {space}: {person_path}, {garment_path}')
                
                # Get API info
                info_r = requests.get(f'{space}/info', timeout=10)
                if not info_r.ok:
                    continue
                info = info_r.json()
                endpoints = list(info.get('named_endpoints', {}).keys())
                print(f'Endpoints: {endpoints}')
                
                if not endpoints:
                    continue
                    
                endpoint = endpoints[0]
                
                # Call predict
                payload = {
                    'data': [
                        {'path': person_path, 'orig_name': 'person.jpg', 'meta': {'_type': 'gradio.FileData'}},
                        {'path': garment_path, 'orig_name': 'garment.jpg', 'meta': {'_type': 'gradio.FileData'}},
                    ]
                }
                
                r3 = requests.post(f'{space}/call/{endpoint.lstrip("/")}', 
                    json=payload, timeout=30)
                if not r3.ok:
                    print(f'Predict call failed: {r3.status_code}')
                    continue
                    
                event_id = r3.json().get('event_id')
                if not event_id:
                    continue
                    
                print(f'Event ID: {event_id}, polling...')
                
                # Poll for result
                for i in range(60):
                    time.sleep(3)
                    poll = requests.get(f'{space}/call/{endpoint.lstrip("/")}/{event_id}', timeout=30)
                    text = poll.text
                    print(f'Poll {i}: {text[:100]}')
                    
                    if 'error' in text.lower() and 'data: null' in text:
                        break
                        
                    for line in text.split('\n'):
                        if line.startswith('data:'):
                            try:
                                result_data = json.loads(line[5:].strip())
                                if isinstance(result_data, list) and len(result_data) > 0:
                                    output = result_data[0]
                                    if isinstance(output, str) and output.startswith('data:'):
                                        return jsonify({'output': output})
                                    elif isinstance(output, dict):
                                        url = output.get('url') or output.get('path', '')
                                        if url:
                                            if not url.startswith('http'):
                                                url = f'{space}/file={url}'
                                            return jsonify({'output': url})
                            except:
                                pass
                                
            except Exception as e:
                print(f'Space {space} failed: {e}')
                continue
        
        return jsonify({'error': 'All spaces failed or busy. Try again in a minute.'}), 500
        
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('✅ Python try-on server running on http://localhost:3002')
    app.run(port=3002, debug=False)
