/** Tiny raytracer on a train 
 Following https://github.com/ssloy/tinyraytracer/wiki/
**/





/***************** INTERFACE WITH HTML ****************/
// putPixel
// updateCanvas

/** this part of the code is strongly based on 
Gabriel Gambetta's Computer Graphics from Scratch
https://gabrielgambetta.com/computer-graphics-from-scratch/demos/raytracer-01.html 
*/

// get the canvas element and its image data from the html document
// every pixel is encoded as four numbers between 0 and 255: red, green, blue, alpha
let canvas = document.querySelector('#the-canvas') as HTMLCanvasElement;
let canvas_buffer = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

function putPixel(v: Pt2, color: Color) : void {
    // convert x, y coordinates with origin in middle to
    // canvas coordinates with origin in lower left corner
  let px = canvas.width / 2 + v.x;
  let py = canvas.height / 2 - v.y - 1;
  if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
    return;
  }
    // find the address of this pixel in the buffer
    // and set colors
  let offset = 4 * px + 4 * canvas_buffer.width * py;
  canvas_buffer.data[offset++] = 255 * color.r;
  canvas_buffer.data[offset++] = 255 * color.g;
  canvas_buffer.data[offset++] = 255 * color.b;
  canvas_buffer.data[offset++] = 255;    // alpha is always 255
}

function updateCanvas() {
  canvas.getContext('2d').putImageData(canvas_buffer, 0, 0);
}


/********************* SCENE TYPES **************************/
// Sphere


class Sphere {
    c : Pt3;    // center
    r : number; // radius
    constructor(c : Pt3, r : number) {
	this.c = c;
	this.r = r;
	return this;
    }
    
}
/********************* INTERNAL TYPES *************/
// Pt2: two-dimensional point
// Pt3: three-dimensional point
// Color: RGB color

// a two-dimensional point is a pair of integers
// x is between -canvas.width / 2 and +canvas.width / 2
// y is between -canvas.height / 2 and +canvas.height / 2
class Pt2 {
    x: number;
    y: number;
    constructor(x : number, y : number) {
	this.x = x;
	this.y = y;
	return this;
    }
}

class Pt3 {
    x : number;
    y : number;
    z : number;
    constructor(x : number, y : number, z : number) {
	this.x = x;
	this.y = y;
	this.z = z;
	return this;
    }
}

// a color is a tuple of 3 floats between 0 and 1
class Color {
    r: number;
    g: number;
    b: number;
    
    constructor(r,g,b) {
	this.r = r;
	this.g = g;
	this.b = b;
	return this;
    }
}



/********************* RENDERING FUNCTION ***************/
function render() {
    let width : number = canvas.width;
    let height : number = canvas.height;

    for (let y = -height/2; y < height/2; y++) {
	for (let x = -width/2; x < width/2; x++) {
	    putPixel(new Pt2(x,y),
		     new Color((height/2 - y) / height, (x + width/2) / width, 0) );
	}
    }
}


/********************* ENTRY POINT **********************/
function main() {
    render();
    updateCanvas();
}

main();
