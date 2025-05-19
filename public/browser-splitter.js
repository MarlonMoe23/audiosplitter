class AudioSplitter {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  async loadAudio(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  splitAudio(audioBuffer, parts) {
    const duration = audioBuffer.duration;
    const partDuration = duration / parts;
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    
    const results = [];
    
    for (let i = 0; i < parts; i++) {
      const startSample = Math.floor(i * partDuration * sampleRate);
      const endSample = Math.floor((i + 1) * partDuration * sampleRate);
      const partSamples = endSample - startSample;
      
      const partBuffer = this.audioContext.createBuffer(
        channels,
        partSamples,
        sampleRate
      );
      
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const partData = partBuffer.getChannelData(channel);
        
        for (let j = 0; j < partSamples; j++) {
          partData[j] = channelData[startSample + j];
        }
      }
      
      results.push(partBuffer);
    }
    
    return results;
  }

  async bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2;
    const sampleRate = buffer.sampleRate;
    
    const wav = new DataView(new ArrayBuffer(44 + length));
    
    // RIFF chunk descriptor
    writeString(wav, 0, 'RIFF');
    wav.setUint32(4, 36 + length, true);
    writeString(wav, 8, 'WAVE');
    
    // FMT sub-chunk
    writeString(wav, 12, 'fmt ');
    wav.setUint32(16, 16, true);
    wav.setUint16(20, 1, true);
    wav.setUint16(22, numOfChan, true);
    wav.setUint32(24, sampleRate, true);
    wav.setUint32(28, sampleRate * numOfChan * 2, true);
    wav.setUint16(32, numOfChan * 2, true);
    wav.setUint16(34, 16, true);
    
    // Data sub-chunk
    writeString(wav, 36, 'data');
    wav.setUint32(40, length, true);
    
    // Write the PCM samples
    const dataOffset = 44;
    let offset = dataOffset;
    
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        
        // Clamp the sample to the range [-1, 1]
        const clampedSample = Math.max(-1, Math.min(1, sample));
        
        // Convert to 16-bit PCM
        const value = clampedSample < 0 
          ? clampedSample * 0x8000 
          : clampedSample * 0x7FFF;
        
        wav.setInt16(offset, value, true);
        offset += 2;
      }
    }
    
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    
    return new Blob([wav], { type: 'audio/wav' });
  }
}

// Exportar la clase
window.AudioSplitter = AudioSplitter;