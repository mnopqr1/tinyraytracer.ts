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
    function Camera(position, direction, zoom) {
        this.position = position;
        this.direction = direction;
        // given viewport width and height, position viewport in correct direction in front of camera
        this.viewport = new Rectangle(position.translate(direction), direction, zoom, zoom * canvas.height / canvas.width);
        return this;
    }
    return Camera;
}());
var Sphere = /** @class */ (function () {
    function Sphere(c, r, m) {
        this.c = c;
        this.r = r;
        this.rsq = r * r;
        this.material = m;
        return this;
    }
    // checks for intersection between sphere and ray
    // returns either the smallest t such that ray.o + t * ray.d is on the sphere, or null if none such exists
    Sphere.prototype.intersection = function (ray) {
        var L = this.c.minus(ray.o);
        var tca = L.dot(ray.d); // time such that ray.o + t * ray.d is the projection of this.c onto the ray
        var d2 = L.dot(L) - tca * tca;
        if (d2 > this.rsq)
            return null;
        var thc = Math.sqrt(this.rsq - d2);
        var t0 = tca - thc;
        var t1 = tca + thc;
        if (t0 < 0.001) {
            t0 = t1;
        }
        if (t1 < 0.001) {
            return null;
        }
        return t0;
    };
    return Sphere;
}());
var Checkerboard = /** @class */ (function () {
    function Checkerboard(h, c, w, d, m1, m2) {
        if (m1 === void 0) { m1 = new Material(new Color(.3, .3, .3)); }
        if (m2 === void 0) { m2 = new Material(new Color(.3, .2, .1)); }
        this.h = h;
        this.c = c;
        this.w = w;
        this.d = d;
        this.m1 = m1;
        this.m2 = m2;
        this.N = new Vec3n(0, 1, 0);
    }
    Checkerboard.prototype.intersection = function (ray) {
        if (Math.abs(ray.d.y) < 1e-3) {
            return null;
        } // ray with almost-zero y component
        var t = (this.h - ray.o.y) / ray.d.y;
        var p = ray.atTime(t);
        if (t > 0.001 && Math.abs(p.x - this.c.x) < this.w && Math.abs(p.z - this.c.z) < this.d) {
            return t;
        }
        return null;
    };
    Checkerboard.prototype.materialAt = function (p) {
        return Math.round(.5 * p.x + 1000) + Math.round(.5 * p.z) & 1 ? this.m1 : this.m2;
    };
    return Checkerboard;
}());
var standardAlbedo = { diffuse: 1, specular: 1, reflection: 0, refraction: 0 };
var standardSpecexp = 50;
var standardRefrind = 1.0;
var Material = /** @class */ (function () {
    function Material(color, albedo, specExp, refrInd) {
        if (albedo === void 0) { albedo = standardAlbedo; }
        if (specExp === void 0) { specExp = standardSpecexp; }
        if (refrInd === void 0) { refrInd = standardRefrind; }
        this.color = color;
        this.albedo = albedo;
        this.specExp = specExp;
        this.refrInd = refrInd;
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
    Vec3.prototype.reflect = function (n) {
        return this.plus(n.scale(-2 * this.dot(n)));
    };
    Vec3.prototype.refract = function (n, etaOut, etaIn) {
        if (etaIn === void 0) { etaIn = 1; }
        var cosIn = -1 * Math.max(-1, Math.min(this.dot(n), 1));
        if (cosIn < 0) {
            return this.refract(n.scale(-1), etaIn, etaOut);
        }
        ;
        var eta = etaIn / etaOut;
        var cosOutSquared = 1 - eta * eta * (1 - cosIn * cosIn);
        return cosOutSquared < 0 ?
            new Vec3n(1, 0, 0) :
            this.scale(eta).plus(n.scale(eta * cosIn - Math.sqrt(cosOutSquared))).normalize();
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
    Color.prototype.plus = function (c) {
        return new Color(this.r + c.r, this.g + c.g, this.b + c.b);
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
            var col = castRay(new Ray(campos, dir), scene, scene.reflection_depth);
            // if (y == 0 && x == cwidth/2 - 1) { console.log(p); console.log(dir); console.log(col); }
            putPixel(c, col);
        }
    }
}
var WHITE = new Color(1, 1, 1);
function castRay(ray, scene, depth) {
    if (depth === void 0) { depth = 0; }
    // end recursion
    if (depth < 0) {
        return scene.bgcolor;
    }
    var hit = scene_intersect(ray, scene);
    if (hit == null) {
        return scene.bgcolor; // return background color if no intersection found
    }
    var lightsAtPoint = computeLights(hit, scene, ray, depth);
    return hit.material.color.scale(lightsAtPoint.diffuse * hit.material.albedo.diffuse).plus(WHITE.scale(lightsAtPoint.specular * hit.material.albedo.specular)).plus(lightsAtPoint.reflect.scale(hit.material.albedo.reflection)).plus(lightsAtPoint.refract.scale(hit.material.albedo.refraction));
}
function scene_intersect(ray, scene) {
    var tMin = Infinity;
    var hitObstacle = null;
    for (var i = 0; i < scene.obstacles.length; i++) {
        var s = scene.obstacles[i];
        var t = s.intersection(ray);
        if (t && t < tMin) {
            tMin = t;
            hitObstacle = s;
        }
    }
    if (tMin === Infinity)
        return null;
    var hitPoint = ray.atTime(tMin);
    if (hitObstacle instanceof Sphere) {
        return {
            p: hitPoint,
            N: hitPoint.minus(hitObstacle.c).normalize(),
            material: hitObstacle.material
        };
    }
    if (hitObstacle instanceof Checkerboard) {
        return {
            p: hitPoint,
            N: hitObstacle.N,
            material: hitObstacle.materialAt(hitPoint)
        };
    }
}
function computeLights(hit, scene, ray, depth) {
    var diffuse = 0;
    var specular = 0;
    for (var _i = 0, _a = scene.lights; _i < _a.length; _i++) {
        var l = _a[_i];
        var lightDirection = null;
        if (l.constructor.name === "AmbientLight") {
            diffuse += l.intensity;
        }
        else { // point light or directional light
            if (l.constructor.name === "PointLight") {
                lightDirection = l.position.minus(hit.p).normalize(); // is this right?
            }
            if (l.constructor.name === "DirectionalLight") { // TODO not implemented (doesn't have position)
                lightDirection = l.direction;
            }
            var lightRay = new Ray(hit.p, lightDirection); // ray is coming from the hitpoint, not from the light source!
            // shadow check: does this light ray hit anything else before the hit point?
            var lightHit = scene_intersect(lightRay, scene);
            if (lightHit && lightHit.p.distancesq(hit.p) + 0.001 < l.position.distancesq(hit.p)) {
                continue;
            }
            else {
                diffuse += l.intensity * Math.max(0, lightDirection.dot(hit.N));
                var specBase = Math.max(0, lightDirection.reflect(hit.N).dot(ray.d));
                specular += Math.pow(specBase, hit.material.specExp) * l.intensity;
            }
        }
    }
    // compute reflected color
    var reflectDir = ray.d.reflect(hit.N);
    var reflect = castRay(new Ray(hit.p, reflectDir), scene, depth - 1);
    // compute refraction color
    var refractDir = ray.d.refract(hit.N, hit.material.refrInd);
    var refract = castRay(new Ray(hit.p, refractDir), scene, depth - 1);
    return { diffuse: diffuse, specular: specular, reflect: reflect, refract: refract };
}
/************* EXAMPLE SCENE SETUP ***************/
var red = new Material(new Color(1, 0, 0));
var green = new Material(new Color(0, 1, 0));
var blue = new Material(new Color(0, 0, 1));
var yellow = new Material(new Color(1, 1, 0));
// scene from graphics from scratch book
var sceneGFS = {
    camera: new Camera(new Pt3(0, 0, 0), new Vec3(0, 0, 1), 1.4),
    spheres: [
        new Sphere(new Pt3(0, -1, 3), 1, red),
        new Sphere(new Pt3(2, 0, 4), 1, blue),
        new Sphere(new Pt3(-2, 0, 4), 1, green),
        new Sphere(new Pt3(0, -5001, 0), 5000, yellow)
    ],
    bgcolor: new Color(0.2, 0.7, 0.8),
    lights: [
        new PointLight(new Pt3(2, 1, 0), 0.6),
        new AmbientLight(0.2),
        new DirectionalLight(new Vec3n(1, 4, 4), 0.2)
    ],
    reflection_depth: 0
};
// scene from Tiny Raytracer tutorial
// note: I changed the direction of camera to be positive, so z-coordinates are positive
var ivory = new Material(new Color(0.4, 0.4, 0.3), { diffuse: 0.6, specular: 0.3, reflection: 0.1, refraction: 0.0 }, 50, 1.0);
var red_rubber = new Material(new Color(0.3, 0.1, 0.1), { diffuse: 0.9, specular: 0.1, reflection: 0, refraction: 0.0 }, 10, 1.0);
var mirror = new Material(new Color(1, 1, 1), { diffuse: 0, specular: 10, reflection: 0.8, refraction: 0.0 }, 1425, 1.0);
var glass = new Material(new Color(0.6, 0.7, 0.8), { diffuse: 0, specular: 0.5, reflection: 0.1, refraction: 0.8 }, 125, 1.5);
var sceneTR = {
    camera: new Camera(new Pt3(0, 0, -2), new Vec3(0, 0, 1), 1),
    obstacles: [
        new Sphere(new Pt3(-3, 0, 16), 2, ivory),
        new Sphere(new Pt3(-1, -1.5, 12), 2, glass),
        new Sphere(new Pt3(1.5, -0.5, 18), 3, red_rubber),
        new Sphere(new Pt3(7, 5, 18), 4, mirror),
        new Checkerboard(-4, new Pt3(0, -4, 20), 10, 10)
    ],
    bgcolor: new Color(0.2, 0.7, 0.8),
    lights: [
        new PointLight(new Pt3(-20, 20, -20), 1.5),
        new PointLight(new Pt3(30, 50, 25), 1.8),
        new PointLight(new Pt3(30, 20, -30), 1.7),
    ],
    reflection_depth: 3
};
/********************* ENTRY POINT **********************/
function main() {
    render(sceneTR);
    updateCanvas();
}
main();
