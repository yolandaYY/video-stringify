// ==UserScript==
// @name         video
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  video script
// @author       yolandayy
// @include      *
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const canvas = document.createElement("canvas");
    canvas.id = "canvas-canvas";
    canvas.style.visibility = "hidden";

    const temp = document.createElement("canvas");
    temp.id = "temp-temp";

    const closeElement = document.createElement("span");
    closeElement.innerText = "X";
    closeElement.id = "close-close";
    closeElement.onclick = close;
    closeElement.style.visibility = "hidden";

    document.body.appendChild(canvas);
    document.body.appendChild(temp);
    document.body.appendChild(closeElement);
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.innerHTML = "#canvas-canvas{position:fixed;top:0;left:0;background:#fff;z-index: 10000;}\n#temp-temp{display: none}#close-close{position: fixed;font-size: 18px;top: 0;right: 0;z-index: 10000;}";
    const context = canvas.getContext("2d");
    const tempCtx = temp.getContext("2d");
    var fontSize = 0;
    var video = null;

    function calc() {
        tempCtx.drawImage(video, 0, 0, temp.width, temp.height);
        const picture = new Picture(tempCtx.getImageData(0, 0, temp.width, temp.height))
        return picture.toStringArr();
    }
    function drawImage() {
        const imageData = calc();
        context.clearRect(0, 0, innerWidth, innerHeight);
        imageData.forEach((it, idx) => {
            context.fillText(it, 0, idx * fontSize);
        })
        if (!video.ended) {
            window.setTimeout(drawImage, 0);
        }
    }

    function initCanvas(e) {
        const size = video.getBoundingClientRect();
        const width = Math.floor(size.width);
        const height = Math.floor(size.height);
        temp.width = width * 0.2;
        temp.height = height * 0.2;
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        canvas.style.visibility = "visible";
        closeElement.style.visibility = "visible";
        window.setTimeout(drawImage, 0);
        const dataArr = calc();
        fontSize = Math.ceil(width / dataArr[0].length) * 2;
        context.font = fontSize + "px monospace";
    }

    const timeID = window.setInterval(function () {
        video = document.getElementsByTagName("video")[0];
        if (video) {
            window.clearInterval(timeID);
            video.addEventListener("playing", initCanvas);
        }
    }, 1000);

    function close() {
        window.clearTimeout(drawImage);
        canvas.style.visibility = "hidden";
        closeElement.style.visibility = "hidden";
    }

    function RGBA(r, g, b, a) {
        this.rgba = [r, g, b, a];
        this.gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
        if (a == 0) this.gray = 255;
        this._index = -1;
    }
    RGBA.prototype.add = function (rgbaObj) {
        return new RGBA(...this.rgba.map((color, i) => {
            return color + rgbaObj.rgba[i];
        }));
    }
    RGBA.prototype.average = function (num) {
        return new RGBA(...this.rgba.map((color, i) => {
            return Math.floor(color / num);
        }));
    }
    RGBA.prototype.pushTo = function (container, startIndex) {
        for (let i = 0; i < 4; ++i) {
            container[startIndex + i] = this.rgba[i];
        }
    }
    function getImageData(data, width, height) {
        const imageData = new ImageData(width, height);
        var index = 0;
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                data[r][c].pushTo(imageData.data, index);
                index += 4;
            }
        }
        return imageData;
    }
    function Picture(imageData) {
        this.data = [];
        this.width = imageData.width;
        this.height = imageData.height;
        this.originData = imageData;
        var index = 0;
        for (let r = 0; r < this.height; r++) {
            const arr = [];
            for (let c = 0; c < this.width; c++) {
                arr.push(
                    new RGBA(imageData.data[index++],
                        imageData.data[index++],
                        imageData.data[index++],
                        imageData.data[index++])
                );
            }
            this.data.push(arr);
        }
    }
    Picture.prototype.average = function (r, c, width, height) {
        let rgba = new RGBA(0, 0, 0, 0);
        for (let i = 0; i < height && r + i < this.height; i++) {
            for (let j = 0; j < width && c + j < this.width; j++) {
                rgba = this.data[r + i][c + j].add(rgba);
            }
        }
        return rgba.average(width * height);
    }
    Picture.prototype.getImageData = function () {
        const imageData = new ImageData(this.width, this.height);
        var index = 0;
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                this.data[r][c].pushTo(imageData.data, index);
                index += 4;
            }
        }
        return imageData;
    }
    Picture.prototype.compress = function (compressSize) {
        const data = [];
        for (let r = 0; r < this.height; r += compressSize) {
            const arr = [];
            for (let c = 0; c < this.width; c += compressSize) {
                arr.push(this.average(r, c, compressSize, compressSize));
            }
            data.push(arr);
        }
        return getImageData(data, Math.floor(this.width / compressSize), Math.floor(this.height / compressSize));
    }
    Picture.prototype.toStringArr = function () {
        const map = "@%M&8$OACL1!-:; ";
        const unit = 256 / map.length;
        var data = [];
        for (let r = 0; r < this.height; r++) {
            let str = ''
            for (let c = 0; c < this.width; c++) {
                str += map[Math.floor(this.data[r][c].gray / unit)] + " ";
            }
            data.push(str);
        }
        return data;
    }

})();