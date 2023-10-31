import {initShaders, vec4, mat4, flatten, perspective, translate, lookAt, rotateX, rotateY, rotateZ}
    from './helperfunctions.js';

// ** Global Declarations **
let gl: WebGLRenderingContext;
let canvas: HTMLCanvasElement;
let program: WebGLProgram;
let umv: WebGLUniformLocation;
let uproj: WebGLUniformLocation;
let boatBufferId: WebGLBuffer;
let fanBufferId: WebGLBuffer;
let rudderBufferId: WebGLBuffer;
let waterBufferId: WebGLBuffer;
let searchLightBufferId: WebGLBuffer;
let wallBufferId: WebGLBuffer;
let rotateAngle: number;
let vPosition: GLint;
let vColor: GLint;
let vNormal;
let boatPoints: vec4[] = [];
let waterPoints: vec4[] = [];
let searchLightPoints: vec4[] = [];
let wallPoints: vec4[] = [];
let boatSpeed: number = 0.1;
let fanAngle: number = 0;
let rudderAngle: number = 0;
let fanSpeed: number = 0;
let searchLightAngle: number = 0;
let currentCamera = "freeRoam";
const MAX_SEARCHLIGHT_ANGLE = 30;  // Maximum rotation in the positive direction
const MIN_SEARCHLIGHT_ANGLE = -30; // Maximum rotation in the negative direction
let fov = 45.0;  // Initial field of view
let eye: vec4;
let at: vec4;
let up: vec4;
let zoomIn, zoomOut = false;
let DollyIn, DollyOut = false;
let cameraOffset = 0;
let center = false;



/**
 *  The 'eye' vector places the camera 2 units above the X-axis and 5 units along the Z-axis.
 *   The 'at' vector is set to the origin of the scene, which means our camera is directly looking at the center.
 *   The 'up' vector defines the world's upward direction, ensuring the camera's vertical alignment is consistent.
 *  eye`: camera's position. (0.0, 2, 5.0) places the camera slightly elevated and behind the scene's origin.
 */
function setFreeRoamCamera() {
    console.log("setfreeroam cam clicked");
     eye = new vec4(0.0, 2, 5.0 + cameraOffset, 1.0);    // Camera position
     at = new vec4(0.0, 0.0, 0.0, 1.0);   // Look-at point (center of the scene)
     up = new vec4(0.0, 1.0, 0.0, 0.0);   // Up direction

    let mv = lookAt(eye, at, up);
    mv = mv.mult(translate(-boat.x,-boat.y,-boat.z));
    return mv;
}
/**
 * Sets up the Overhead Camera perspective.
 * The 'eye' vector is (0.0, 5.0, 0.0), placing the camera directly above the scene's center, at a height of 5 units.
 * The 'at' vector remains as the origin, meaning the camera is looking straight down.
 * The 'up' vector is set to the negative Z-axis.
 */

function setOverheadCamera() {
    console.log("overhead cam clicked");
     eye = new vec4(0.0, 5.0, 0.0, 1.0); // Directly above the scene
     at = new vec4(0.0, 0.0, 0.0, 1.0);
     up = new vec4(0.0, 0.0, 1.0, 0.0); // Z is the up direction for overhead view

    let mv = lookAt(eye, at, up);
    mv = mv.mult(rotateY(-boat.rotateAngle));
    mv = mv.mult(translate(-boat.x,-boat.y,-boat.z));
    return mv;
}
/**
 * Sets up the Chase Camera view.

 * The 'eye' vector's position is dependent on the boat's current position, ensuring that the camera follows the boat.
 * An offset of -2.0 units along the Z-axis places the camera slightly behind the boat.
 * The 'at' vector focuses on the boat, creating the chasing perspective.
 * The 'up' vector, once again, ensures consistent vertical orientation.
 */

function setChaseCamera() {

    let offset = -2.0; // How far behind the boat the camera is
    eye = new vec4(0, 1, 0 + offset, 1.0); // Behind and slightly above the boat
    at = new vec4(0, 0, 0, 1.0);
    up = new vec4(0.0, 1.0, -1.0, 0.0);

    let mv = lookAt(eye, at, up);
    mv = mv.mult(rotateY(-boat.rotateAngle));
    mv = mv.mult(translate(-boat.x,-boat.y,-boat.z));

    return mv;
}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");

    rotateAngle = 0;
    center = true;

    window.addEventListener("keydown", function (event) {
        event.preventDefault();
        console.log("Key pressed: " + event.key);
        switch (event.key) {
            case '1':
                currentCamera = "freeRoam";
                updateView();
                break;
            case '2':
                currentCamera = "overhead";
                updateView();
                break;
            case '3':
                currentCamera = "chase";
                updateView();
                break;
            case 'x':
                if (currentCamera === "freeRoam") {
                    zoomIn = true;
                }
                break;
            case 'z':
                if (currentCamera === "freeRoam") {
                    zoomOut = true;
                }
                break;
            case 'q':
                if (currentCamera === "freeRoam")
                    DollyIn = true;
                break;
            case 'e':
                if (currentCamera === "freeRoam")
                   DollyOut = true;
                break;
            case 'f':
                if (currentCamera === "freeRoam")
                    if(center === true)
                        center = false;
                else
                    center = true;
                break;
            case 'r':
                currentCamera = "original";
                updateView();
                break;
            case 'ArrowRight':
                boat.move('RIGHT');
                break;
            case 'ArrowLeft':
                boat.move('LEFT');
                break;
            case 'ArrowUp':
                boat.move('FORWARD');

                break;
            case 'ArrowDown':

                boat.move('BACKWARD');

                break;

            case 'a':

                updateSearchLightAngle('LEFT');
                break;
            case 'd':
                updateSearchLightAngle('RIGHT');

                break;
        }
    });
    window.addEventListener("keyup", function (event) {
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowLeft':
                rudderAngle = 0; // Reset rudders to a neutral position
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                // Stop the boat's movement and fan spinning
                fanSpeed = 0;
                break;

            case 'z':
                zoomOut = false;
                break;
            case 'x':
                zoomIn = false;
                break;
            case 'q':
                DollyIn = false;
                break;
            case 'e':
                DollyOut = false;
                break;

        }

    });

    makeBoatAndBuffer();

    makeFanAndBuffer();

    makeWaterAndBuffer();

    makeRudderAndBuffer();

    makeSearchLightAndBuffer();

    makeWallAndBuffer();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

   // updateView();
    requestAnimationFrame(render);
    window.setInterval(update,16);

};
/**
 * Moves the boat in the specified direction. This involves updating
 * the boat's position offsets, updating the rotation angle based on
 * the direction, and setting the angle for the rudder and fan.
 *
 * @param {string} direction - Direction in which to move the boat ('RIGHT', 'LEFT', 'FORWARD', 'BACKWARD').
 */
class Boat {
    x: number;
    y: number;
    z: number;
    rotateAngle: number;
    speed: number;

    constructor(x: number, y: number, z: number, rotateAngle: number, speed: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotateAngle = rotateAngle;
        this.speed = speed;
    }

    move(direction: string) {
        let dx = 0;
        let dz = 0;

        switch (direction) {
            case 'RIGHT':
                this.rotateAngle -= 5;
                // Assuming rudderAngle is part of the Boat class. If not, adjust accordingly.
                rudderAngle = -20;
                break;
            case 'LEFT':
                this.rotateAngle += 5;
                rudderAngle = 20;
                break;
            case 'FORWARD':
                dx = Math.sin(this.rotateAngle * (Math.PI / 180)) * this.speed;
                dz = Math.cos(this.rotateAngle * (Math.PI / 180)) * this.speed;
                fanSpeed = 40; // start spinning the fan forward
                console.log(`rotateAngle: ${this.rotateAngle}, dx: ${dx}, dz: ${dz}`); //debugging test
                break;
            case 'BACKWARD':
                dx = -Math.sin(this.rotateAngle * (Math.PI / 180)) * this.speed;
                dz = -Math.cos(this.rotateAngle * (Math.PI / 180)) * this.speed;
                fanSpeed = -40; // start spinning the fan backward
                console.log(`rotateAngle: ${this.rotateAngle}, dx: ${dx}, dz: ${dz}`); //debugging test
                break;
        }

        // Boundary checks for x and z
        if (this.x + dx > -2.8 && this.x + dx < 2.8) {
            this.x += dx;
        }
        if (this.z + dz > -1.8 && this.z + dz < 1.8) {
            this.z += dz;
        }

        // Triggering the rendering
        requestAnimationFrame(render);
    }
}
let boat = new Boat(0, 0, 0, 0, 0.05);

/**
 * Constructs the boat's geometry and initializes its buffer for rendering.
 * The boat is represented by a series of vertices and colors for a 3D rectangle.
 */
function makeBoatAndBuffer() {
    boatPoints = [
        // Front face red side
        new vec4(-0.2, -0.1,  0.5, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(0.2, -0.1,  0.5, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(0.2,  0.1,  0.5, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(-0.2, -0.1,  0.5, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(0.2,  0.1,  0.5, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(-0.2,  0.1,  0.5, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),

        // Back face green side
        new vec4(-0.2, -0.1, -0.5, 1.0), new vec4(0.0, 1.0, 0.0, 1.0),
        new vec4(0.2, -0.1, -0.5, 1.0), new vec4(0.0, 1.0, 0.0, 1.0),
        new vec4(0.2,  0.1, -0.5, 1.0), new vec4(0.0, 1.0, 0.0, 1.0),
        new vec4(-0.2, -0.1, -0.5, 1.0), new vec4(0.0, 1.0, 0.0, 1.0),
        new vec4(0.2,  0.1, -0.5, 1.0), new vec4(0.0, 1.0, 0.0, 1.0),
        new vec4(-0.2,  0.1, -0.5, 1.0), new vec4(0.0, 1.0, 0.0, 1.0),

        // Bottom face white
        new vec4(-0.2, -0.1, -0.5, 1.0), new vec4(1.0, 1.0, 1.0, 1.0),
        new vec4(0.2, -0.1, -0.5, 1.0), new vec4(1.0, 1.0, 1.0, 1.0),
        new vec4(0.2, -0.1,  0.5, 1.0), new vec4(1.0, 1.0, 1.0, 1.0),
        new vec4(-0.2, -0.1, -0.5, 1.0), new vec4(1.0, 1.0, 1.0, 1.0),
        new vec4(0.2, -0.1,  0.5, 1.0), new vec4(1.0, 1.0, 1.0, 1.0),
        new vec4(-0.2, -0.1,  0.5, 1.0), new vec4(1.0, 1.0, 1.0, 1.0),

        // Top face blue
        new vec4(-0.2,  0.1, -0.5, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0.2,  0.1, -0.5, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0.2,  0.1,  0.5, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(-0.2,  0.1, -0.5, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0.2,  0.1,  0.5, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(-0.2,  0.1,  0.5, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),

        // Left face purple
        new vec4(-0.2, -0.1, -0.5, 1.0), new vec4(0.5, 0.0, 0.5, 1.0),
        new vec4(-0.2, -0.1,  0.5, 1.0), new vec4(0.5, 0.0, 0.5, 1.0),
        new vec4(-0.2,  0.1,  0.5, 1.0), new vec4(0.5, 0.0, 0.5, 1.0),

        new vec4(-0.2,  0.1,  0.5, 1.0), new vec4(0.5, 0.0, 0.5, 1.0),
        new vec4(-0.2,  0.1, -0.5, 1.0), new vec4(0.5, 0.0, 0.5, 1.0),
        new vec4(-0.2, -0.1, -0.5, 1.0), new vec4(0.5, 0.0, 0.5, 1.0),

        // Right face orange
        new vec4(0.2, -0.1, -0.5, 1.0), new vec4(1.0, 0.5, 0.0, 1.0),
        new vec4(0.2, -0.1,  0.5, 1.0), new vec4(1.0, 0.5, 0.0, 1.0),
        new vec4(0.2,  0.1,  0.5, 1.0), new vec4(1.0, 0.5, 0.0, 1.0),

        new vec4(0.2,  0.1,  0.5, 1.0), new vec4(1.0, 0.5, 0.0, 1.0),
        new vec4(0.2,  0.1, -0.5, 1.0), new vec4(1.0, 0.5, 0.0, 1.0),
        new vec4(0.2, -0.1, -0.5, 1.0), new vec4(1.0, 0.5, 0.0, 1.0),
    ];

    boatBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boatBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(boatPoints), gl.STATIC_DRAW);

    // Setting the vertex attributes here, so you don't have to set it every time during rendering
    setVertexAttributes();
}
/**
 * Sets the vertex attributes for the boat. This function sets
 * the vertex and color pointers for WebGL rendering: made to reduce the repeating line of code
 */
function setVertexAttributes() {
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);


    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 44, 16);
    gl.enableVertexAttribArray(vNormal);

    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vColor);
}
/**
 * Constructs the rudder's geometry and initializes its buffer for rendering.
 * The rudder is represented by a series of vertices and colors.
 */
function makeRudderAndBuffer() {
    let rudderPoints: vec4[] = [
        // First rectangle
        new vec4(0.2, -0.125, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4( 0.2, 0.1, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0.2, -0.125, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4( 0.2, 0.1, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0.2, -0.125, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4( 0.2, 0.1, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),


        // Second rectangle
        new vec4(0, -0.125, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0, 0.1, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0, -0.125, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0, 0.1, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0, -0.125, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(0, 0.1, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),

        // Third rectangle
        new vec4(-0.2, -0.125, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4( -0.2, 0.1, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(-0.2, -0.125, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4( -0.2, 0.1, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4(-0.2, -0.125, -0.55, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),
        new vec4( -0.2, 0.1, -0.7, 1.0), new vec4(0.0, 0.0, 1.0, 1.0),

    ];

    rudderBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rudderBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rudderPoints), gl.STATIC_DRAW);

    setVertexAttributes();
}

/**
 * Constructs the fan's geometry and initializes its buffer for rendering.
 * The fan is represented by a series of vertices and colors.
 */
function makeFanAndBuffer() {
    let fanPoints: vec4[] = [];
    const fanWidth = 0.05; // Width of each blade of the fan
    const fanHeight = 0.3; // Height of each blade of the fan

    // Center vertical rectangle
    fanPoints.push(
        new vec4(-fanWidth/2, fanHeight, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(fanWidth/2, fanHeight, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(-fanWidth/2, -fanHeight, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),

        new vec4(-fanWidth/2, -fanHeight, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(fanWidth/2, fanHeight, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(fanWidth/2, -fanHeight, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0)
    );

    // Horizontal rectangle
    fanPoints.push(
        new vec4(-fanHeight, -fanWidth/2, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(fanHeight, -fanWidth/2, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(-fanHeight, fanWidth/2, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),

        new vec4(-fanHeight, fanWidth/2, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(fanHeight, -fanWidth/2, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0),
        new vec4(fanHeight, fanWidth/2, -0.51, 1.0), new vec4(1.0, 0.0, 0.0, 1.0)
    );

    fanBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fanBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(fanPoints), gl.STATIC_DRAW);
    setVertexAttributes();
}
/**
 * Constructs the water surface geometry and initializes its buffer for rendering.
 * The water surface is represented by a 3D rectangle with a blue color.
 */
function makeWaterAndBuffer() {

    waterPoints = [
        // Positions                                              // Colors blue
        new vec4(-3.0, -0.1, 2.0, 1.0), new vec4(0.5, 0.5, 1.0, 1.0),  // Front top-left
        new vec4(3.0, -0.1, 2.0, 1.0), new vec4(0.5, 0.5, 1.0, 1.0),   // Front top-right
        new vec4(-3.0, -0.1, -2.0, 1.0), new vec4(0.5, 0.5, 1.0, 1.0), // Back top-left

        new vec4(3.0, -0.1, 2.0, 1.0), new vec4(0.5, 0.5, 1.0, 1.0),   // Front top-right
        new vec4(-3.0, -0.1, -2.0, 1.0), new vec4(0.5, 0.5, 1.0, 1.0), // Back top-left
        new vec4(3.0, -0.1, -2.0, 1.0), new vec4(0.5, 0.5, 1.0, 1.0)   // Back top-right
    ];
    waterBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, waterBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(waterPoints), gl.STATIC_DRAW);
    setVertexAttributes();

}

function makeSearchLightAndBuffer() {
    // Define the 8 vertices of the cube and color for each vertex

    let halfSize = 0.09;

    // Define the offset to move the cube in front of the boat's face.
    let zOffset = 0.25 + halfSize * 2;

    // Define a default color for the cube.
    let defaultColor = new vec4(0.8, 0.8, 0.8, 1.0);  // Example: Gray color

    // Bottom square vertices
    let v1 = new vec4(-halfSize, -halfSize, zOffset, 1.0);        // Left-front-bottom
    let v2 = new vec4(halfSize, -halfSize, zOffset, 1.0);         // Right-front-bottom
    let v3 = new vec4(halfSize, -halfSize, zOffset + halfSize*2, 1.0);   // Right-back-bottom
    let v4 = new vec4(-halfSize, -halfSize, zOffset + halfSize*2, 1.0);  // Left-back-bottom

    // Top square vertices
    let v5 = new vec4(-halfSize, halfSize, zOffset, 1.0);         // Left-front-top
    let v6 = new vec4(halfSize, halfSize, zOffset, 1.0);          // Right-front-top
    let v7 = new vec4(halfSize, halfSize, zOffset + halfSize*2, 1.0);   // Right-back-top
    let v8 = new vec4(-halfSize, halfSize, zOffset + halfSize*2, 1.0);  // Left-back-top

    // Clearing any previous data
    searchLightPoints = [];

    // Constructing the cube's faces using triangles and interleaving color
    // Front face
    searchLightPoints.push(v1, defaultColor, v5, defaultColor, v6, defaultColor);
    searchLightPoints.push(v1, defaultColor, v6, defaultColor, v2, defaultColor);

    // Back face
    searchLightPoints.push(v3, defaultColor, v7, defaultColor, v8, defaultColor);
    searchLightPoints.push(v3, defaultColor, v8, defaultColor, v4, defaultColor);

    // Right face
    searchLightPoints.push(v2, defaultColor, v6, defaultColor, v7, defaultColor);
    searchLightPoints.push(v2, defaultColor, v7, defaultColor, v3, defaultColor);

    // Left face
    searchLightPoints.push(v1, defaultColor, v5, defaultColor, v8, defaultColor);
    searchLightPoints.push(v1, defaultColor, v8, defaultColor, v4, defaultColor);

    // Top face
    searchLightPoints.push(v5, defaultColor, v6, defaultColor, v7, defaultColor);
    searchLightPoints.push(v5, defaultColor, v7, defaultColor, v8, defaultColor);

    // Bottom face
    searchLightPoints.push(v1, defaultColor, v2, defaultColor, v3, defaultColor);
    searchLightPoints.push(v1, defaultColor, v3, defaultColor, v4, defaultColor);

    // Create a buffer and send the cube data to the GPU
    searchLightBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, searchLightBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(searchLightPoints), gl.STATIC_DRAW);
}



function makeWallAndBuffer() {
    const poleBase = 0.05;  // The base size of the pole
    const poleHeight = 1.5; // The height of the pole
    const poleColor = new vec4(0.5, 0.3, 0.0, 1.0); // Brown color for the poles

    // Updated positions to reflect the corners and mid-points of the water object
    const positionsX = [-3.0, 0, 3.0];
    const positionsZ = [2.0, 0, -2.0];

    for (let px of positionsX) {
        for (let pz of positionsZ) {
            if (px === 0 && pz === 0) {
                // Skip the middle pole
                continue;
            }
            // Adjusting the z-values to position the poles correctly
            const zFront = pz + poleBase;
            const zBack = pz - poleBase;
            // Bottom
            wallPoints.push(new vec4(px, -0.1, zFront, 1.0),poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zFront, 1.0),poleColor);
            wallPoints.push(new vec4(px, -0.1, zBack, 1.0),poleColor);

            wallPoints.push(new vec4(px, -0.1, zBack, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zBack, 1.0), poleColor);

            // Top
            wallPoints.push(new vec4(px, poleHeight, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, poleHeight, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px, poleHeight, zBack, 1.0), poleColor);

            wallPoints.push(new vec4(px, poleHeight, zBack, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, poleHeight, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, poleHeight, zBack, 1.0), poleColor);

            // Front
            wallPoints.push(new vec4(px, -0.1, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px, poleHeight, zFront, 1.0), poleColor);

            wallPoints.push(new vec4(px, poleHeight, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zFront, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, poleHeight, zFront, 1.0), poleColor);

            // Back
            wallPoints.push(new vec4(px, -0.1, zBack, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zBack, 1.0), poleColor);
            wallPoints.push(new vec4(px, poleHeight, zBack, 1.0), poleColor);

            wallPoints.push(new vec4(px, poleHeight, zBack, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, -0.1, zBack, 1.0), poleColor);
            wallPoints.push(new vec4(px + poleBase, poleHeight, zBack, 1.0), poleColor);
        }
    }

    wallBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, wallBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wallPoints), gl.STATIC_DRAW);
    setVertexAttributes();
}

function update(){
    //Zoom in
    if(zoomIn){
        fov--;
        if(fov<5)
            fov =5;
        console.log("zoomin")
    }
    //Zoom Out
    if(zoomOut){
        fov++;
        if(fov>120)
            fov=120;
        console.log("zoomOut")
    }
    //Dolly In
    if(DollyIn){
        cameraOffset-=.2;
        if(cameraOffset < -4)
            cameraOffset = -4;
        console.log("DollyIn")
    }
    //Dolly Out
    if(DollyOut){
        cameraOffset+=0.2;
        if(cameraOffset > 3){
            cameraOffset = 3;

       }
    }





    requestAnimationFrame(render);
    console.log("update");
}
function updateSearchLightAngle(direction: string) {
    const ANGLE_INCREMENT = 7;  // Increment/decrement value

    switch (direction) {
        case 'LEFT':
            searchLightAngle += ANGLE_INCREMENT;
            // Ensure it does not exceed the maximum allowed angle
            if (searchLightAngle > MAX_SEARCHLIGHT_ANGLE) {
                searchLightAngle = MAX_SEARCHLIGHT_ANGLE;
            }
            break;
        case 'RIGHT':
            searchLightAngle -= ANGLE_INCREMENT;
            // Ensure it does not go below the minimum allowed angle
            if (searchLightAngle < MIN_SEARCHLIGHT_ANGLE) {
                searchLightAngle = MIN_SEARCHLIGHT_ANGLE;
            }
            break;
    }
}
function updateView() {
    switch (currentCamera) {
        case "freeRoam":
            return setFreeRoamCamera();
        case "overhead":
            return setOverheadCamera();
        case "chase":
            return setChaseCamera();
        case "original":
            return setFreeRoamCamera();
        default:
            console.error("Invalid camera type");
            return new mat4();  // Return identity matrix as fallback
    }
}
/**
 * Renders the scene, which includes the water surface, boat, fan, and rudder.
 * This function is called repeatedly to provide animation as the boat moves.
 */
function render() {


    console.log("Rendering frame.");
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up the camera
    let mv = updateView();
    let mvPoles = updateView();

    // Projection setup
    let fovy = 45.0;
    let aspect = canvas.width / canvas.height;
    let near = 1.0;
    let far = 10.0;

    let p = perspective(fov, aspect, near, far);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    if (currentCamera == "freeRoam"){
        if(center) {
            // Camera pointing at the center of the stage
            eye = new vec4(0.0, 2, 5.0 + cameraOffset, 1.0);
            at = new vec4(0.0, 0.0, 0.0, 1.0);
            up = new vec4(0.0, 1.0, 0.0, 0.0);
        } else {
            // Camera pointing at the fan of the boat
            let offset = -2.0;
            eye = new vec4(0, 1, 0 + offset, 1.0);
            at = new vec4(boat.x, boat.y, boat.z, 1.0);
            up = new vec4(0.0, 1.0, -1.0, 0.0);
        }
        console.log("toggle");
    }

    // Drawing the water
    gl.bindBuffer(gl.ARRAY_BUFFER, waterBufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.uniformMatrix4fv(umv, false, mv.flatten());
    gl.drawArrays(gl.TRIANGLES, 0, 6);  // 6 vertices for 2 triangles

    // Incorporating boat's movement and rotation
    mv = mv.mult(translate(boat.x, boat.y, boat.z));
    mv = mv.mult(rotateY(boat.rotateAngle));

    // Update the fan angle based on fan speed
    fanAngle += fanSpeed;

    // Rotate and render the fan based on fanAngle
    let fanModelView = mv;
    // First, translate to the fan's position (assuming its center on the back of the boat)
    fanModelView = fanModelView.mult(translate(0, 0, 0));
    // Now, rotate the fan
    fanModelView = fanModelView.mult(rotateZ(fanAngle));

    gl.bindBuffer(gl.ARRAY_BUFFER, fanBufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.uniformMatrix4fv(umv, false, fanModelView.flatten());
    gl.drawArrays(gl.TRIANGLES, 0, 12);  // Assuming 12 vertices for the fan

    // Rotate the rudder based on rudderAngle
    let rudderModelView = mv.mult(translate(0, 0, 0));
    rudderModelView = rudderModelView.mult(rotateY(rudderAngle));

    gl.bindBuffer(gl.ARRAY_BUFFER, rudderBufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.uniformMatrix4fv(umv, false, rudderModelView.flatten());
    gl.drawArrays(gl.TRIANGLES, 0, 18);  // Assuming 18 vertices for the rudder

    // Rendering boat
    gl.bindBuffer(gl.ARRAY_BUFFER, boatBufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.uniformMatrix4fv(umv, false, mv.flatten());
    gl.drawArrays(gl.TRIANGLES, 0, boatPoints.length / 2);  // 8 vertices * 1.5 = 12 triangles

    // Rendering the searchlight (cube)
    let searchLightModelView = mv.mult(translate(0, 0, 0)).mult(rotateY(searchLightAngle));

    gl.bindBuffer(gl.ARRAY_BUFFER, searchLightBufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.uniformMatrix4fv(umv, false, searchLightModelView.flatten());  // Ensure we're using the searchLightModelView here
    gl.drawArrays(gl.TRIANGLES, 0, searchLightPoints.length / 2);


// Render the poles

    gl.uniformMatrix4fv(umv, false, mvPoles.flatten());

    gl.bindBuffer(gl.ARRAY_BUFFER, wallBufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.drawArrays(gl.TRIANGLES, 0, wallPoints.length/2); // Render all wall points


}


