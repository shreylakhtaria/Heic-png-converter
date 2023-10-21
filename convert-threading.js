const fs = require("fs");
const path = require("path");
const convert = require("heic-convert");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

function convertHEICFileToPNG(heicFile, heicDir, pngDir) {
  const heicPath = path.join(heicDir, heicFile);
  const pngFileName = heicFile.replace(/\.heic$/i, ".png");
  const pngPath = path.join(pngDir, pngFileName);

  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const pngBuffer = await convert({
          buffer: fs.readFileSync(heicPath),
          format: "PNG",
        });

        fs.writeFileSync(pngPath, pngBuffer);
        console.log(`Converted: \t${heicPath} \tto \t${pngPath}`);
        resolve();
      } catch (error) {
        console.error(`Error converting: \t${heicPath}: \t${error}`);
        reject(error);
      }
    })();
  });
}

if (isMainThread) {
  const heicDirectory = path.win32.normalize("./heic");
  const pngDirectory = path.win32.normalize("./png");

  try {
    if (!fs.existsSync(heicDirectory)) {
      console.log(`${heicDirectory} does not exist!`);
      return;
    }

    if (!fs.existsSync(pngDirectory)) {
      fs.mkdirSync(pngDirectory);
    }

    const heicFiles = fs
      .readdirSync(heicDirectory)
      .filter(
        (heicFile) =>
          heicFile.toLowerCase().endsWith(".heic") &&
          !heicFile.toLowerCase().startsWith(".")
      );
    const numThreads = Math.min(require("os").cpus().length, heicFiles.length);

    const workerPromises = [];

    for (let i = 0; i < numThreads; i++) {
      if (heicFiles.length === 0) break;
      const heicFile = heicFiles.pop();
      workerPromises.push(
        new Promise((resolve, reject) => {
          const worker = new Worker(__filename, {
            workerData: {
              heicFile,
              heicDir: heicDirectory,
              pngDir: pngDirectory,
            },
          });
          worker.on("message", resolve);
          worker.on("error", reject);
          worker.on("exit", (code) => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        })
      );
    }

    Promise.all(workerPromises).then(() => {
      console.log("All conversions completed.");
    });
  } catch (error) {
    console.error("Error:", error);
  }
} else {
  convertHEICFileToPNG(
    workerData.heicFile,
    workerData.heicDir,
    workerData.pngDir
  ).then(() => {
    parentPort.postMessage({ status: "completed" });
  });
}
