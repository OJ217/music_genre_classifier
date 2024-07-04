import React from 'react';
import { capitalize } from './utils/format.util';

type GenrePredictionResponse =
	| {
			success: true;
			data: { genre: { mlp: string; cnn: string } };
			// eslint-disable-next-line no-mixed-spaces-and-tabs
	  }
	| { success: false; error: string };

function App() {
	const audioRef = React.useRef<HTMLAudioElement>(null);
	const [predictedGenre, setPredictedGenre] = React.useState<{ mlp: string; cnn: string } | null>(null);
	const [musicTitle, setMusicTitle] = React.useState<string | null>(null);
	const [predictionPending, setPredictionPending] = React.useState<boolean>(false);
	const [audioFile, setAudioFile] = React.useState<File | null>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.item(0);

		try {
			if (!file || !isAudioFile(file)) {
				throw Error('Please select a valid audio file.');
			}

			const fileSizeInMB = (file?.size as number) / Math.pow(1024, 2);
			if (fileSizeInMB > 3) {
				throw Error('Exceeded maximum file size (3MB)');
			}

			setAudioFile(file);
			setMusicTitle(file.name);

			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.load();
				audioRef.current.currentTime = 0; // Reset audio to the beginning
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			setAudioFile(null);
			alert(error?.message);
		} finally {
			setPredictedGenre(null);
		}
	};

	const isAudioFile = (file: File) => {
		const allowedExtensions = ['mp3', 'wav', 'ogg', 'aac', 'au'];
		return allowedExtensions.some(extension => file.name.endsWith(extension));
	};

	const handleGenrePrediction = async () => {
		if (!audioFile) {
			return alert('Select an audio file please.');
		}

		const formData = new FormData();
		formData.append('audio', audioFile);

		setPredictionPending(true);

		try {
			const response = await fetch('http://localhost:5000/predict-genre', {
				method: 'POST',
				body: formData,
			});

			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
			}

			const data: GenrePredictionResponse = await response.json();

			if (!data.success) {
				throw Error(data.error);
			}

			setPredictedGenre(data.data.genre);
		} catch (error) {
			console.error(error);
			alert('Could not predict genre.');
		} finally {
			setPredictionPending(false);
			if (audioRef.current) {
				audioRef.current.play();
			}
		}
	};

	return (
		<>
			<div className='header'>
				<h4>Music Genre Predictor</h4>
				<div>
					{audioFile ? (
						<audio
							ref={audioRef}
							controls
						>
							<source
								key={audioFile.name}
								src={URL.createObjectURL(audioFile)}
								type='audio/mpeg'
							/>
						</audio>
					) : (
						<p>Please select an audio file.</p>
					)}
					{musicTitle && <h3>{musicTitle}</h3>}
				</div>
			</div>

			<div className='genre-container'>
				{predictedGenre ? (
					<>
						<div className='genre-label-container'>
							<h1 className='genre'>{capitalize(predictedGenre.mlp)}</h1>
							<p style={{ fontSize: '0.8rem' }}>(Model: MLP)</p>
						</div>
						<div className='genre-label-container'>
							<h1 className='genre'>{capitalize(predictedGenre.cnn)}</h1>
							<p style={{ fontSize: '0.8rem' }}>(Model: CNN)</p>
						</div>
					</>
				) : (
					<div style={{ height: 82 }}>
						{predictionPending && (
							<div className='spinner-container'>
								<div className='spinner'></div>
							</div>
						)}
					</div>
				)}
			</div>

			<div className='button-group'>
				<label className={`button button-secondary ${predictionPending && 'pending'}`}>
					Select Music
					<input
						type='file'
						accept='audio/*'
						style={{
							display: 'none',
						}}
						disabled={predictionPending}
						onChange={handleFileChange}
					/>
				</label>
				<button
					className='button-primary'
					disabled={predictionPending}
					onClick={handleGenrePrediction}
				>
					Predict Genre
				</button>
			</div>
		</>
	);
}

export default App;
