const fs = require("fs");
const path = require("path");
const convert = require("heic-convert");
// const { promisify } = require("util");

// const readdir = promisify(fs.readdir);
// const writeFile = promisify(fs.writeFile);

async function convertHEICFilesToPNG(heicDir, pngDir) {
  try {
    if (!fs.existsSync(heicDir)) {
      console.log(`${heicDir} does not exist!`);
    }

    const heicFiles = fs.readdirSync(heicDir);

    if (!fs.existsSync(pngDir)) {
      fs.mkdirSync(pngDir);
    }

    for (const heicFile of heicFiles) {
      if (
        heicFile.toLowerCase().endsWith(".heic") &&
        !heicFile.toLowerCase().startsWith(".")
      ) {
        console.log(`Conversion Started: \t ${heicFile}`);

        const heicPath = path.join(heicDir, heicFile);
        const pngFileName = heicFile.replace(/\.heic$/i, ".png");
        const pngPath = path.join(pngDir, pngFileName);

        // const buffer = await convert({
        //   buffer: fs.readFileSync(heicPath),
        //   format: "PNG",
        // });

        (async () => {
          try {
            const pngBuffer = await convert({
              buffer: fs.readFileSync(heicPath),
              format: "PNG",
            });

            fs.writeFileSync(pngPath, pngBuffer);
            console.log(`Converted: \t${heicPath} \tto \t${pngPath}`);
          } catch (error) {
            console.error(`Error converting: \t${heicPath}: \t${error}`);
          }
        })();
      }
    }

    console.log("All conversions started.");
  } catch (error) {
    console.error("Error:", error);
  }
}

const heicDirectory = path.win32.normalize("./heic");
const pngDirectory = path.win32.normalize("./png");

convertHEICFilesToPNG(heicDirectory, pngDirectory)
  .then(() => {
    console.log("Program Completed!!!");
  })
  .catch((error) => {
    console.error("Program Error: ", error);
  });
