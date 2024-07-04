import pickle
import librosa
import numpy as np
from io import BytesIO

with open('./preprocess/feature_scaler.pkl', 'rb') as scaler_file:
    scaler = pickle.load(scaler_file)

def extract_features(audio_file):
    y, sr = librosa.load(BytesIO(audio_file.read()), duration=30)
    n_fft = 1024 
    hop_length = 512

    features = {
        "centroid": librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length).ravel(),
        "flux": librosa.onset.onset_strength(y=y, sr=sr).ravel(),
        "rmse": librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length).ravel(),
        "zcr": librosa.feature.zero_crossing_rate(y=y, frame_length=n_fft, hop_length=hop_length).ravel(),
        "contrast": librosa.feature.spectral_contrast(y=y, sr=sr).ravel(),
        "bandwidth": librosa.feature.spectral_bandwidth(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length).ravel(),
        "flatness": librosa.feature.spectral_flatness(y=y, n_fft=n_fft, hop_length=hop_length).ravel(),
        "rolloff": librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length).ravel()
    }
    
    # MFCC treatment
    mfcc = librosa.feature.mfcc(y=y, n_fft=n_fft, hop_length=hop_length, n_mfcc=20)
    
    for idx, v_mfcc in enumerate(mfcc):
        features['mfcc_{}'.format(idx)] = v_mfcc.ravel()
        
    # Get statistics from the vectors
    def get_feature_stats(features):
        result = {}
        
        for k, v in features.items():
            result['{}_mean'.format(k)] = np.mean(v)
            result['{}_var'.format(k)] = np.var(v)
            
        return result
    
    dict_agg_features = get_feature_stats(features)
    dict_agg_features['tempo'] = librosa.feature.tempo(y=y,sr=sr,hop_length=hop_length)[0]

    return scaler.transform(np.array(list(dict_agg_features.values())).reshape(1, -1))