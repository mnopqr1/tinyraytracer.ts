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
var canvas = document.querySelector('#the-canvas');
var canvas_buffer = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
function putPixel(v, color) {
    // convert x, y coordinates with origin in middle to
    // canvas coordinates with origin in lower left corner
    var px = canvas.width / 2 + v.x;
    var py = canvas.height / 2 - v.y - 1;
    if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
        return;
    }
    // find the address of this pixel in the buffer
    // and set colors
    var offset = 4 * px + 4 * canvas_buffer.width * py;
    canvas_buffer.data[offset++] = 255 * color.r;
    canvas_buffer.data[offset++] = 255 * color.g;
    canvas_buffer.data[offset++] = 255 * color.b;
    canvas_buffer.data[offset++] = 255; // alpha is always 255
}
function updateCanvas() {
    canvas.getContext('2d').putImageData(canvas_buffer, 0, 0);
}
/********************* SCENE TYPES **************************/
// Sphere
var Sphere = /** @class */ (function () {
    function Sphere(c, r) {
        this.c = c;
        this.r = r;
        return this;
    }
    return Sphere;
}());
/********************* INTERNAL TYPES *************/
// Pt2: two-dimensional point
// Pt3: three-dimensional point
// Color: RGB color
// a two-dimensional point is a pair of integers
// x is between -canvas.width / 2 and +canvas.width / 2
// y is between -canvas.height / 2 and +canvas.height / 2
var Pt2 = /** @class */ (function () {
    function Pt2(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    return Pt2;
}());
var Pt3 = /** @class */ (function () {
    function Pt3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    return Pt3;
}());
// a color is a tuple of 3 floats between 0 and 1
var Color = /** @class */ (function () {
    function Color(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }
    return Color;
}());
/********************* RENDERING FUNCTION ***************/
function render() {
    var width = canvas.width;
    var height = canvas.height;
    for (var y = -height / 2; y < height / 2; y++) {
        for (var x = -width / 2; x < width / 2; x++) {
            putPixel(new Pt2(x, y), new Color((height / 2 - y) / height, (x + width / 2) / width, 0));
        }
    }
}
/********************* ENTRY POINT **********************/
function main() {
    render();
    updateCanvas();
}
main();
