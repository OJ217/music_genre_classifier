import pickle
import numpy as np
from keras.models import load_model
from flask import Flask, request, jsonify
from preprocess.extract_audio_features import extract_features
from sklearn.preprocessing import LabelEncoder
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

label_encoder = LabelEncoder()
label_encoder.classes_ = np.asarray(["blues", "classical", "country", "disco", "hiphop", "jazz", "metal", "pop", "reggae", "rock"])

cnn_model = load_model("./models/trained_cnn_model_75.keras")
with open('./models/trained_mlp_model.pkl', 'rb') as model_file:
    mlp_model = pickle.load(model_file)
    
@app.route("/", methods=["GET"])
def root():
    return jsonify({"success": True, "data": {"message": "Server running 🚀 (music-genre-classifier)"}})
    
@app.route("/predict-genre", methods=["POST"])
def predict_genre():
    if "audio" not in request.files:
        return jsonify({"success": False, "error": "No audio file"})
    
    audio_file = request.files["audio"]

    try:
        audio_features = extract_features(audio_file)
        mlp_prediction = mlp_model.predict(audio_features)
        mlp_genre = label_encoder.inverse_transform(mlp_prediction)

        cnn_prediction = cnn_model.predict(audio_features)
        cnn_genre = label_encoder.inverse_transform(np.argmax(cnn_prediction, axis=1))

        return jsonify({"success": True, "data": {"genre": {"mlp": mlp_genre[0], "cnn": cnn_genre[0]}}})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": f"Error processing audio: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)