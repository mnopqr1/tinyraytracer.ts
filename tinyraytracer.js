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
// Material
// Light
var Sphere = /** @class */ (function () {
    function Sphere(c, r, m) {
        this.c = c;
        this.r = r;
        this.rsq = r * r;
        this.material = m;
        return this;
    }
    // checks for intersection between sphere and ray
    // returns either the smallest t such that ray.o + t * ray.d is on the sphere, or false if none such exists
    Sphere.prototype.intersection = function (ray) {
        var vPC = this.c.minus(ray.o); // from ray origin to sphere center
        var b = vPC.dot(ray.d); // time b such that ray.o + t * ray.d is the projection of this.c onto the ray
        var Ls = vPC.lengthsq();
        if (b < 0) { // is sphere center behind ray origin?
            if (Ls <= this.rsq) { // check if ray origin is inside the sphere
                return false; // TODO for now we just don't draw the sphere if we're inside		
            }
            else {
                return false;
            }
        }
        else {
            var D = b * b + this.rsq - Ls; // discriminant = b^2 + r^2 - L^2
            if (D < 0) {
                return false;
            }
            else {
                var sqD = Math.sqrt(D);
                var t1 = b - sqD;
                var t2 = b + sqD;
                if (ray.atTime(t1).distancesq(ray.o) < ray.atTime(t2).distancesq(ray.o)) {
                    return t1;
                }
                else {
                    return t2;
                }
            }
        }
    };
    return Sphere;
}());
var Material = /** @class */ (function () {
    function Material(color) {
        this.color = color;
        return this;
    }
    return Material;
}());
var Light = /** @class */ (function () {
    function Light(position, direction, intensity) {
        this.position = position;
        this.direction = direction;
        this.intensity = intensity;
        return this;
    }
    return Light;
}());
var PointLight = /** @class */ (function (_super) {
    __extends(PointLight, _super);
    function PointLight(position, intensity) {
        var _this = _super.call(this, position, null, intensity) || this;
        return _this;
    }
    return PointLight;
}(Light));
var AmbientLight = /** @class */ (function (_super) {
    __extends(AmbientLight, _super);
    function AmbientLight(intensity) {
        var _this = _super.call(this, null, null, intensity) || this;
        return _this;
    }
    return AmbientLight;
}(Light));
var DirectionalLight = /** @class */ (function (_super) {
    __extends(DirectionalLight, _super);
    function DirectionalLight(direction, intensity) {
        var _this = _super.call(this, null, direction, intensity) || this;
        return _this;
    }
    return DirectionalLight;
}(Light));
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
    function Ray(o, d) {
        this.o = o;
        this.d = d;
        return this;
    }
    Ray.prototype.atTime = function (t) {
        return this.o.translate(this.d.scale(t));
    };
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
    Color.prototype.scale = function (i) {
        return new Color(this.r * i, this.g * i, this.b * i);
    };
    return Color;
}());
/********************* RENDERING FUNCTION ***************/
function render(scene) {
    var cwidth = canvas.width;
    var cheight = canvas.height;
    var vwidth = scene.camera.viewport.w;
    var vheight = scene.camera.viewport.h;
    var canvToViewport = new Pt2(vwidth / (cwidth), vheight / (cheight));
    var campos = scene.camera.position;
    for (var y = -cheight / 2; y < cheight / 2; y++) {
        for (var x = -cwidth / 2; x < cwidth / 2; x++) {
            var c = new Pt2(x, y); // point on canvas
            var p = c.pmult(canvToViewport); // corresponding point on viewport
            var pvc = new Pt3(p.x - scene.camera.viewport.c.x, p.y - scene.camera.viewport.c.y, 0); // from viewport center to point
            var dir = scene.camera.direction.plus(pvc).normalize();
            var col = castRay(new Ray(campos, dir), scene);
            // if (y == 0 && x == cwidth/2 - 1) { console.log(p); console.log(dir); console.log(col); }
            putPixel(c, col);
        }
    }
}
function castRay(ray, scene) {
    var min_t = Infinity;
    var hit_sphere = null;
    for (var _i = 0, _a = scene.spheres; _i < _a.length; _i++) {
        var s = _a[_i];
        var t = s.intersection(ray);
        if (t && t < min_t) {
            min_t = t;
            hit_sphere = s;
        }
    }
    if (hit_sphere === null) {
        return scene.bgcolor; // return background color if no intersection found
    }
    else {
        var intersectionPoint = ray.o.translate(ray.d.scale(min_t));
        var lightIntensityAtPoint = 0;
        for (var _b = 0, _c = scene.lights; _b < _c.length; _b++) {
            var l = _c[_b];
            if (l.constructor.name === "AmbientLight") {
                lightIntensityAtPoint += l.intensity;
            }
            else { // point light or directional light
                var lightDirection = null;
                if (l.constructor.name === "PointLight") {
                    lightDirection = l.position.minus(intersectionPoint).normalize();
                }
                else {
                    lightDirection = l.direction;
                }
                var normalAtIntersection = intersectionPoint.minus(hit_sphere.c).normalize();
                lightIntensityAtPoint += l.intensity * Math.max(0, lightDirection.dot(normalAtIntersection));
            }
        }
        return hit_sphere.material.color.scale(lightIntensityAtPoint);
    }
}
/************* EXAMPLE CAMERA AND SCENE SETUP ***************/
var camera = new Camera(new Pt3(0, 0, 0), new Vec3(0, 0, 1), 1, 1);
var red = new Material(new Color(1, 0, 0));
var green = new Material(new Color(0, 1, 0));
var blue = new Material(new Color(0, 0, 1));
var yellow = new Material(new Color(1, 1, 0));
var scene = {
    camera: camera,
    spheres: [
        new Sphere(new Pt3(0, -1, 3), 1, red),
        new Sphere(new Pt3(2, 0, 4), 1, blue),
        new Sphere(new Pt3(-2, 0, 4), 1, green),
        new Sphere(new Pt3(0, -5001, 0), 5000, yellow)
        //	new Sphere(new Pt3(-3,0,11), 2, red),
        //      new Sphere(new Pt3(-1,-1.5,12), 2, red),
        //      new Sphere(new Pt3(1.5, 0.5, 11), 3, green),
        //	new Sphere(new Pt3(7, 5, 11), 4, green),
    ],
    bgcolor: new Color(0.2, 0.7, 0.8),
    lights: [
        new PointLight(new Pt3(2, 1, 0), 0.6),
        new AmbientLight(0.2),
        new DirectionalLight(new Vec3n(1, 4, 4), 0.2)
    ]
};
/********************* ENTRY POINT **********************/
function main() {
    render(scene);
    updateCanvas();
}
main();
