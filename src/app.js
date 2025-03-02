import { SceneManager } from './core/SceneManager.js';
import { Renderer } from './core/Renderer.js';
import { CameraControls } from './core/CameraControls.js';
import { Lighting } from './core/Lighting.js';
import { MuseumLayout } from './procedural/MuseumLayout.js';
import { UserInterface } from './ui/UserInterface.js';
import { ImageSource } from './data/ImageSource.js';
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/libs/stats.module.js';

class VirtualMuseumApp {
    constructor() {
        this.container = document.getElementById('container');
        this.loadingScreen = document.getElementById('loading-screen');
        
        // Initialize Stats for performance monitoring
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.getElementById('performance-stats').appendChild(this.stats.dom);
        
        // Initialize core components
        this.renderer = new Renderer(this.container);
        this.sceneManager = new SceneManager();
        this.cameraControls = new CameraControls(this.sceneManager.getCamera(), this.container);
        this.lighting = new Lighting(this.sceneManager.getScene());
        
        // Initialize procedural generation
        this.museumLayout = new MuseumLayout(this.sceneManager);
        
        // Initialize UI
        this.userInterface = new UserInterface(this.cameraControls);
        
        // Initialize image source
        this.imageSource = new ImageSource();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the application
        this.init();
    }
    
    async init() {
        // Load initial resources
        try {
            await this.imageSource.preloadImages();
            await this.museumLayout.generateInitialLayout();
            
            // Hide loading screen
            this.loadingScreen.classList.add('hidden');
            
            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Error initializing the application:', error);
        }
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.onWindowResize();
            this.cameraControls.updateAspect(window.innerWidth / window.innerHeight);
        });
        
        // Track user movement for procedural generation
        document.addEventListener('keydown', (event) => {
            // Get the direction of movement from key press
            let direction = null;
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    direction = 'forward';
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    direction = 'backward';
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    direction = 'left';
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    direction = 'right';
                    break;
                default:
                    break;
            }
            
            // If a movement key was pressed, check if we need to generate new rooms
            if (direction) {
                this.museumLayout.checkAndGenerateNewRooms(
                    this.cameraControls.getPosition(),
                    direction
                );
            }
        });
    }
    
    animate() {
        this.stats.begin();
        
        // Update controls
        this.cameraControls.update();
        
        // Update museum layout (LOD, unloading distant rooms, etc.)
        this.museumLayout.update(this.cameraControls.getPosition());
        
        // Render the scene
        this.renderer.render(
            this.sceneManager.getScene(),
            this.sceneManager.getCamera()
        );
        
        this.stats.end();
        
        // Continue animation loop
        requestAnimationFrame(this.animate.bind(this));
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new VirtualMuseumApp();
});