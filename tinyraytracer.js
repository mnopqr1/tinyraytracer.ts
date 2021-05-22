var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
/******************** SCENE AND CAMERA *********************/
var Scene = /** @class */ (function () {
    function Scene(camera, spheres, bgcolor) {
        this.camera = camera;
        this.spheres = spheres;
        this.bgcolor = bgcolor;
        return this;
    }
    return Scene;
}());
var Camera = /** @class */ (function () {
    function Camera(position, direction, vw, vh) {
        this.position = position;
        this.direction = direction;
        // given viewport width and height, position viewport in correct direction in front of camera
        this.viewport = new Rectangle(position.translate(direction), direction, vw, vh);
        return this;
    }
    return Camera;
}());
/********************* SCENE OBJECTS **************************/
// Sphere
var Sphere = /** @class */ (function () {
    function Sphere(c, r, m) {
        this.c = c;
        this.r = r;
        this.rsq = r * r;
        this.material = m;
        return this;
    }
    // checks for intersection between sphere and ray
    Sphere.prototype.intersects = function (ray) {
        var vpc = this.c.minus(ray.p); // from ray origin to sphere center
        if (vpc.dot(ray.d) < 0) { // is sphere center behind ray origin?
            return (vpc.lengthsq() <= this.rsq); // check if ray origin is inside the sphere
        }
        else {
            var vProjected = vpc.projectOn(ray); // find the projection onto the ray
            return (this.c.distancesq(vProjected) <= this.rsq);
        }
    };
    return Sphere;
}());
var Material = /** @class */ (function () {
    function Material(color) {
        this.color = color;
    }
    return Material;
}());
/********************* INTERNAL TYPES *************/
// Pt2: two-dimensional point
// Pt3: three-dimensional point
// Vec3: three-dimensional vector
// Ray: a ray (in 3D)
// Color: RGB color
// Rectangle: a rectangle (in 3D space)
// a two-dimensional point is a pair of integers
// x is between -canvas.width / 2 and +canvas.width / 2
// y is between -canvas.height / 2 and +canvas.height / 2
var Pt2 = /** @class */ (function () {
    function Pt2(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    Pt2.prototype.pmult = function (p) {
        return new Pt2(this.x * p.x, this.y * p.y);
    };
    return Pt2;
}());
var Pt3 = /** @class */ (function () {
    function Pt3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    Pt3.prototype.minus = function (p) {
        return new Vec3(this.x - p.x, this.y - p.y, this.z - p.z);
    };
    Pt3.prototype.distancesq = function (p) {
        return Math.pow((this.x - p.x), 2) + Math.pow((this.y - p.y), 2) + Math.pow((this.z - p.z), 2);
    };
    Pt3.prototype.translate = function (v) {
        return new Pt3(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    return Pt3;
}());
var Vec3 = /** @class */ (function () {
    function Vec3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    Vec3.prototype.plus = function (v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    };
    Vec3.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    };
    Vec3.prototype.lengthsq = function () {
        return this.dot(this);
    };
    Vec3.prototype.length = function () {
        return Math.sqrt(this.lengthsq());
    };
    Vec3.prototype.normalize = function () {
        return new Vec3n(this.x, this.y, this.z);
    };
    Vec3.prototype.projectOn = function (r) {
        var dScaled = r.d.scale(this.dot(r.d));
        return r.p.translate(dScaled);
    };
    Vec3.prototype.scale = function (r) {
        return new Vec3(r * this.x, r * this.y, r * this.z);
    };
    return Vec3;
}());
// a normalized vector, i.e., length 1
var Vec3n = /** @class */ (function (_super) {
    __extends(Vec3n, _super);
    function Vec3n(x, y, z) {
        var _this = _super.call(this, x, y, z) || this;
        var l = Math.sqrt(x * x + y * y + z * z);
        if (l === 0) {
            return _this;
        }
        if (l != 1) {
            _this.x /= l;
            _this.y /= l;
            _this.z /= l;
        }
        return _this;
    }
    Vec3n.prototype.lengthsq = function () {
        return 1;
    };
    Vec3n.prototype.length = function () {
        return 1;
    };
    return Vec3n;
}(Vec3));
var Ray = /** @class */ (function () {
    function Ray(p, d) {
        this.p = p;
        this.d = d;
        return this;
    }
    return Ray;
}());
// Rectangle in 3D space:
// center at a point c
// normal vector in direction n
// width w and height h
var Rectangle = /** @class */ (function () {
    function Rectangle(c, n, w, h) {
        this.c = c;
        this.n = n;
        this.w = w;
        this.h = h;
        return this;
    }
    return Rectangle;
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
function render(scene) {
    var cwidth = canvas.width;
    var cheight = canvas.height;
    var vwidth = scene.camera.viewport.w;
    var vheight = scene.camera.viewport.h;
    var canvToViewport = new Pt2(vwidth / (2 * cwidth), vheight / (2 * cheight));
    var campos = scene.camera.position;
    for (var y = -cheight / 2; y < cheight / 2; y++) {
        for (var x = -cwidth / 2; x < cwidth / 2; x++) {
            var c = new Pt2(x, y); // point on canvas
            var p = c.pmult(canvToViewport); // corresponding point on viewport
            var pvc = new Pt3(p.x - scene.camera.viewport.c.x, p.y - scene.camera.viewport.c.y, 0); // from viewport center to point
            var dir = scene.camera.direction.plus(pvc).normalize();
            var col = castRay(new Ray(campos, dir), scene.spheres, scene.bgcolor);
            // if (y == 0 && x == cwidth/2 - 1) { console.log(p); console.log(dir); console.log(col); }
            putPixel(c, col);
        }
    }
}
function castRay(ray, spheres, bg) {
    for (var _i = 0, spheres_1 = spheres; _i < spheres_1.length; _i++) {
        var s = spheres_1[_i];
        if (s.intersects(ray)) {
            return s.material.color;
        }
    }
    return bg; // return background color if no intersection found
}
/************* EXAMPLE CAMERA AND SCENE SETUP ***************/
var camera = new Camera(new Pt3(0, 0, -1), new Vec3(0, 0, 1), 3, 3);
var red = new Material(new Color(1, 0, 0));
var green = new Material(new Color(0, 1, 0));
var scene = new Scene(camera, [new Sphere(new Pt3(-3, 0, 16), 2, red),
    new Sphere(new Pt3(-1, -1.5, 12), 2, red),
    new Sphere(new Pt3(1.5, 0.5, 18), 3, green),
    new Sphere(new Pt3(7, 5, 18), 4, green)], new Color(0.2, 0.7, 0.8));
/********************* ENTRY POINT **********************/
function main() {
    render(scene);
    updateCanvas();
}
main();
