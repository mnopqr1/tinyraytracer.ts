# A log of writing a raytracer on trains

## 22 May 2021, Nice - Paris
* 09:53 - train departure from Nice. Actually still writing an unrelated e-mail.

* 10:33 - decided to go with the tiny ray tracer of ssloy. Porting putPixel and canvas from the Gambetta book.

* 11:21 - finished step 1 in javascript, a nice gradient appears.

* 11:53 - decided to move to typescript - bit of hacking to get compiler to work in emacs. Procrastinating on the intersection method because there is some thinking involved.

* 12:22 - took a quick lunch break.

* 13:48 - ALMOST got step 2 to work, after a lot of struggles with vectors and viewports, but there's still a problem: the sphere shows up as ellipses.

* 14:10 - After a lot of thinking and experimenting, saw that non-centered spheres actually also shows up as an ellipse in the tutorial code, so maybe it's ok. Will now check with reference scene from tutorial to check that pictures match.

* 15:44 - Pictures matched, there is some light, but something is wrong with the sign of the direction in the calculation of the normal. Arriving in Paris.

## 26 May, Paris - Amsterdam
* 12:18 - train will leave from Paris in 4 minutes. Starting to look at the lighting code again.

* 12:51 - step 4 works! The calculation of the normal was indeed wrong: I was taking the ray direction but it needs to be the vector coming out of the hit sphere's origin to the intersection point. For testing, I went back to the more familiar scene from the graphics from scratch book.

* 13:10 - a bit of refactoring, adding the scene from the tiny raytracer tutorial, improve the handling of camera zoom. I'm back to liking this. On to step 5.

* 13:40 - specular light, understood the idea of "albedo" and refactored to compute lighting in separate function. Train is in Brussels.

* 14:31 - shadows! and we made it to antwerp. wrestled a bit with the tmin and tmax and how to make it work with directional light, but got it to work.

* 15:05 - reflections! but this is also the first time rendering starts to become a bit slow. Train in Rotterdam.

## 2 June, Amsterdam - Paris
* 15:39 - train left Amsterdam 24 minutes ago, I was writing something else, starting to look at where I was with the code.

* 17:19 - can't get refractions to work. There was a TODO in the ray sphere intersection that broke it but even after I fixed that it isn't working (in fact "fixing" that intersection code broke the reflections!). going to look at c++ reference code.

* 18:11 - finally, refractions are working!!! I decided to go for a major refactoring of the code following the C++ reference code. In particular I cleaned up the code for intersections considerable, I bet the bug was there. 

* 23:07 Worked on step 9 in the evening. It was working but I noticed that *no* shadows are rendered anymore since my step 8 refactoring. Will have to look at that another time.