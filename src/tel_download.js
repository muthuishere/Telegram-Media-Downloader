// ==UserScript==
// @name         Telegram Media Downloader
// @version      0.2
// @namespace    https://github.com/Neet-Nestor/Telegram-Media-Downloader
// @description  Used to download streaming videos on Telegram
// @author       Nestor Qin
// @license      GNU GPLv3
// @website      https://github.com/Neet-Nestor/Telegram-Media-Downloader
// @match        https://web.telegram.org/*
// @match        https://webk.telegram.org/
// @match        https://webz.telegram.org/
// @icon         https://img.icons8.com/color/452/telegram-app--v5.png
// @grant        none
// ==/UserScript==

(function () {
  const logger = {
    info: (message) => {
      console.log("[Tel Download] " + message);
    },
    error: (message) => {
      console.error("[Tel Download] " + message);
    },
  };

  const contentRangeRegex = /^bytes (\d+)-(\d+)\/(\d+)$/;

  const tel_download_video = (url) => {
    let _blobs = [];
    let _next_offset = 0;
    let _total_size = null;
    let _file_extension = "mp4";

    const fetchNextPart = () => {
      fetch(url, {
        method: "GET",
        headers: {
          Range: `bytes=${_next_offset}-`,
        },
      })
        .then((res) => {
          logger.info("get response ", res);
          if (res.status !== 206) {
            logger.error("Non 206 response was received: " + res.status);
            return;
          }

          const mime = res.headers.get("Content-Type").split(";")[0];
          if (!mime.startsWith("video/")) {
            logger.error("Get non video response with MIME type " + mime);
            throw "Get non video response with MIME type " + mime;
          }
          _file_extension = mime.split("/")[1];

          const match = res.headers
            .get("Content-Range")
            .match(contentRangeRegex);

          const startOffset = parseInt(match[1]);
          const endOffset = parseInt(match[2]);
          const totalSize = parseInt(match[3]);

          if (startOffset !== _next_offset) {
            logger.error("Gap detected between responses.");
            logger.info("Last offset: " + _next_offset);
            logger.info("New start offset " + match[1]);
            throw "Gap detected between responses.";
          }
          if (_total_size && totalSize !== _total_size) {
            logger.error("Total size differs");
            throw "Total size differs";
          }

          _next_offset = endOffset + 1;
          _total_size = totalSize;

          logger.info(
            `Get response: ${res.headers.get(
              "Content-Length"
            )} bytes data from ${res.headers.get("Content-Range")}`
          );
          logger.info(
            `Progress: ${((_next_offset * 100) / _total_size).toFixed(0)}%`
          );
          return res.blob();
        })
        .then((resBlob) => {
          _blobs.push(resBlob);
        })
        .then(() => {
          if (_next_offset < _total_size) {
            fetchNextPart();
          } else {
            save();
          }
        })
        .catch((reason) => {
          logger.error(reason);
        });
    };

    const save = () => {
      logger.info("Finish downloading blobs");
      logger.info("Concatenating blobs and downloading...");

      const fileName =
        (Math.random() + 1).toString(36).substring(2, 10) +
        "." +
        _file_extension;

      const blob = new Blob(_blobs, { type: "video/mp4" });
      const blobUrl = window.URL.createObjectURL(blob);

      logger.info("Final blob size: " + blob.size + " bytes");

      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      logger.info("Download triggered");
    };

    fetchNextPart();
  };

  const tel_download_image = (imageUrl) => {
    const fileName =
      (Math.random() + 1).toString(36).substring(2, 10) + ".jpeg"; // assume jpeg

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = imageUrl;
    a.download = fileName;
    a.click();
    document.body.removeChild(a);

    logger.info("Download triggered");
  };

  logger.info("Initialized");

  // Copied and modified from Heroicons (https://heroicons.com/)
  const downloadIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" style="height:24px;width:24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>`;
  
  
function buildButtons(ele){

    if (!ele) return;



     if (ele.querySelector(".VideoPlayer")) {
  // remove download img button if there's any

  document
  .querySelectorAll("._tel_download_button_img_container")
  .forEach((e) => e.remove());

  // add download button to videos
  const controls = ele.querySelector(".VideoPlayerControls");
  const srcElement=ele.querySelector("video").querySelector("source")

  if(!srcElement)
  return
  
  const videoUrl = ele.querySelector("video").querySelector("source").src;

  if (controls && !controls.querySelector("._tel_download_button_video")) {
    const brControls = controls.querySelector(
      ".buttons"
    );
    const downloadButton = document.createElement("button");
    downloadButton.className =
      "btn-icon default__button _tel_download_button_video";
    downloadButton.innerHTML = downloadIcon;
    downloadButton.onclick = () => {
        
      tel_download_video(videoUrl);
    };
    brControls.prepend(downloadButton);
  }
} else if (!ele.querySelector("._tel_download_button_img")) {
  // add download button to images
    //console.log(ele.querySelector("img.is-protected"))
    if(ele.querySelector("img.is-protected") && ele.querySelector("img.is-protected").src){
  const imageUrl = ele.querySelector("img.is-protected").src;

  const container = document.createElement("div");
  container.className = "_tel_download_button_img_container";
  container.style.position = "absolute";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.alignItems = "end";
  const downloadButton = document.createElement("button");
  downloadButton.className =
    "btn-icon default__button _tel_download_button_img";
  downloadButton.innerHTML = downloadIcon;
  downloadButton.style.marginBottom = "16px";
  downloadButton.style.backgroundColor = "black";
          downloadButton.style.zIndex = "4500";
  downloadButton.onclick = (e) => {
    e.stopPropagation();
    tel_download_image(imageUrl);
  };
  ele.appendChild(container);
  container.appendChild(downloadButton);
}}

}
  
  
  function initializeAll(){
    
      const elems = document.querySelectorAll(
    ".MediaViewerContent"
  );
    for(let i=0;i<elems.length;i++)
    buildButtons(elems[i])
    
    setTimeout(()=>initializeAll(), 500);
  }

  initializeAll()
})();
