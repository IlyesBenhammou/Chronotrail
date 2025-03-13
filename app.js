const express = require('express');
const path = require('path');
const { Javonet } = require('javonet-nodejs-sdk');  // Import Javonet SDK

const app = express();
const port = 3001;

// Activate Javonet with your license key
Javonet.activate("key"); // Replace with your Javonet license key

// Load the Python runtime and specify the Python library
let calledRuntime = Javonet.inMemory().python();  // Initialize Python runtime
const libraryPath = ".";  // Path to the Python script or library
calledRuntime.loadLibrary(libraryPath);  // Load the library (directory where Python script is located)

// Function to run the Python script using Javonet
async function generateMap() {
    try {
        // Load the Python function `create_enhanced_map` from the Python script
        let pythonScriptType = calledRuntime.getType('map');  // Name of your Python script (without `.py`)
        
        // Invoke the Python method `create_enhanced_map` from the loaded script
        let response = pythonScriptType.invokeStaticMethod('create_enhanced_map').execute();
        
        // Get the value (map file path)
        let mapFilePath = response.getValue();
        
        console.log("Map generated successfully:", mapFilePath);
        return mapFilePath;  // Return the map file path
    } catch (error) {
        console.error("Error running the Python script:", error);
        return null;  // Return null if there was an error
    }
}

// Serve the map when the app is started
app.get('/', async (req, res) => {
    const mapFilePath = await generateMap();
    
    if (mapFilePath) {
        // Serve the generated map HTML file
        res.sendFile(path.join(__dirname, mapFilePath));  // Path to the generated map
    } else {
        res.status(500).send("Error generating the map.");
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});