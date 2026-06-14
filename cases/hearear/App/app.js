const sliderGroups = document.querySelectorAll(".slider-cont");

sliderGroups.forEach((group) => {
  const slider = group.querySelector(".slider-input");
  const output = group.querySelector(".slider-value");

  if (!slider || !output) {
    return;
  }

  // Function to update the UI for a slider
  function updateSliderUI(value) {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 100;
    const numericValue = Number(value);
    const progress = ((numericValue - min) / (max - min)) * 100;

    // Update the progress bar visual
    slider.style.setProperty("--range-progress", `${progress}%`);

    // Update the text display
    if (numericValue === min) {
      output.textContent = "Geen geluid";
      return;
    }

    if (numericValue === max) {
      output.textContent = "Maximaal";
      return;
    }

    output.textContent = `${numericValue}%`;
  }



  // Initialize UI with current slider value
  updateSliderUI(slider.value);

  // When user moves slider: update UI
  slider.addEventListener("input", function () {
    updateSliderUI(this.value);
  });
});

// Load presets from `../data/presets.json` and apply them to sliders

async function loadPreset() {
  console.log("loadPreset started");
  try {
    console.log("Fetching ../data/presets.json");
    // Fetch the JSON data from the presets file (this simulates an API call)
    const response = await fetch("../data/presets.json");
    console.log("Response received:", response);
    
    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the JSON response into a JavaScript object
    const preset = await response.json();
    console.log("Preset parsed successfully:", preset);

    // Apply preset values to sliders
    applyPresetsToSliders(preset);

  } catch (error) {
    // If something goes wrong, log the error and show user message
    console.error("Error loading presets:", error);
    alert("Sorry, we konden de presets niet laden. Probeer het later opnieuw.");
  }
}


function applyPresetsToSliders(preset) {
  // Apply main volume preset
  const volumeSlider = document.querySelector('#volume .slider-input');
  if (volumeSlider) {
    volumeSlider.value = preset.mainVolume;
    updateSliderUIForElement(volumeSlider);
  }

 
  const soundSliders = document.querySelectorAll('#sound .slider-cont .slider-input');
  if (soundSliders[0]) {
    soundSliders[0].value = preset.speechClarity;
    updateSliderUIForElement(soundSliders[0]);
  }
  if (soundSliders[1]) {
    soundSliders[1].value = preset.backgroundNoise;
    updateSliderUIForElement(soundSliders[1]);
  }

  // Apply environment section presets (wind and traffic reduction)
  const envCard = document.querySelector('#environment');
  if (envCard) {
    const envSliders = envCard.querySelectorAll('.slider-cont .slider-input');
    if (envSliders[1]) {
      envSliders[1].value = preset.windReduction;
      updateSliderUIForElement(envSliders[1]);
    }
    if (envSliders[2]) {
      envSliders[2].value = preset.trafficReduction;
      updateSliderUIForElement(envSliders[2]);
    }
  }
}

function updateSliderUIForElement(slider) {
  // Find the output element for this slider
  const output = slider.parentElement.parentElement.querySelector('.slider-value');
  if (!output) return;

  // Calculate progress for the visual bar
  const min = Number(slider.min) || 0;
  const max = Number(slider.max) || 100;
  const numericValue = Number(slider.value);
  const progress = ((numericValue - min) / (max - min)) * 100;

  // Update the progress bar visual
  slider.style.setProperty("--range-progress", `${progress}%`);

  // Update the text display
  if (numericValue === min) {
    output.textContent = "Geen geluid";
    return;
  }

  if (numericValue === max) {
    output.textContent = "Maximaal";
    return;
  }

  output.textContent = `${numericValue}%`;
}
// Initialize: load saved presets when the page loads
loadPreset();
