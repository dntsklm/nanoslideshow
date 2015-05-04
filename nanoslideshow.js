// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later
/*
 * nanoslideshow - small HTML5 slide show
 *
 * Copyright © 2014-2015 Donatas Klimašauskas
 *
 * This file is part of nanoslideshow.
 *
 * nanoslideshow is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * nanoslideshow is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with nanoslideshow.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

var nanoslideshowconfiguration;

//DEV//
/*
//DEV//
(function(){
//DEV//
*/
//DEV//
var NSSC = nanoslideshowconfiguration;
var SLIDE_SHOW_NAME = "nanoslideshow";
var SECOND = 1e3;
var SLIDE_FULL = 100;
var SLIDE_WIDTH_CENTER = NSSC.WIDTH / 2;
var SLIDE_HEIGHT_CENTER = NSSC.HEIGHT / 2;
var FRAME_INTERVAL = SECOND / NSSC.ANIMATION_FPS;
var FRAME_CNT = NSSC.ANIMATION_TIME * NSSC.ANIMATION_FPS;
var ANIMATION_STEP = SLIDE_FULL / get_int_denominator(SLIDE_FULL, FRAME_CNT);
var AUTO_PLAY_INTERVAL = NSSC.AUTO_PLAY_INTERVAL * SECOND;
var SIDE_LEFT = "left";
var SIDE_RIGHT = "right";
var SELECTORS_LEFT_TOP = 0;
var SELECTORS_RIGHT_TOP = 1;
var SELECTORS_RIGHT_BOTTOM = 2;
var SELECTORS_LEFT_BOTTOM = 3;

var nanoslideshow;
var left;
var right;
var gauge;
var display;
var slidesloaded = 0;
var slidesoffset = 0;
var timeidautoplay;
var timeiddrawframe;
var direction;
var slides = [];
var slidelast = 1;
var slideinview = 1;
var forward;

function id_(id)
{
    return document.getElementById(id);
}

//DEV//
function log(msg)
{
    console.log(SLIDE_SHOW_NAME + ": " + msg);
}
//DEV//
// return denominator which produces no fraction for numerator division
function get_int_denominator(numerator, denominator)
{
    if (numerator % 1 || numerator < denominator)
	throw Error("numerator == " + numerator + " denominator == " +
		    denominator);
    denominator = Math.floor(denominator);
    while (numerator % denominator)
	denominator++;
    return denominator > 0 ? denominator : 1;
}

function fit_slide(slide)
{
    var ratio = slide.width / slide.height;

    //DEV//
    log("fitted for " + NSSC.WIDTH + "x" + NSSC.HEIGHT + ": " +
	slide.src.match(/[\d\w\.]+$/)[0] + " " + slide.width + "x" +
	slide.height);
    //DEV//
    if (ratio > 1) {
	slide.width = NSSC.WIDTH;
	slide.height = NSSC.WIDTH / ratio;
    } else {
	slide.width = NSSC.HEIGHT * ratio;
	slide.height = NSSC.HEIGHT;
    }
}

function center_slide(slide, position)
{
    slide.style.left = ((SLIDE_WIDTH_CENTER - slide.width / 2) + position *
			NSSC.WIDTH) + "px";
    slide.style.top = (SLIDE_HEIGHT_CENTER - slide.height / 2) + "px";
}

function prepare_slides()
{
    for (var i = 0; i < slidesloaded; i++) {
	if (slides[i].width > NSSC.WIDTH || slides[i].height > NSSC.HEIGHT ||
	    NSSC.FIT_SMALLER)
	    fit_slide(slides[i]);
	if (slides[i].width < NSSC.WIDTH || slides[i].height < NSSC.HEIGHT)
	    center_slide(slides[i], i);
	else
	    slides[i].style.left = i * NSSC.WIDTH + "px";
    }
    display.style.visibility = "visible";
    if (slidesloaded > 1) {
	timeidautoplay = setInterval(play_auto, AUTO_PLAY_INTERVAL);
	right.style.visibility = "visible";
	gauge.style.visibility = "visible";
	//DEV//
	log("auto-play: started (every " + NSSC.AUTO_PLAY_INTERVAL + " s)");
	//DEV//
    }
}

function handle_slide_loaded()
{
    slidesloaded++;
    if (slidesloaded === NSSC.SLIDES.length)
	prepare_slides();
}

function draw_frame()
{
    slidesoffset += ANIMATION_STEP * direction;
    display.style.left = slidesoffset + "%";
    if (!(slidesoffset % SLIDE_FULL)) {
	slidelast = slideinview;
	clearInterval(timeiddrawframe);
    }
    //DEV//
    log("slidesoffset == " + slidesoffset + "%");
    //DEV//
}

function move_slide(event)
{
    var id;

    if (slideinview !== slidelast)
	return;
    if (event.target)
	id = event.target.id;
    else
	id = event;
    if (id.match(SIDE_RIGHT)) {
	direction = -1;
	slideinview++;
	if (slideinview === slidesloaded)
	    right.style.visibility = "hidden";
	left.style.visibility = "visible";
    } else {
	direction = 1;
	slideinview--;
	if (slideinview === 1)
	    left.style.visibility = "hidden";
	right.style.visibility = "visible";
    }
    if (ANIMATION_STEP === SLIDE_FULL)
	draw_frame();
    else
	timeiddrawframe = setInterval(draw_frame, FRAME_INTERVAL);
    gauge.innerHTML = slideinview;
    //DEV//
    log("slideinview == " + NSSC.SLIDES[slideinview - 1]);
    //DEV//
}

function play_auto()
{
    if (slideinview === slidesloaded)
	forward = 0;
    else if (slideinview === 1)
	forward = 1;
    if (forward)
	move_slide(SIDE_RIGHT);
    else
	move_slide(SIDE_LEFT);
}

function stop_auto_play()
{
    clearInterval(timeidautoplay);
    left.removeEventListener("click", stop_auto_play, false);
    right.removeEventListener("click", stop_auto_play, false);
    //DEV//
    log("auto-play: stopped");
    //DEV//
}

function set_selectors()
{
    var selectorsclass = SLIDE_SHOW_NAME + "selectors";

    left = document.createElement("div");
    right = document.createElement("div");
    gauge = document.createElement("div");
    left.id = SLIDE_SHOW_NAME + SIDE_LEFT;
    right.id = SLIDE_SHOW_NAME + SIDE_RIGHT;
    gauge.id = SLIDE_SHOW_NAME + "gauge";
    left.className = selectorsclass;
    right.className = selectorsclass;
    gauge.className = selectorsclass;
    left.innerHTML = "&lt;";
    right.innerHTML = "&gt;";
    gauge.innerHTML = "1";
    left.addEventListener("click", move_slide, false);
    right.addEventListener("click", move_slide, false);
    left.addEventListener("click", stop_auto_play, false);
    right.addEventListener("click", stop_auto_play, false);
}

function position_gauge(container)
{
    switch (NSSC.SELECTORS_POSITION) {
    case SELECTORS_LEFT_BOTTOM:
	container.style.bottom = "0";
    case SELECTORS_LEFT_TOP:
	container.appendChild(gauge);
	break;
    case SELECTORS_RIGHT_BOTTOM:
	container.style.bottom = "0";
    case SELECTORS_RIGHT_TOP:
	container.style.right = "0";
	container.insertBefore(gauge, container.firstChild);
	break;
    default:
	throw Error("SELECTORS_POSITION == " + NSSC.SELECTORS_POSITION);
    }
}

function load_slides_selectors()
{
    var slide;
    var slideid = SLIDE_SHOW_NAME + "slide";
    var slideclass = SLIDE_SHOW_NAME + "slides";
    var len = NSSC.SLIDES.length;
    var containerselectors = document.createElement("div");
    var containerdisplay = document.createDocumentFragment();

    display = document.createElement("div");
    display.id = SLIDE_SHOW_NAME + "display";
    for (var i = 0; i < len; i++) {
	slide = document.createElement("img");
	slide.id = slideid + i;
	slide.className = slideclass;
	slide.src = NSSC.SLIDES[i];
	slide.addEventListener("load", handle_slide_loaded, false);
	slides.push(slide);
	display.appendChild(slide);
    }
    containerselectors.id = SLIDE_SHOW_NAME + "selectorscontainer";
    containerselectors.appendChild(left);
    containerselectors.appendChild(right);
    position_gauge(containerselectors);
    containerdisplay.appendChild(display);
    containerdisplay.appendChild(containerselectors);
    nanoslideshow.appendChild(containerdisplay);
}

// set HTML elements in array to have CSS properties in object
function set_css(elements, properties)
{
    var len;

    if (!(elements instanceof Array && properties instanceof Object &&
	  !(properties instanceof Array)))
	throw Error("elements == " + elements + " properties == " +
		    properties);
    len = elements.length;
    for (var i = 0; i < len; i++)
	for (var property in properties)
	    elements[i].style[property] = properties[property];
}

function initialize()
{
    nanoslideshow = id_(SLIDE_SHOW_NAME);
    nanoslideshow.style.width = NSSC.WIDTH + "px";
    nanoslideshow.style.height = NSSC.HEIGHT + "px";
    set_selectors();
    if (NSSC.CSS) {
	if (NSSC.CSS.nanoslideshow)
	    set_css([
		nanoslideshow,
	    ], NSSC.CSS.nanoslideshow);
	if (NSSC.CSS.nanoslideshowselectors)
	    set_css([
		left,
		right,
		gauge,
	    ], NSSC.CSS.nanoslideshowselectors);
    }
    load_slides_selectors();
}

function print_old_browser()
{
    id_(SLIDE_SHOW_NAME).innerHTML = "Old browser detected. Please, upgrade.";
}

if (window.addEventListener)
    addEventListener("load", initialize, false);
else // IE8-
    attachEvent("onload", print_old_browser);
//DEV//
/*
//DEV//
})();
//DEV//
*/
//DEV//
// @license-end
