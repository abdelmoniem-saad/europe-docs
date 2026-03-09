/*
  Open-Source Europe — Image Fallback Handler

  Any <img> with data-fallback attribute will automatically show
  the fallback image (thebase.jpg) if the original src fails to load.

  Usage:
    <img src="assets/malmo/turning-torso.jpg"
         data-fallback="../../assets/thebase.jpg"
         alt="Turning Torso">
*/

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    img.addEventListener("error", function () {
      if (!this.dataset.fellback) {
        this.dataset.fellback = "true";
        this.src = this.dataset.fallback;
      }
    });

    /* Also handle images that may have already errored before JS loaded */
    if (img.complete && img.naturalWidth === 0) {
      if (!img.dataset.fellback) {
        img.dataset.fellback = "true";
        img.src = img.dataset.fallback;
      }
    }
  });
});
