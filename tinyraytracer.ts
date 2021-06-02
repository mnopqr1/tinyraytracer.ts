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



/******************** SCENE AND CAMERA *********************/

class Camera {
    position : Pt3;
    direction : Vec3;
    viewport : Rectangle;

    constructor(position, direction, zoom) {
	this.position = position;
	this.direction = direction;
	// given viewport width and height, position viewport in correct direction in front of camera
	this.viewport = new Rectangle(position.translate(direction), direction, zoom, zoom * canvas.height / canvas.width);
	return this;
    }
}


/********************* SCENE OBJECTS **************************/
// Sphere
// Material
// Light

interface Obstacle {
    intersection(ray : Ray) : number;
}

class Sphere implements Obstacle {
    c : Pt3;    // center
    r : number; // radius
    rsq : number; // radius squared
    material : Material;
    
    constructor(c : Pt3, r : number, m : Material) {
	this.c = c;
	this.r = r;
	this.rsq = r * r;
	this.material = m;
	return this;
    }

    // checks for intersection between sphere and ray
    // returns either the smallest t such that ray.o + t * ray.d is on the sphere, or null if none such exists

    intersection(ray : Ray) : number {
        let L : Vec3 = this.c.minus(ray.o);
        let tca : number = L.dot(ray.d);  // time such that ray.o + t * ray.d is the projection of this.c onto the ray
        let d2 : number = L.dot(L) - tca * tca;
        if (d2 > this.rsq) return null;
        let thc : number = Math.sqrt(this.rsq - d2);
        let t0 : number = tca - thc;
        let t1 : number = tca + thc;
        if (t0 < 0.001) { t0 = t1; }
        if (t1 < 0.001) { return null; }
        return t0;
    }
}

class Checkerboard implements Obstacle {
    h : number; // height of the plane, equation y = h.
    c : Pt3;    // location of the center of the plane (must have c.y = h)
    w : number; // width
    d : number; // depth
    N : Vec3n;
    m1 : Material;
    m2 : Material;

    constructor(h : number,
        c : Pt3, w : number, d : number,
        m1 : Material = new Material(new Color(.3, .3, .3)), 
        m2 : Material = new Material(new Color(.3, .2, .1))) { 
        this.h = h;
        this.c = c;
        this.w = w;
        this.d = d;
        this.m1 = m1;
        this.m2 = m2;
        this.N = new Vec3n(0,1,0);
    }

    intersection(ray : Ray) : number {
        if (Math.abs(ray.d.y) < 1e-3) { return null; } // ray with almost-zero y component
        let t = (this.h - ray.o.y) / ray.d.y; 
        let p : Pt3 = ray.atTime(t);
        if (t > 0.001 && Math.abs(p.x - this.c.x) < this.w && Math.abs(p.z - this.c.z) < this.d) { return t; }
        return null;
    }

    materialAt(p : Pt3) : Material {
        return Math.round(.5*p.x + 1000) + Math.round(.5*p.z) & 1 ? this.m1 : this.m2;
    }
}

let standardAlbedo = {diffuse : 1, specular : 1, reflection : 0, refraction : 0};
let standardSpecexp : number = 50;
let standardRefrind : number = 1.0;

class Material {
    color : Color;
    albedo : {diffuse : number, specular : number, reflection : number, refraction : number};
    specExp : number;
    refrInd : number;

    constructor(color : Color, 
        albedo = standardAlbedo, 
        specExp : number = standardSpecexp, 
        refrInd : number = standardRefrind) {
	this.color = color;
	this.albedo = albedo;
	this.specExp = specExp;
    this.refrInd = refrInd;
	return this;
    }
}

class Light {
    position : Pt3;
    direction : Vec3n;
    intensity : number;

    constructor(position : Pt3, direction : Vec3n, intensity : number) {
	this.position = position;
	this.direction = direction;
	this.intensity = intensity;
	return this;
    }
}

class PointLight extends Light {
    constructor(position : Pt3, intensity : number) {
	super(position, null, intensity);
	return this;
    }
}

class AmbientLight extends Light {
    constructor(intensity : number) {
	super(null, null, intensity);
	return this;
    }
}

class DirectionalLight extends Light {
    constructor(direction : Vec3n , intensity : number) {
	super(null, direction, intensity);
	return this;
    }
}   

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
class Pt2 {
    x: number;
    y: number;
    constructor(x : number, y : number) {
	this.x = x;
	this.y = y;
	return this;
    }

    pmult(p : Pt2) : Pt2 {
	return new Pt2(this.x * p.x, this.y * p.y);
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

    minus(p : (Pt3 | Vec3)) : Vec3 {
	return new Vec3(this.x - p.x, this.y - p.y, this.z - p.z);
    }

    distancesq(p : Pt3) : number {
	return (this.x - p.x) ** 2 + (this.y - p.y) ** 2 + (this.z - p.z) ** 2;
    }

    translate(v : Vec3) : Pt3 {
	return new Pt3(this.x + v.x, this.y + v.y, this.z + v.z);
    }
}

class Vec3 {
    x : number;
    y : number;
    z : number;
    
    constructor(x : number, y : number, z : number) {
	this.x = x;
	this.y = y;
	this.z = z;
	return this;
    }

    plus(v : (Pt3 | Vec3)) : Vec3 {
	return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    dot(v : Vec3) : number {
	return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    lengthsq() : number {
	return this.dot(this);
    }

    length() : number {
	return Math.sqrt(this.lengthsq());
    }

    normalize() : Vec3n {
	return new Vec3n(this.x,this.y,this.z);
    }

    reflect(n : Vec3n) : Vec3 {
	return this.plus(n.scale(-2 * this.dot(n)));
    }


    refract(n : Vec3n, etaOut : number, etaIn : number = 1) : Vec3 {
        let cosIn : number = -1 * Math.max(-1, Math.min(this.dot(n), 1));
        if (cosIn < 0) { return this.refract(n.scale(-1), etaIn, etaOut)};
        let eta : number = etaIn / etaOut;
        let cosOutSquared : number = 1 - eta * eta * (1 - cosIn * cosIn);
        return cosOutSquared < 0 ? 
            new Vec3n(1,0,0) : 
            this.scale(eta).plus(n.scale(eta * cosIn - Math.sqrt(cosOutSquared))).normalize()
    }

    scale(r : number) : Vec3 {
	return new Vec3(r * this.x, r * this.y, r * this.z);
    }

}

// a normalized vector, i.e., length 1
class Vec3n extends Vec3 {
    constructor(x : number, y : number, z : number) {
	super(x,y,z);
	let l = Math.sqrt(x * x + y * y + z * z);
	if (l === 0) { return this; }
	if (l != 1) {
	    this.x /= l;
	    this.y /= l;
	    this.z /= l;
	}
	return this;
    }

    lengthsq() : number {
	return 1;
    }
    
    length() : number {
	return 1;
    }
}

class Ray {
    o : Pt3;
    d : Vec3n;

    constructor(o, d) {
	this.o = o;
	this.d = d;
	return this;
    }

    atTime(t : number) {
	return this.o.translate(this.d.scale(t));
    }
}

// Rectangle in 3D space:
// center at a point c
// normal vector in direction n
// width w and height h
class Rectangle {
    c : Pt3;
    n : Vec3n;
    w : number;
    h : number;

    constructor(c, n, w, h) {
	this.c = c;
	this.n = n;
	this.w = w;
	this.h = h;
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

    scale(i : number) {
	return new Color(this.r * i, this.g * i, this.b * i);
    }

    plus(c : Color) {
	return new Color(this.r + c.r, this.g + c.g, this.b + c.b);
    }
}



/********************* RENDERING FUNCTION ***************/
function render(scene) {
    let cwidth : number = canvas.width;
    let cheight : number = canvas.height;
    let vwidth : number = scene.camera.viewport.w;
    let vheight : number = scene.camera.viewport.h;
    let canvToViewport : Pt2 = new Pt2(vwidth / (cwidth), vheight / (cheight));

    let campos : Pt3 = scene.camera.position;
   

    for (let y = -cheight/2; y < cheight/2; y++) {
	for (let x = -cwidth/2; x < cwidth/2; x++) {
	    let c = new Pt2(x,y) // point on canvas
	    let p = c.pmult(canvToViewport); // corresponding point on viewport
	    let pvc = new Pt3(p.x - scene.camera.viewport.c.x, p.y - scene.camera.viewport.c.y, 0); // from viewport center to point
	    let dir : Vec3n = scene.camera.direction.plus(pvc).normalize();
	    let col : Color = castRay(new Ray(campos, dir), scene, scene.reflection_depth);
	    // if (y == 0 && x == cwidth/2 - 1) { console.log(p); console.log(dir); console.log(col); }
	    putPixel(c, col);
	}
    }
}


let WHITE : Color = new Color(1,1,1);

function castRay(ray : Ray, scene, depth : number = 0) : Color {
    // end recursion
    if (depth < 0) {
	    return scene.bgcolor;
    }
    
    let hit : {p : Pt3, N : Vec3n, material : Material} = scene_intersect(ray, scene);
    
    if (hit == null) {
	    return scene.bgcolor; // return background color if no intersection found
    } 
    
    let lightsAtPoint : 
        { diffuse : number, specular : number, reflect : Color, refract : Color } = 
    computeLights(hit, scene, ray, depth);

    return hit.material.color.scale(
        lightsAtPoint.diffuse * hit.material.albedo.diffuse).plus(
            WHITE.scale(lightsAtPoint.specular * hit.material.albedo.specular)).plus(
                lightsAtPoint.reflect.scale(hit.material.albedo.reflection)).plus(
                    lightsAtPoint.refract.scale(hit.material.albedo.refraction)
                );

}




function scene_intersect(ray : Ray, scene) : {p : Pt3, N : Vec3n, material : Material} {
    let tMin : number = Infinity;
    let hitObstacle : Obstacle = null;
    for (let i = 0; i < scene.obstacles.length; i++) {
        let s : Obstacle = scene.obstacles[i];
        let t : number = s.intersection(ray);
        if (t && t < tMin) {
            tMin = t;
            hitObstacle = s;
        }
    }

    if (tMin === Infinity) return null;
    let hitPoint : Pt3 = ray.atTime(tMin);
    if (hitObstacle instanceof Sphere) {
        return {
            p : hitPoint,
            N : hitPoint.minus(hitObstacle.c).normalize(),
            material : hitObstacle.material
        }
    }

    if (hitObstacle instanceof Checkerboard) {
        return {
            p : hitPoint,
            N : hitObstacle.N,
            material : hitObstacle.materialAt(hitPoint)
        }
    }
}



function computeLights(hit : {p : Pt3, N : Vec3n, material : Material}, scene, ray : Ray, depth : number) : 
{diffuse : number, specular : number, reflect : Color, refract : Color} {

    let diffuse : number = 0;
    let specular : number = 0;
    
    for (var l of scene.lights) {
        let lightDirection : Vec3n = null;

        if (l.constructor.name === "AmbientLight") {
            diffuse += l.intensity;
        } else { // point light or directional light
        
            if (l.constructor.name === "PointLight") {
                lightDirection = l.position.minus(hit.p).normalize();
            } 
            
            if (l.constructor.name === "DirectionalLight") {
                lightDirection = l.direction;
            }

            let lightRay : Ray = new Ray(l.position, lightDirection);

            // shadow check: does this light ray hit anything else before the hit point?
            let lightHit = scene_intersect(lightRay, scene);
            
            if (lightHit && lightHit.p.distancesq(hit.p) < l.position.distancesq(hit.p)) { 
                continue; 
            } else {
                diffuse += l.intensity * Math.max(0, lightDirection.dot(hit.N));
                let specBase : number = Math.max(0, lightDirection.reflect(hit.N).dot(ray.d));
                specular += Math.pow(specBase, hit.material.specExp) * l.intensity;
            }
        }
    }

    // compute reflected color
    let reflectDir : Vec3n = ray.d.reflect(hit.N);
    let reflect : Color = castRay(new Ray(hit.p, reflectDir), scene, depth - 1);

    // compute refraction color
    let refractDir : Vec3n = ray.d.refract(hit.N, hit.material.refrInd); 
    let refract : Color = castRay(new Ray(hit.p, refractDir), scene, depth - 1);

    return {diffuse, specular, reflect, refract};
}


/************* EXAMPLE SCENE SETUP ***************/

let red : Material = new Material( new Color(1, 0, 0) );
let green : Material = new Material( new Color(0, 1, 0) );
let blue : Material = new Material( new Color(0, 0, 1) );
let yellow : Material = new Material ( new Color(1, 1, 0) );

// scene from graphics from scratch book
let sceneGFS = {
    camera : new Camera(
	new Pt3(0,0,0),
	new Vec3(0,0,1),
	1.4),
    spheres: [
	new Sphere(new Pt3(0,-1,3), 1, red),
	new Sphere(new Pt3(2, 0, 4), 1, blue),
	new Sphere(new Pt3(-2, 0, 4), 1, green),
	new Sphere(new Pt3(0, -5001, 0), 5000, yellow)
    ],
    bgcolor: new Color(0.2, 0.7, 0.8),
    lights: [
	new PointLight(new Pt3(2, 1, 0), 0.6),
	new AmbientLight(0.2),
	new DirectionalLight(new Vec3n(1,4,4), 0.2)
    ],
    reflection_depth: 0
};


// scene from Tiny Raytracer tutorial
// note: I changed the direction of camera to be positive, so z-coordinates are positive
let ivory : Material = new Material(
    new Color (0.4, 0.4, 0.3),
    { diffuse : 0.6, specular : 0.3, reflection : 0.1, refraction: 0.0},
    50,
    1.0
);

let red_rubber : Material = new Material(
    new Color (0.3, 0.1, 0.1),
    { diffuse : 0.9, specular : 0.1, reflection : 0, refraction: 0.0},
    10,
    1.0
);

let mirror : Material = new Material (
    new Color(1, 1, 1),
    { diffuse : 0, specular : 10, reflection : 0.8, refraction: 0.0},
    1425,
    1.0
);


let glass : Material = new Material (
    new Color(0.6, 0.7, 0.8),
    { diffuse: 0, specular : 0.5, reflection : 0.1, refraction: 0.8},
    125,
    1.5
)


let sceneTR = {
    camera : new Camera(
	new Pt3(0,0,0),
	new Vec3(0,0,1),
	1),
    obstacles: [
	    new Sphere(new Pt3(-3,0,16), 2, ivory),
	    new Sphere(new Pt3(-1, -1.5, 12), 2, glass),
	    new Sphere(new Pt3(1.5, -0.5, 18), 3, red_rubber),
    	new Sphere(new Pt3(7, 5, 18), 4, mirror),
        new Checkerboard(-4, new Pt3(0, -4, 20), 10, 10)
    ],
    bgcolor: new Color(0.2, 0.7, 0.8),
    lights: [
    	new PointLight(new Pt3(-20, 20,  -20), 1.5),
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
