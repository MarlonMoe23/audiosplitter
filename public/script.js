document.addEventListener('DOMContentLoaded', () => {
  const audioFileInput = document.getElementById('audio-file');
  const fileNameDisplay = document.getElementById('file-name');
  const partsInput = document.getElementById('parts');
  const splitButton = document.getElementById('split-button');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress');
  const statusText = document.getElementById('status');
  const resultsContainer = document.getElementById('results');
  const downloadLinks = document.getElementById('download-links');
  
  let selectedFile = null;
  const audioSplitter = new AudioSplitter();
  
  // Actualizar nombre del archivo seleccionado
  audioFileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    
    if (selectedFile) {
      fileNameDisplay.textContent = selectedFile.name;
      splitButton.disabled = false;
    } else {
      fileNameDisplay.textContent = 'Seleccionar archivo de audio';
      splitButton.disabled = true;
    }
  });
  
  // Validar número de partes
  partsInput.addEventListener('input', () => {
    const value = parseInt(partsInput.value);
    if (value < 2) {
      partsInput.value = 2;
    }
  });
  
// Obtener nombre base del archivo sin extensión
function getFileBaseName(fileName) {
  return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
}

  // Manejar el proceso de división
  splitButton.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    const parts = parseInt(partsInput.value);
    if (parts < 2) {
      alert('Debes dividir el archivo en al menos 2 partes');
      return;
    }
    
    // Mostrar progreso
    progressContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    progressBar.style.width = '0%';
    statusText.textContent = 'Cargando archivo...';
    
    try {
      // Cargar el audio
      progressBar.style.width = '20%';
      const audioBuffer = await audioSplitter.loadAudio(selectedFile);
      
      // Dividir el audio
      progressBar.style.width = '50%';
      statusText.textContent = 'Dividiendo audio...';
      const splitBuffers = audioSplitter.splitAudio(audioBuffer, parts);
      
      // Convertir a WAV
      progressBar.style.width = '80%';
      statusText.textContent = 'Preparando archivos...';
      
      const outputFiles = [];
      for (let i = 0; i < splitBuffers.length; i++) {
        const blob = await audioSplitter.bufferToWav(splitBuffers[i]);
        const url = URL.createObjectURL(blob);
        
        outputFiles.push({
          name: `${getFileBaseName(selectedFile.name)}_parte_${i + 1}.wav`,
          url: url
        });
      }
      
      // Mostrar 100% de progreso
      progressBar.style.width = '100%';
      statusText.textContent = '¡Proceso completado!';
      
      // Mostrar enlaces de descarga
      displayDownloadLinks(outputFiles);
      
    } catch (error) {
      console.error('Error:', error);
      statusText.textContent = `Error: ${error.message || 'Error al procesar el archivo'}`;
      progressBar.style.backgroundColor = '#e74c3c';
    }
  });
  
  // Función para mostrar enlaces de descarga
  function displayDownloadLinks(files) {
    downloadLinks.innerHTML = '';
    
    files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'download-item';
      
      const label = document.createElement('span');
      label.textContent = `Parte ${index + 1}`;
      
      const link = document.createElement('a');
      link.href = file.url;
      link.className = 'download-link';
      link.textContent = 'Descargar';
      link.download = file.name;
      
      item.appendChild(label);
      item.appendChild(link);
      downloadLinks.appendChild(item);
    });
    
    resultsContainer.classList.remove('hidden');
  }
});